export type PhotoCapturedAtSource = "photo_exif" | "none";
export type PhotoLocationSource = "photo_exif" | "none";

export interface NormalizedPhotoExif {
  capturedAt: string | null;
  capturedAtSource: PhotoCapturedAtSource;
  hasExif: boolean;
  latitude: number | null;
  locationSource: PhotoLocationSource;
  longitude: number | null;
}

type ExifRecord = Record<string, unknown>;

const CAPTURED_AT_KEYS = [
  "DateTimeOriginal",
  "DateTimeDigitized",
  "DateTime",
  "CreateDate",
  "CreationDate",
  "ModifyDate",
] as const;

const OFFSET_TIME_KEYS = [
  "OffsetTimeOriginal",
  "OffsetTimeDigitized",
  "OffsetTime",
] as const;

const LATITUDE_KEYS = ["GPSLatitude", "Latitude", "latitude"] as const;
const LONGITUDE_KEYS = ["GPSLongitude", "Longitude", "longitude"] as const;
const LATITUDE_REF_KEYS = ["GPSLatitudeRef", "LatitudeRef", "latitudeRef"] as const;
const LONGITUDE_REF_KEYS = [
  "GPSLongitudeRef",
  "LongitudeRef",
  "longitudeRef",
] as const;

export function normalizePhotoExif(
  exif: Record<string, unknown> | null | undefined,
): NormalizedPhotoExif {
  const flatExif = flattenExifRecord(exif);
  const capturedAt = normalizeCapturedAt(flatExif);
  const coordinate = normalizeCoordinate(flatExif);

  return {
    capturedAt,
    capturedAtSource: capturedAt ? "photo_exif" : "none",
    hasExif: Object.keys(flatExif).length > 0,
    latitude: coordinate?.latitude ?? null,
    locationSource: coordinate ? "photo_exif" : "none",
    longitude: coordinate?.longitude ?? null,
  };
}

function flattenExifRecord(exif: Record<string, unknown> | null | undefined) {
  const flatExif: ExifRecord = {};

  if (!exif) {
    return flatExif;
  }

  for (const [key, value] of Object.entries(exif)) {
    if (isPlainObject(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        flatExif[nestedKey] = nestedValue;
        flatExif[`${key}.${nestedKey}`] = nestedValue;
      }
      continue;
    }

    flatExif[key] = value;
  }

  return flatExif;
}

function normalizeCapturedAt(exif: ExifRecord) {
  const rawCapturedAt = getFirstExifValue(exif, CAPTURED_AT_KEYS);
  const offsetTime = normalizeOffsetTime(getFirstExifValue(exif, OFFSET_TIME_KEYS));

  if (rawCapturedAt instanceof Date && Number.isFinite(rawCapturedAt.getTime())) {
    return rawCapturedAt.toISOString();
  }

  if (typeof rawCapturedAt === "number") {
    return normalizeNumericTimestamp(rawCapturedAt);
  }

  if (typeof rawCapturedAt !== "string") {
    return null;
  }

  const trimmed = rawCapturedAt.trim();

  if (!trimmed) {
    return null;
  }

  const exifDate = parseExifDateTime(trimmed, offsetTime);

  if (exifDate) {
    return exifDate;
  }

  const parsedDate = new Date(trimmed);

  if (!Number.isFinite(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

function parseExifDateTime(value: string, offsetTime: string | null) {
  const match = value.match(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:\s*(Z|[+-]\d{2}:?\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second,
    subSecond,
    inlineOffset,
  ] = match;
  const normalizedOffset = normalizeOffsetTime(inlineOffset) ?? offsetTime;

  if (normalizedOffset) {
    const isoValue = `${year}-${month}-${day}T${hour}:${minute}:${second}${formatMilliseconds(
      subSecond,
    )}${normalizedOffset}`;
    const parsedDate = new Date(isoValue);

    return Number.isFinite(parsedDate.getTime()) ? parsedDate.toISOString() : null;
  }

  const localDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    parseMilliseconds(subSecond),
  );

  return Number.isFinite(localDate.getTime()) ? localDate.toISOString() : null;
}

function normalizeNumericTimestamp(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  const timestampMs = value < 10_000_000_000 ? value * 1000 : value;
  const parsedDate = new Date(timestampMs);

  return Number.isFinite(parsedDate.getTime()) ? parsedDate.toISOString() : null;
}

function normalizeCoordinate(exif: ExifRecord) {
  const latitude = parseGpsCoordinate(
    getFirstExifValue(exif, LATITUDE_KEYS),
    getFirstExifValue(exif, LATITUDE_REF_KEYS),
  );
  const longitude = parseGpsCoordinate(
    getFirstExifValue(exif, LONGITUDE_KEYS),
    getFirstExifValue(exif, LONGITUDE_REF_KEYS),
  );

  if (
    latitude === null ||
    longitude === null ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function parseGpsCoordinate(value: unknown, ref: unknown) {
  const decimalValue = parseGpsCoordinateValue(value);

  if (decimalValue === null) {
    return null;
  }

  const direction = typeof ref === "string" ? ref.trim().toUpperCase() : "";
  const sign = direction === "S" || direction === "W" ? -1 : 1;

  return decimalValue < 0 ? decimalValue : decimalValue * sign;
}

function parseGpsCoordinateValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return parseDegreesMinutesSeconds(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const numericValue = Number(trimmed);

  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  const parts = trimmed
    .split(",")
    .map((part) => parseRationalNumber(part.trim()));

  if (parts.length >= 3 && parts.every((part) => part !== null)) {
    return degreesMinutesSecondsToDecimal(
      parts[0] ?? 0,
      parts[1] ?? 0,
      parts[2] ?? 0,
    );
  }

  return null;
}

function parseDegreesMinutesSeconds(values: unknown[]) {
  if (values.length < 3) {
    return null;
  }

  const degrees = parseRationalNumber(values[0]);
  const minutes = parseRationalNumber(values[1]);
  const seconds = parseRationalNumber(values[2]);

  if (degrees === null || minutes === null || seconds === null) {
    return null;
  }

  return degreesMinutesSecondsToDecimal(degrees, minutes, seconds);
}

function degreesMinutesSecondsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
) {
  return degrees + minutes / 60 + seconds / 3600;
}

function parseRationalNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const [numerator, denominator] = value.split("/").map(Number);

  if (Number.isFinite(numerator) && Number.isFinite(denominator)) {
    return denominator === 0 ? null : numerator / denominator;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function getFirstExifValue(
  exif: ExifRecord,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    if (exif[key] !== undefined && exif[key] !== null) {
      return exif[key];
    }
  }

  return null;
}

function normalizeOffsetTime(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "Z") {
    return "Z";
  }

  const match = trimmed.match(/^([+-])(\d{2}):?(\d{2})$/);

  if (!match) {
    return null;
  }

  return `${match[1]}${match[2]}:${match[3]}`;
}

function formatMilliseconds(value: string | undefined) {
  if (!value) {
    return "";
  }

  return `.${value.slice(0, 3).padEnd(3, "0")}`;
}

function parseMilliseconds(value: string | undefined) {
  if (!value) {
    return 0;
  }

  return Number(value.slice(0, 3).padEnd(3, "0"));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

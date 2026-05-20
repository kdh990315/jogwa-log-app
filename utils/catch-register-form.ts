import type {
  CatchLogWaterType,
  CreateCatchLogInput,
  EditableCatchLog,
  UpdateCatchLogInput,
} from "@/types/catch-log";
import type { FishSpecies } from "@/types/fish-species";

export interface SelectedCatchPhoto {
  fileSizeBytes?: number | null;
  heightPx?: number | null;
  id: string;
  mimeType?: string | null;
  storagePath?: string | null;
  uri: string;
  widthPx?: number | null;
}

export interface CatchFormValues {
  airTempC: string;
  count: string;
  fishingDate: string;
  latitude: number | null;
  longitude: number | null;
  memo: string;
  photos: SelectedCatchPhoto[];
  pointName: string;
  sizeCm: string;
  speciesName: string;
  tide: string;
  waterType: CatchLogWaterType;
  waterTempC: string;
  waveHeightM: string;
  weather: string;
  windSpeedMs: string;
}

export type CatchFormTextFieldName = Exclude<
  keyof CatchFormValues,
  "latitude" | "longitude" | "photos" | "waterType"
>;

export interface BuildCatchLogInputOptions {
  address?: string | null;
  addressSource?: CreateCatchLogInput["addressSource"];
  aiPredictionId?: number | null;
  capturedAtSource?: CreateCatchLogInput["capturedAtSource"];
  currentSpeedKn?: number | null;
  fishingIndexForecastId?: number | null;
  fishingIndexGrade?: string | null;
  fishingIndexScore?: number | null;
  fishingLocationId?: number | null;
  humidityPercent?: number | null;
  locationSource?: CreateCatchLogInput["locationSource"];
  precipitationAmountMm?: number | null;
  precipitationProbabilityPercent?: number | null;
  prefillSpeciesId?: number | null;
  prefillSpeciesName?: string | null;
  regionName?: string | null;
  speciesSource?: CreateCatchLogInput["speciesSource"];
  weatherForecastId?: number | null;
  weatherLocationId?: number | null;
  weatherSource?: CreateCatchLogInput["weatherSource"];
  windDirectionDeg?: number | null;
}

export const DEFAULT_CATCH_FORM_VALUES: CatchFormValues = {
  airTempC: "",
  count: "",
  fishingDate: "",
  latitude: null,
  longitude: null,
  memo: "",
  photos: [],
  pointName: "",
  sizeCm: "",
  speciesName: "",
  tide: "",
  waterType: "saltwater",
  waterTempC: "",
  waveHeightM: "",
  weather: "",
  windSpeedMs: "",
};

export function sanitizeIntegerInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function sanitizeDecimalInput(value: string) {
  const normalized = value.replace(/[^0-9.]/g, "");
  const [integer, ...decimal] = normalized.split(".");

  if (decimal.length === 0) {
    return integer;
  }

  return `${integer}.${decimal.join("")}`;
}

export function sanitizeSignedDecimalInput(value: string) {
  const hasLeadingMinus = value.trimStart().startsWith("-");
  const sanitized = sanitizeDecimalInput(value);

  return hasLeadingMinus && sanitized.length > 0 ? `-${sanitized}` : sanitized;
}

export function buildCreateCatchLogInput(
  values: CatchFormValues,
  fishSpeciesList: FishSpecies[],
  options: BuildCatchLogInputOptions = {},
): CreateCatchLogInput {
  return {
    ...buildCatchLogMutationBaseInput(values, fishSpeciesList, options),
    photos: values.photos.map((photo) => ({
      fileSizeBytes: photo.fileSizeBytes ?? null,
      heightPx: photo.heightPx ?? null,
      localUri: photo.uri,
      mimeType: photo.mimeType ?? null,
      storagePath: photo.storagePath ?? null,
      widthPx: photo.widthPx ?? null,
    })),
  };
}

export function buildUpdateCatchLogInput(
  values: CatchFormValues,
  fishSpeciesList: FishSpecies[],
): UpdateCatchLogInput {
  return {
    ...buildCatchLogMutationBaseInput(values, fishSpeciesList),
    photos: values.photos.map((photo) => {
      if (photo.storagePath) {
        return { storagePath: photo.storagePath };
      }

      return {
        fileSizeBytes: photo.fileSizeBytes ?? null,
        heightPx: photo.heightPx ?? null,
        localUri: photo.uri,
        mimeType: photo.mimeType ?? null,
        widthPx: photo.widthPx ?? null,
      };
    }),
  };
}

export function buildCatchFormValues(
  catchLog: EditableCatchLog,
): CatchFormValues {
  return {
    airTempC: catchLog.airTempC === null ? "" : String(catchLog.airTempC),
    count: String(catchLog.count),
    fishingDate: catchLog.fishingDate.replaceAll("-", "."),
    latitude: catchLog.latitude,
    longitude: catchLog.longitude,
    memo: catchLog.memo ?? "",
    photos: catchLog.images.map((image) => ({
      id: image.storagePath,
      storagePath: image.storagePath,
      uri: image.uri,
    })),
    pointName: catchLog.locationName ?? "",
    sizeCm: catchLog.sizeCm === null ? "" : String(catchLog.sizeCm),
    speciesName: catchLog.speciesName,
    tide: catchLog.tide ?? "",
    waterType: catchLog.waterType,
    waterTempC: catchLog.waterTempC === null ? "" : String(catchLog.waterTempC),
    waveHeightM:
      catchLog.waveHeightM === null ? "" : String(catchLog.waveHeightM),
    weather: catchLog.weather ?? "",
    windSpeedMs:
      catchLog.windSpeedMs === null ? "" : String(catchLog.windSpeedMs),
  };
}

function buildCatchLogMutationBaseInput(
  values: CatchFormValues,
  fishSpeciesList: FishSpecies[],
  options: BuildCatchLogInputOptions = {},
): Omit<CreateCatchLogInput, "photos"> {
  const speciesName = values.speciesName.trim();
  const matchingSpecies = fishSpeciesList.find(
    (fish) => fish.name === speciesName && fish.waterType === values.waterType,
  );
  const shouldUsePrefillSpeciesId =
    !matchingSpecies &&
    options.prefillSpeciesId !== null &&
    typeof options.prefillSpeciesId === "number" &&
    options.prefillSpeciesName === speciesName;

  return {
    address: options.address ?? null,
    addressSource: options.addressSource ?? null,
    aiPredictionId: options.aiPredictionId ?? null,
    airTempC: parseOptionalNumber(values.airTempC),
    capturedAtSource: options.capturedAtSource ?? null,
    count: Number(values.count),
    currentSpeedKn: options.currentSpeedKn ?? null,
    fishingIndexForecastId: options.fishingIndexForecastId ?? null,
    fishingIndexGrade: options.fishingIndexGrade ?? null,
    fishingIndexScore: options.fishingIndexScore ?? null,
    fishingLocationId: options.fishingLocationId ?? null,
    fishingDate: values.fishingDate.trim().replaceAll(".", "-"),
    humidityPercent: options.humidityPercent ?? null,
    latitude: values.latitude ?? null,
    locationName: values.pointName.trim() || null,
    locationSource: options.locationSource ?? null,
    longitude: values.longitude ?? null,
    memo: values.memo.trim() || null,
    precipitationAmountMm: options.precipitationAmountMm ?? null,
    precipitationProbabilityPercent:
      options.precipitationProbabilityPercent ?? null,
    regionName: options.regionName ?? null,
    sizeCm: values.sizeCm.trim() ? Number(values.sizeCm) : null,
    speciesId:
      matchingSpecies?.id ??
      (shouldUsePrefillSpeciesId ? options.prefillSpeciesId : null),
    speciesName,
    speciesSource: options.speciesSource ?? null,
    tide: values.tide.trim() || null,
    waterType: values.waterType,
    waterTempC: parseOptionalNumber(values.waterTempC),
    waveHeightM: parseOptionalNumber(values.waveHeightM),
    weather: values.weather.trim() || null,
    weatherForecastId: options.weatherForecastId ?? null,
    weatherLocationId: options.weatherLocationId ?? null,
    weatherSource: options.weatherSource ?? null,
    windDirectionDeg: options.windDirectionDeg ?? null,
    windSpeedMs: parseOptionalNumber(values.windSpeedMs),
  };
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? Number(trimmed) : null;
}

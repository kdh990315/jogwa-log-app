import { normalizePhotoExif } from "@/utils/photo-exif";

describe("normalizePhotoExif", () => {
  it("normalizes EXIF captured date with timezone offset and decimal GPS", () => {
    const result = normalizePhotoExif({
      DateTimeOriginal: "2026:05:18 07:30:15",
      GPSLatitude: 35.179554,
      GPSLongitude: 129.075642,
      OffsetTimeOriginal: "+09:00",
    });

    expect(result).toEqual({
      capturedAt: "2026-05-17T22:30:15.000Z",
      capturedAtSource: "photo_exif",
      hasExif: true,
      latitude: 35.179554,
      locationSource: "photo_exif",
      longitude: 129.075642,
    });
  });

  it("normalizes rational DMS GPS values with south and west refs", () => {
    const result = normalizePhotoExif({
      GPSLatitude: ["35/1", "10/1", "464/10"],
      GPSLatitudeRef: "S",
      GPSLongitude: "129/1, 4/1, 322/10",
      GPSLongitudeRef: "W",
    });

    expect(result.latitude).toBeCloseTo(-35.179555, 5);
    expect(result.longitude).toBeCloseTo(-129.075611, 5);
    expect(result.locationSource).toBe("photo_exif");
  });

  it("normalizes nested GPS dictionaries from iOS-style EXIF payloads", () => {
    const result = normalizePhotoExif({
      "{GPS}": {
        GPSLatitude: 35.179554,
        GPSLongitude: 129.075642,
      },
      "{TIFF}": {
        DateTime: "2026:05:18 07:30:15",
      },
    });

    expect(result.hasExif).toBe(true);
    expect(result.latitude).toBe(35.179554);
    expect(result.longitude).toBe(129.075642);
    expect(result.capturedAtSource).toBe("photo_exif");
  });

  it("returns none sources when EXIF has no usable date or GPS", () => {
    const result = normalizePhotoExif({
      Make: "Camera",
    });

    expect(result).toEqual({
      capturedAt: null,
      capturedAtSource: "none",
      hasExif: true,
      latitude: null,
      locationSource: "none",
      longitude: null,
    });
  });
});

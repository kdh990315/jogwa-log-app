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
  weather: string;
}

export type CatchFormTextFieldName = Exclude<
  keyof CatchFormValues,
  "latitude" | "longitude" | "photos" | "waterType"
>;

export interface BuildCatchLogInputOptions {
  aiPredictionId?: number | null;
  prefillSpeciesId?: number | null;
  prefillSpeciesName?: string | null;
}

export const DEFAULT_CATCH_FORM_VALUES: CatchFormValues = {
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
  weather: "",
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
    weather: catchLog.weather ?? "",
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
    aiPredictionId: options.aiPredictionId ?? null,
    count: Number(values.count),
    fishingDate: values.fishingDate.trim().replaceAll(".", "-"),
    latitude: values.latitude ?? null,
    locationName: values.pointName.trim() || null,
    longitude: values.longitude ?? null,
    memo: values.memo.trim() || null,
    sizeCm: values.sizeCm.trim() ? Number(values.sizeCm) : null,
    speciesId:
      matchingSpecies?.id ??
      (shouldUsePrefillSpeciesId ? options.prefillSpeciesId : null),
    speciesName,
    tide: values.tide.trim() || null,
    waterType: values.waterType,
    weather: values.weather.trim() || null,
  };
}

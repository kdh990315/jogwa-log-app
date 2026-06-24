export type WaterType = "salt" | "fresh";

export type CatchLogWaterType = "saltwater" | "freshwater";

export type CatchLogCapturedAtSource =
  | "photo_exif"
  | "device_time"
  | "manual"
  | "none";

export type CatchLogLocationSource =
  | "photo_exif"
  | "current_gps"
  | "map"
  | "manual"
  | "none";

export type CatchLogAddressSource = "kakao_local" | "none";

export type CatchLogWeatherSource = "stored_weather" | "none";

export type CatchLogSpeciesSource = "gemini" | "none";

export type CatchLogEntryView = "latest" | "points";

export type CatchLogListFilter =
  | "latest"
  | "largest"
  | "species"
  | "points";

export interface CatchLogListQuery {
  filter: CatchLogListFilter;
  searchQuery: string;
  waterType: WaterType;
}

export interface CreateCatchLogImageInput {
  fileSizeBytes?: number | null;
  heightPx?: number | null;
  localUri: string;
  mimeType?: string | null;
  storagePath?: string | null;
  widthPx?: number | null;
}

export interface CreateCatchLogInput {
  address?: string | null;
  addressSource?: CatchLogAddressSource | null;
  aiPredictionId?: number | null;
  airTempC?: number | null;
  count: number;
  capturedAtSource?: CatchLogCapturedAtSource | null;
  currentSpeedKn?: number | null;
  fishingIndexForecastId?: number | null;
  fishingIndexGrade?: string | null;
  fishingIndexScore?: number | null;
  fishingLocationId?: number | null;
  fishingDate: string;
  humidityPercent?: number | null;
  latitude?: number | null;
  locationName?: string | null;
  locationSource?: CatchLogLocationSource | null;
  longitude?: number | null;
  memo?: string | null;
  photos: CreateCatchLogImageInput[];
  precipitationAmountMm?: number | null;
  precipitationProbabilityPercent?: number | null;
  regionName?: string | null;
  sizeCm?: number | null;
  speciesId?: number | null;
  speciesName: string;
  speciesSource?: CatchLogSpeciesSource | null;
  tide?: string | null;
  waterType: CatchLogWaterType;
  waterTempC?: number | null;
  waveHeightM?: number | null;
  weather?: string | null;
  weatherForecastId?: number | null;
  weatherLocationId?: number | null;
  weatherSource?: CatchLogWeatherSource | null;
  windDirectionDeg?: number | null;
  windSpeedMs?: number | null;
}

export interface UpdateCatchLogExistingImageInput {
  storagePath: string;
}

export type UpdateCatchLogImageInput =
  | CreateCatchLogImageInput
  | UpdateCatchLogExistingImageInput;

export interface UpdateCatchLogInput
  extends Omit<CreateCatchLogInput, "photos"> {
  photos: UpdateCatchLogImageInput[];
}

export interface CreatedCatchLog {
  id: number;
  imagePaths: string[];
}

export interface UpdatedCatchLog {
  id: number;
}

export interface CatchLogSpeciesItem {
  count: number;
  sizeCm: number | null;
  sortOrder: number;
  speciesId: number | null;
  speciesName: string;
}

export interface CatchLogListItem {
  count: number;
  fishingDate: string;
  id: number;
  latitude: number | null;
  longitude: number | null;
  pointName: string | null;
  sizeCm: number | null;
  speciesId: number | null;
  speciesItems: CatchLogSpeciesItem[];
  speciesName: string;
  tide: string | null;
  type: WaterType;
}

export interface CatchLogSpeciesSection {
  data: CatchLogListItem[];
  speciesName: string;
  totalRecords: number;
}

export interface CatchLogPointGroup {
  lastDate: string;
  mainSpecies: string;
  pointName: string;
  totalCatchCount: number;
  totalRecords: number;
}

export type CatchLogListResult =
  | {
      items: CatchLogListItem[];
      view: "list";
    }
  | {
      sections: CatchLogSpeciesSection[];
      view: "species";
    }
  | {
      groups: CatchLogPointGroup[];
      view: "points";
    };

export interface CatchLogDetailItem {
  id: number;
  airTempC: number | null;
  count: number;
  fishingDate: string;
  images: string[];
  isKkwang: boolean;
  latitude: number | null;
  longitude: number | null;
  memo: string | null;
  pointName: string | null;
  sizeCm: number | null;
  speciesItems: CatchLogSpeciesItem[];
  speciesName: string;
  tide: string | null;
  type: WaterType;
  waterTempC: number | null;
  waveHeightM: number | null;
  weather: string | null;
  windSpeedMs: number | null;
}

export interface EditableCatchLogImage {
  storagePath: string;
  uri: string;
}

export interface EditableCatchLog {
  airTempC: number | null;
  count: number;
  fishingDate: string;
  id: number;
  images: EditableCatchLogImage[];
  latitude: number | null;
  locationName: string | null;
  longitude: number | null;
  memo: string | null;
  sizeCm: number | null;
  speciesId: number | null;
  speciesItems: CatchLogSpeciesItem[];
  speciesName: string;
  tide: string | null;
  waterType: CatchLogWaterType;
  waterTempC: number | null;
  waveHeightM: number | null;
  weather: string | null;
  windSpeedMs: number | null;
}

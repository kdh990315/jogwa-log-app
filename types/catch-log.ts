export type WaterType = "salt" | "fresh";

export type CatchLogWaterType = "saltwater" | "freshwater";

export type CatchLogEntryView = "recent" | "points";

export type CatchLogListFilter = "최신순" | "최대어순" | "어종별" | "포인트별";

export interface CreateCatchLogImageInput {
  fileSizeBytes?: number | null;
  heightPx?: number | null;
  localUri: string;
  mimeType?: string | null;
  widthPx?: number | null;
}

export interface CreateCatchLogInput {
  aiPredictionId?: number | null;
  count: number;
  fishingDate: string;
  latitude?: number | null;
  locationName?: string | null;
  longitude?: number | null;
  memo?: string | null;
  photos: CreateCatchLogImageInput[];
  sizeCm?: number | null;
  speciesId?: number | null;
  speciesName: string;
  tide?: string | null;
  waterType: CatchLogWaterType;
  weather?: string | null;
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

export interface CatchLogListItem {
  id: number;
  species: string;
  speciesId: number | null;
  sizeCm: number | null;
  count: number;
  date: string;
  latitude: number | null;
  location: string;
  longitude: number | null;
  tide: string;
  type: WaterType;
}

export interface CatchLogDetailItem {
  id: number;
  count: number;
  date: string;
  images: string[];
  isKkwang: boolean;
  latitude: number | null;
  longitude: number | null;
  memo: string;
  point: string;
  sizeCm: number | null;
  species: string;
  tide: string;
  type: WaterType;
  weather: string;
}

export interface EditableCatchLogImage {
  storagePath: string;
  uri: string;
}

export interface EditableCatchLog {
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
  speciesName: string;
  tide: string | null;
  waterType: CatchLogWaterType;
  weather: string | null;
}

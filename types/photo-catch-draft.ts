import type { CatchLogWaterType } from "@/types/catch-log";

export type PhotoCatchDraftCapturedAtSource =
  | "photo_exif"
  | "device_time"
  | "manual"
  | "none";

export type PhotoCatchDraftLocationSource =
  | "photo_exif"
  | "current_gps"
  | "map"
  | "manual"
  | "none";

export interface CreatePhotoCatchDraftRequest {
  capturedAt?: string | null;
  capturedAtSource: PhotoCatchDraftCapturedAtSource;
  imagePath: string;
  latitude?: number | null;
  locationSource: PhotoCatchDraftLocationSource;
  longitude?: number | null;
  waterType: CatchLogWaterType;
}

export interface PhotoCatchDraftSpeciesCandidate {
  confidence: number;
  reason: string;
  speciesId: number | null;
  speciesName: string;
}

export interface PhotoCatchDraftSources {
  address: "kakao_local" | "none";
  capturedAt: PhotoCatchDraftCapturedAtSource;
  location: PhotoCatchDraftLocationSource;
  species: "gemini" | "none";
  weather: "kma" | "stored_weather" | "none";
}

export interface PhotoCatchDraftResponse {
  address: string | null;
  airTempC: number | null;
  capturedAt: string | null;
  currentSpeedKn: number | null;
  fishingIndexForecastId: number | null;
  fishingIndexGrade: string | null;
  fishingIndexScore: number | null;
  fishingLocationId: number | null;
  humidityPercent: number | null;
  imagePath: string;
  latitude: number | null;
  longitude: number | null;
  pointName: string | null;
  precipitationAmountMm: number | null;
  precipitationProbabilityPercent: number | null;
  predictionId: number | null;
  regionName: string | null;
  sources: PhotoCatchDraftSources;
  speciesCandidates: PhotoCatchDraftSpeciesCandidate[];
  tide: string | null;
  waterTempC: number | null;
  waveHeightM: number | null;
  weather: string | null;
  weatherForecastId: number | null;
  weatherLocationId: number | null;
  windDirectionDeg: number | null;
  windSpeedMs: number | null;
}

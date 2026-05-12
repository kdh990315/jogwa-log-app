import type { CatchLogWaterType } from "@/types/catch-log";

export const AI_SPECIES_MODEL = "gemini-3.1-flash-lite-preview" as const;

export interface AiSpeciesImageInput {
  fileSizeBytes?: number | null;
  heightPx?: number | null;
  localUri: string;
  mimeType?: string | null;
  widthPx?: number | null;
}

export interface DetectFishSpeciesInput {
  image: AiSpeciesImageInput;
  waterType?: CatchLogWaterType;
}

export interface AiSpeciesCandidate {
  confidence: number;
  reason: string;
  speciesId: number | null;
  speciesName: string;
}

export interface AiSpeciesUsage {
  candidatesTokenCount?: number;
  promptTokenCount?: number;
  totalTokenCount?: number;
}

export interface DetectFishSpeciesResult {
  candidates: AiSpeciesCandidate[];
  imagePath: string;
  model: typeof AI_SPECIES_MODEL;
  predictionId: number | null;
  usage?: AiSpeciesUsage;
}

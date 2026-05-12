export type FishSpeciesWaterType = "freshwater" | "saltwater";

export interface FishSpecies {
  id: number;
  locationTypeId: 1 | 2;
  name: string;
  waterType: FishSpeciesWaterType;
}

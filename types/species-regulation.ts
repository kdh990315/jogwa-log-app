export type SpeciesRegulationKind =
  | "closed_season"
  | "minimum_length"
  | "minimum_weight"
  | "prohibited_length_range";

export interface SpeciesRegulation {
  effectiveFrom: string;
  effectiveTo: string | null;
  exceptionNote: string | null;
  id: number;
  measurementBasis: string | null;
  methodNote: string | null;
  minLengthCm: number | null;
  minWeightG: number | null;
  periodEndDay: number | null;
  periodEndMonth: number | null;
  periodStartDay: number | null;
  periodStartMonth: number | null;
  prohibitedLengthMaxCm: number | null;
  prohibitedLengthMinCm: number | null;
  regionNote: string | null;
  regulationKind: SpeciesRegulationKind;
  sourceTitle: string;
  sourceUrl: string;
  speciesId: number;
}

import { ensureSupabaseAuthConfig, supabase } from "@/api/supabase";
import type {
  SpeciesRegulation,
  SpeciesRegulationKind,
} from "@/types/species-regulation";

interface SpeciesRegulationRow {
  effective_from: string;
  effective_to: string | null;
  exception_note: string | null;
  id: number;
  measurement_basis: string | null;
  method_note: string | null;
  min_length_cm: number | null;
  min_weight_g: number | null;
  period_end_day: number | null;
  period_end_month: number | null;
  period_start_day: number | null;
  period_start_month: number | null;
  prohibited_length_max_cm: number | null;
  prohibited_length_min_cm: number | null;
  region_note: string | null;
  regulation_kind: SpeciesRegulationKind;
  source_title: string;
  source_url: string;
  species_id: number;
}

export async function getCurrentSpeciesRegulations(
  speciesId: number,
): Promise<SpeciesRegulation[]> {
  ensureSupabaseAuthConfig();

  const today = formatDateValue(new Date());
  const { data, error } = await supabase
    .from("species_regulations")
    .select(
      [
        "id",
        "species_id",
        "regulation_kind",
        "period_start_month",
        "period_start_day",
        "period_end_month",
        "period_end_day",
        "min_length_cm",
        "min_weight_g",
        "prohibited_length_min_cm",
        "prohibited_length_max_cm",
        "region_note",
        "method_note",
        "exception_note",
        "measurement_basis",
        "source_title",
        "source_url",
        "effective_from",
        "effective_to",
      ].join(", "),
    )
    .eq("species_id", speciesId)
    .lte("effective_from", today)
    .or(`effective_to.is.null,effective_to.gte.${today}`)
    .order("regulation_kind", { ascending: true })
    .order("effective_from", { ascending: false })
    .returns<SpeciesRegulationRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSpeciesRegulation);
}

function mapSpeciesRegulation(row: SpeciesRegulationRow): SpeciesRegulation {
  return {
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    exceptionNote: row.exception_note,
    id: row.id,
    measurementBasis: row.measurement_basis,
    methodNote: row.method_note,
    minLengthCm: row.min_length_cm,
    minWeightG: row.min_weight_g,
    periodEndDay: row.period_end_day,
    periodEndMonth: row.period_end_month,
    periodStartDay: row.period_start_day,
    periodStartMonth: row.period_start_month,
    prohibitedLengthMaxCm: row.prohibited_length_max_cm,
    prohibitedLengthMinCm: row.prohibited_length_min_cm,
    regionNote: row.region_note,
    regulationKind: row.regulation_kind,
    sourceTitle: row.source_title,
    sourceUrl: row.source_url,
    speciesId: row.species_id,
  };
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

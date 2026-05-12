import { ensureSupabaseAuthConfig, supabase } from "@/api/supabase";
import type { FishSpecies } from "@/types/fish-species";

interface FishSpeciesRow {
  id: number;
  location_type: 1 | 2;
  name: string;
}

export async function getFishSpeciesList(): Promise<FishSpecies[]> {
  ensureSupabaseAuthConfig();

  const { data, error } = await supabase
    .from("fish_species")
    .select("id, name, location_type")
    .returns<FishSpeciesRow[]>()
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    locationTypeId: item.location_type,
    name: item.name,
    waterType: item.location_type === 1 ? "freshwater" : "saltwater",
  }));
}

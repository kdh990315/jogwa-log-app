import { useQuery } from "@tanstack/react-query";

import { getFishSpeciesList } from "@/api/fish-species";
import { fishSpeciesKeys } from "@/constants/query-keys";

const FISH_SPECIES_STALE_TIME = 1000 * 60 * 60 * 24;

export function useFishSpecies() {
  return useQuery({
    gcTime: FISH_SPECIES_STALE_TIME,
    queryFn: getFishSpeciesList,
    queryKey: fishSpeciesKeys.list(),
    staleTime: FISH_SPECIES_STALE_TIME,
  });
}

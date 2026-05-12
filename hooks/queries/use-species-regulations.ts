import { useQuery } from "@tanstack/react-query";

import { getCurrentSpeciesRegulations } from "@/api/species-regulations";
import { speciesRegulationKeys } from "@/constants/query-keys";

const SPECIES_REGULATIONS_STALE_TIME = 1000 * 60 * 60 * 24;

export function useCurrentSpeciesRegulations(speciesId: number | null) {
  return useQuery({
    enabled: typeof speciesId === "number",
    gcTime: SPECIES_REGULATIONS_STALE_TIME,
    queryFn: () => {
      if (typeof speciesId !== "number") {
        return [];
      }

      return getCurrentSpeciesRegulations(speciesId);
    },
    queryKey: speciesRegulationKeys.currentBySpecies(speciesId),
    staleTime: SPECIES_REGULATIONS_STALE_TIME,
  });
}

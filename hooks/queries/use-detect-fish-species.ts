import { useMutation } from "@tanstack/react-query";

import { detectFishSpecies } from "@/api/ai-species";
import type { DetectFishSpeciesInput } from "@/types/ai-species";

export function useDetectFishSpecies() {
  return useMutation({
    mutationFn: (input: DetectFishSpeciesInput) => detectFishSpecies(input),
  });
}

import { useMutation } from "@tanstack/react-query";

import { createPhotoCatchDraft } from "@/api/photo-catch-draft";
import type { CreatePhotoCatchDraftRequest } from "@/types/photo-catch-draft";

export function useCreatePhotoCatchDraft() {
  return useMutation({
    mutationFn: (input: CreatePhotoCatchDraftRequest) =>
      createPhotoCatchDraft(input),
  });
}

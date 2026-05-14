import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCatchLog } from "@/api/catch-logs";
import { catchLogKeys } from "@/constants/query-keys";
import type { CreateCatchLogInput } from "@/types/catch-log";

export function useCreateCatchLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCatchLogInput) => createCatchLog(input),
    onSuccess: (createdCatchLog) => {
      void queryClient.invalidateQueries({ queryKey: catchLogKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: catchLogKeys.detail(createdCatchLog.id),
      });
    },
  });
}

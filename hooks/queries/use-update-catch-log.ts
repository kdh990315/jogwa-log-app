import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateCatchLog } from "@/api/catch-logs";
import { catchLogKeys } from "@/constants/query-keys";
import type { UpdateCatchLogInput } from "@/types/catch-log";

interface UpdateCatchLogVariables {
  catchLogId: number;
  input: UpdateCatchLogInput;
}

export function useUpdateCatchLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: UpdateCatchLogVariables) =>
      updateCatchLog(variables),
    onSuccess: (_updatedCatchLog, variables) => {
      void queryClient.invalidateQueries({ queryKey: catchLogKeys.myList() });
      void queryClient.invalidateQueries({
        queryKey: catchLogKeys.detail(variables.catchLogId),
      });
      void queryClient.invalidateQueries({
        queryKey: catchLogKeys.edit(variables.catchLogId),
      });
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteCatchLog } from "@/api/catch-logs";
import { catchLogKeys } from "@/constants/query-keys";

export function useDeleteCatchLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (catchLogId: number) => deleteCatchLog(catchLogId),
    onSuccess: (_data, catchLogId) => {
      void queryClient.invalidateQueries({ queryKey: catchLogKeys.lists() });
      queryClient.removeQueries({ queryKey: catchLogKeys.detail(catchLogId) });
      queryClient.removeQueries({ queryKey: catchLogKeys.edit(catchLogId) });
    },
  });
}

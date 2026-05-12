import { useQuery } from "@tanstack/react-query";

import {
  getCatchLog,
  getEditableCatchLog,
  getMyCatchLogs,
} from "@/api/catch-logs";
import { catchLogKeys } from "@/constants/query-keys";

export function useMyCatchLogs() {
  return useQuery({
    queryFn: getMyCatchLogs,
    queryKey: catchLogKeys.myList(),
  });
}

export function useCatchLog(catchLogId: number, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getCatchLog(catchLogId),
    queryKey: catchLogKeys.detail(catchLogId),
  });
}

export function useEditableCatchLog(catchLogId: number, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getEditableCatchLog(catchLogId),
    queryKey: catchLogKeys.edit(catchLogId),
  });
}

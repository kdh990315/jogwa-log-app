import { useQuery } from "@tanstack/react-query";

import {
  getCatchLogList,
  getCatchLog,
  getEditableCatchLog,
  getHomeCatchLogs,
  getMapCatchLogs,
  getSpeciesDexCatchLogs,
} from "@/api/catch-logs";
import { catchLogKeys } from "@/constants/query-keys";

export function useCatchLogList() {
  return useQuery({
    queryFn: getCatchLogList,
    queryKey: catchLogKeys.catchLogList(),
  });
}

export function useHomeCatchLogs() {
  return useQuery({
    queryFn: getHomeCatchLogs,
    queryKey: catchLogKeys.homeList(),
  });
}

export function useMapCatchLogs() {
  return useQuery({
    queryFn: getMapCatchLogs,
    queryKey: catchLogKeys.mapList(),
  });
}

export function useSpeciesDexCatchLogs() {
  return useQuery({
    queryFn: getSpeciesDexCatchLogs,
    queryKey: catchLogKeys.speciesDexList(),
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

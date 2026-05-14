import { useQuery } from "@tanstack/react-query";

import { getNotice, getNotices } from "@/api/notices";
import { noticeKeys } from "@/constants/query-keys";

const NOTICES_STALE_TIME = 1000 * 60 * 5;

export function useNotices() {
  return useQuery({
    gcTime: NOTICES_STALE_TIME,
    queryFn: getNotices,
    queryKey: noticeKeys.list(),
    staleTime: NOTICES_STALE_TIME,
  });
}

export function useNotice(noticeId: string | null) {
  return useQuery({
    enabled: typeof noticeId === "string" && noticeId.length > 0,
    gcTime: NOTICES_STALE_TIME,
    queryFn: () => {
      if (!noticeId) {
        return null;
      }

      return getNotice(noticeId);
    },
    queryKey: noticeKeys.detail(noticeId),
    staleTime: NOTICES_STALE_TIME,
  });
}

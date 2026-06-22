import type { CatchLogListFilter } from "@/types/catch-log";

export const CATCH_LOG_FILTERS = [
  { label: "최신순", value: "latest" },
  { label: "최대어순", value: "largest" },
  { label: "어종별", value: "species" },
  { label: "포인트별", value: "points" },
] as const satisfies readonly {
  label: string;
  value: CatchLogListFilter;
}[];

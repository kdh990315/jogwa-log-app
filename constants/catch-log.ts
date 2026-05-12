import type { CatchLogListFilter } from "@/types/catch-log";

export const CATCH_LOG_FILTERS: CatchLogListFilter[] = [
  "최신순",
  "최대어순",
  "어종별",
  "포인트별",
];

export function formatCatchSize(sizeCm: number | null): string | null {
  if (!sizeCm || sizeCm <= 0) {
    return null;
  }

  return `${sizeCm}cm`;
}

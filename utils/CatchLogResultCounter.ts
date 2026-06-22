import type { CatchLogListResult } from "@/types/catch-log";

export function getCatchLogResultCount(result?: CatchLogListResult) {
  if (!result) {
    return 0;
  }

  if (result.view === "list") {
    return result.items.length;
  }

  if (result.view === "species") {
    return result.sections.reduce(
      (total, section) => total + section.totalRecords,
      0,
    );
  }

  return result.groups.reduce(
    (total, group) => total + group.totalRecords,
    0,
  );
}

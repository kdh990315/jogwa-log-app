import type { CatchLogListItem } from "@/types/catch-log";
import type { FishSpecies } from "@/types/fish-species";

export interface CaughtSpeciesStats {
  maxSizeCm: number | null;
  recentCatchLogId: number | null;
  recentDate: string | null;
  recordCount: number;
  totalCatchCount: number;
}

export interface CaughtSpeciesStatsByIdentity {
  byId: Map<number, CaughtSpeciesStats>;
}

export const emptyCaughtSpeciesStats: CaughtSpeciesStats = {
  maxSizeCm: null,
  recentCatchLogId: null,
  recentDate: null,
  recordCount: 0,
  totalCatchCount: 0,
};

export function buildCaughtSpeciesStats(
  catchLogItems: CatchLogListItem[],
): CaughtSpeciesStatsByIdentity {
  return catchLogItems.reduce<CaughtSpeciesStatsByIdentity>(
    (stats, item) => {
      if (item.count <= 0) {
        return stats;
      }

      if (typeof item.speciesId === "number") {
        upsertCaughtSpeciesStats(stats.byId, item.speciesId, item);
      }

      return stats;
    },
    {
      byId: new Map<number, CaughtSpeciesStats>(),
    },
  );
}

export function getCaughtStatsForFishSpecies(
  stats: CaughtSpeciesStatsByIdentity,
  fishSpecies: FishSpecies,
) {
  const idStats = stats.byId.get(fishSpecies.id);

  return idStats ?? emptyCaughtSpeciesStats;
}

export function getCatchLogsForFishSpecies(
  catchLogItems: CatchLogListItem[],
  fishSpecies: FishSpecies,
) {
  return catchLogItems
    .filter((item) => {
      if (item.count <= 0) {
        return false;
      }

      return item.speciesId === fishSpecies.id;
    })
    .sort(
      (left, right) =>
        getDateValue(right.fishingDate) - getDateValue(left.fishingDate),
    );
}

function upsertCaughtSpeciesStats(
  statsMap: Map<number | string, CaughtSpeciesStats>,
  key: number | string,
  item: CatchLogListItem,
) {
  const current = statsMap.get(key) ?? emptyCaughtSpeciesStats;
  const isRecent =
    !current.recentDate ||
    getDateValue(item.fishingDate) > getDateValue(current.recentDate);

  statsMap.set(key, {
    maxSizeCm: getMaxSizeCm(current.maxSizeCm, item.sizeCm),
    recentCatchLogId: isRecent ? item.id : current.recentCatchLogId,
    recentDate: isRecent ? item.fishingDate : current.recentDate,
    recordCount: current.recordCount + 1,
    totalCatchCount: current.totalCatchCount + item.count,
  });
}

function getMaxSizeCm(currentSizeCm: number | null, nextSizeCm: number | null) {
  if (!nextSizeCm || nextSizeCm <= 0) {
    return currentSizeCm;
  }

  return currentSizeCm ? Math.max(currentSizeCm, nextSizeCm) : nextSizeCm;
}

function getDateValue(date: string) {
  const timestamp = new Date(date).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

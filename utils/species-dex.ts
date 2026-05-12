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
  byName: Map<string, CaughtSpeciesStats>;
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

      upsertCaughtSpeciesStats(
        stats.byName,
        getCatchLogSpeciesNameKey(item),
        item,
      );

      return stats;
    },
    {
      byId: new Map<number, CaughtSpeciesStats>(),
      byName: new Map<string, CaughtSpeciesStats>(),
    },
  );
}

export function getCaughtStatsForFishSpecies(
  stats: CaughtSpeciesStatsByIdentity,
  fishSpecies: FishSpecies,
) {
  const nameStats = stats.byName.get(getFishSpeciesNameKey(fishSpecies));
  const idStats = stats.byId.get(fishSpecies.id);

  return nameStats ?? idStats ?? emptyCaughtSpeciesStats;
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

      return (
        item.speciesId === fishSpecies.id ||
        (item.species === fishSpecies.name &&
          item.type === getCatchLogWaterType(fishSpecies))
      );
    })
    .sort((left, right) => getDateValue(right.date) - getDateValue(left.date));
}

function upsertCaughtSpeciesStats(
  statsMap: Map<number | string, CaughtSpeciesStats>,
  key: number | string,
  item: CatchLogListItem,
) {
  const current = statsMap.get(key) ?? emptyCaughtSpeciesStats;
  const isRecent =
    !current.recentDate ||
    getDateValue(item.date) > getDateValue(current.recentDate);

  statsMap.set(key, {
    maxSizeCm: getMaxSizeCm(current.maxSizeCm, item.sizeCm),
    recentCatchLogId: isRecent ? item.id : current.recentCatchLogId,
    recentDate: isRecent ? item.date : current.recentDate,
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

function getFishSpeciesNameKey(fishSpecies: FishSpecies) {
  return `${getCatchLogWaterType(fishSpecies)}:${fishSpecies.name}`;
}

function getCatchLogSpeciesNameKey(item: CatchLogListItem) {
  return `${item.type}:${item.species}`;
}

function getCatchLogWaterType(fishSpecies: FishSpecies) {
  return fishSpecies.waterType === "freshwater" ? "fresh" : "salt";
}

function getDateValue(date: string) {
  const timestamp = new Date(date).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

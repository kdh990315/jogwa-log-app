import type { CatchLogListItem, WaterType } from "@/types/catch-log";

export interface HomeStats {
  bestConditionLabel: string;
  bestConditionSubText: string | null;
  bestConditionValue: string;
  bestLocations: BestLocationItem[];
  maxSize: string;
  maxSpecies: string;
  monthlyCatchTrend: MonthlyCatchTrendItem[];
  recentCatches: CatchLogListItem[];
  tidePerformance: TidePerformanceItem[];
  totalCount: number;
  totalCountDeltaLabel: string | null;
  winRate: number;
  winRateDeltaLabel: string | null;
}

export interface BestLocationItem {
  catchCount: number;
  name: string;
}

export interface MonthlyCatchTrendItem {
  label: string;
  value: number;
}

export interface TidePerformanceItem {
  catchCount: number;
  label: string;
  value: number;
}

const MONTH_LABELS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];
const RECENT_CATCH_LIMIT = 5;

export function getHomeStats({
  catchLogItems,
  category,
  year,
}: {
  catchLogItems: CatchLogListItem[];
  category: WaterType;
  year: number;
}): HomeStats {
  const filteredItems = catchLogItems.filter((item) => item.type === category);
  const currentYearItems = filteredItems.filter(
    (item) => getDateYear(item.date) === year,
  );
  const previousYearItems = filteredItems.filter(
    (item) => getDateYear(item.date) === year - 1,
  );
  const totalCount = getTotalCount(currentYearItems);
  const previousTotalCount = getTotalCount(previousYearItems);
  const winRate = getWinRate(currentYearItems);
  const previousWinRate = getWinRate(previousYearItems);
  const maxSizeItem = getMaxSizeItem(currentYearItems);
  const bestLocations = getBestLocations(currentYearItems);
  const tidePerformance = buildTidePerformance(currentYearItems);
  const bestTide = tidePerformance[0] ?? null;
  const bestLocation = bestLocations[0] ?? null;
  const bestConditionCatchCount =
    category === "salt" ? bestTide?.catchCount : bestLocation?.catchCount;

  return {
    bestConditionLabel: category === "salt" ? "최고 물때" : "최고 포인트",
    bestConditionSubText:
      typeof bestConditionCatchCount === "number"
        ? `${bestConditionCatchCount}마리`
        : null,
    bestConditionValue:
      category === "salt" ? bestTide?.label ?? "-" : bestLocation?.name ?? "-",
    bestLocations,
    maxSize: maxSizeItem?.sizeCm ? `${maxSizeItem.sizeCm}cm` : "-",
    maxSpecies: maxSizeItem?.species ?? "-",
    monthlyCatchTrend: buildMonthlyCatchTrend(currentYearItems),
    recentCatches: filteredItems.slice(0, RECENT_CATCH_LIMIT),
    tidePerformance,
    totalCount,
    totalCountDeltaLabel: getCountDeltaLabel({
      currentValue: totalCount,
      previousRecordCount: previousYearItems.length,
      previousValue: previousTotalCount,
    }),
    winRate,
    winRateDeltaLabel: getPercentPointDeltaLabel({
      currentValue: winRate,
      previousRecordCount: previousYearItems.length,
      previousValue: previousWinRate,
    }),
  };
}

export function getTotalCount(items: CatchLogListItem[]) {
  return items.reduce((sum, item) => sum + item.count, 0);
}

export function getWinRate(items: CatchLogListItem[]) {
  if (items.length === 0) {
    return 0;
  }

  const successCount = items.filter((item) => item.count > 0).length;

  return Math.round((successCount / items.length) * 100);
}

function getCountDeltaLabel({
  currentValue,
  previousRecordCount,
  previousValue,
}: {
  currentValue: number;
  previousRecordCount: number;
  previousValue: number;
}) {
  if (previousRecordCount === 0) {
    return currentValue > 0 ? "작년 기록 없음" : null;
  }

  const delta = currentValue - previousValue;

  if (delta > 0) {
    return `+${delta}마리`;
  }

  if (delta < 0) {
    return `${delta}마리`;
  }

  return "변동 없음";
}

function getPercentPointDeltaLabel({
  currentValue,
  previousRecordCount,
  previousValue,
}: {
  currentValue: number;
  previousRecordCount: number;
  previousValue: number;
}) {
  if (previousRecordCount === 0) {
    return currentValue > 0 ? "작년 기록 없음" : null;
  }

  const delta = currentValue - previousValue;

  if (delta > 0) {
    return `+${delta}%p`;
  }

  if (delta < 0) {
    return `${delta}%p`;
  }

  return "변동 없음";
}

function getMaxSizeItem(items: CatchLogListItem[]) {
  return items.reduce<CatchLogListItem | null>((maxItem, item) => {
    if (!item.sizeCm) {
      return maxItem;
    }

    if (!maxItem?.sizeCm || item.sizeCm > maxItem.sizeCm) {
      return item;
    }

    return maxItem;
  }, null);
}

function getBestLocations(items: CatchLogListItem[]): BestLocationItem[] {
  const locationCounts = new Map<string, number>();

  items.forEach((item) => {
    locationCounts.set(
      item.location,
      (locationCounts.get(item.location) ?? 0) + item.count,
    );
  });

  return [...locationCounts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0], "ko");
    })
    .map(([name, catchCount]) => ({ catchCount, name }))
    .slice(0, 3);
}

function buildMonthlyCatchTrend(
  items: CatchLogListItem[],
): MonthlyCatchTrendItem[] {
  const monthlyCounts = Array.from({ length: 12 }, () => 0);

  items.forEach((item) => {
    const monthIndex = getDateMonthIndex(item.date);

    if (monthIndex !== null) {
      monthlyCounts[monthIndex] += item.count;
    }
  });

  return MONTH_LABELS.map((label, index) => ({
    label,
    value: monthlyCounts[index] ?? 0,
  }));
}

function buildTidePerformance(items: CatchLogListItem[]): TidePerformanceItem[] {
  const tideCounts = new Map<string, number>();

  items.forEach((item) => {
    if (
      item.count <= 0 ||
      item.tide === "해당없음" ||
      item.tide === "물때 미입력"
    ) {
      return;
    }

    tideCounts.set(item.tide, (tideCounts.get(item.tide) ?? 0) + item.count);
  });

  const maxCatchCount = Math.max(...tideCounts.values(), 0);

  return [...tideCounts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0], "ko");
    })
    .slice(0, 5)
    .map(([label, catchCount]) => ({
      catchCount,
      label,
      value:
        maxCatchCount > 0
          ? Math.max(Math.round((catchCount / maxCatchCount) * 100), 4)
          : 0,
    }));
}

function getDateYear(date: string) {
  const [year] = date.split(".");

  return Number(year);
}

function getDateMonthIndex(date: string) {
  const [, month] = date.split(".");
  const monthNumber = Number(month);

  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  return monthNumber - 1;
}

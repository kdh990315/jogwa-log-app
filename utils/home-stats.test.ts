import type { CatchLogListItem, WaterType } from "@/types/catch-log";
import { getHomeStats, getTotalCount, getWinRate } from "@/utils/home-stats";

function createCatchLogItem(
  overrides: Partial<CatchLogListItem> & {
    count: number;
    date: string;
    id: number;
    type: WaterType;
  },
): CatchLogListItem {
  return {
    count: overrides.count,
    date: overrides.date,
    id: overrides.id,
    latitude: overrides.latitude ?? null,
    location: overrides.location ?? `포인트 ${overrides.id}`,
    longitude: overrides.longitude ?? null,
    sizeCm: overrides.sizeCm ?? null,
    species: overrides.species ?? "광어",
    speciesId: overrides.speciesId ?? null,
    tide: overrides.tide ?? "1물",
    type: overrides.type,
  };
}

describe("홈 통계 계산", () => {
  it("전체 마릿수와 출조 성공률이 제대로 계산되는지 확인", () => {
    const items = [
      createCatchLogItem({ count: 3, date: "2026.05.01", id: 1, type: "salt" }),
      createCatchLogItem({ count: 0, date: "2026.05.02", id: 2, type: "salt" }),
      createCatchLogItem({ count: 2, date: "2026.05.03", id: 3, type: "salt" }),
    ];

    expect(getTotalCount(items)).toBe(5);
    expect(getWinRate(items)).toBe(67);
  });

  it("낚시 종류와 선택한 연도 기준으로 조과가 필터링되는지 확인", () => {
    const stats = getHomeStats({
      category: "salt",
      year: 2026,
      catchLogItems: [
        createCatchLogItem({
          count: 3,
          date: "2026.05.01",
          id: 1,
          type: "salt",
        }),
        createCatchLogItem({
          count: 4,
          date: "2026.05.02",
          id: 2,
          type: "fresh",
        }),
        createCatchLogItem({
          count: 5,
          date: "2025.05.01",
          id: 3,
          type: "salt",
        }),
      ],
    });

    expect(stats.totalCount).toBe(3);
    expect(stats.totalCountDeltaLabel).toBe("-2마리");
    expect(stats.winRate).toBe(100);
  });

  it("표시용 날짜 문자열 기준으로 월별 조과 추이가 계산되는지 확인", () => {
    const stats = getHomeStats({
      category: "salt",
      year: 2026,
      catchLogItems: [
        createCatchLogItem({
          count: 3,
          date: "2026.01.15",
          id: 1,
          type: "salt",
        }),
        createCatchLogItem({
          count: 2,
          date: "2026.05.01",
          id: 2,
          type: "salt",
        }),
        createCatchLogItem({
          count: 4,
          date: "2026.05.20",
          id: 3,
          type: "salt",
        }),
      ],
    });

    expect(stats.monthlyCatchTrend[0]).toEqual({ label: "1월", value: 3 });
    expect(stats.monthlyCatchTrend[4]).toEqual({ label: "5월", value: 6 });
    expect(stats.monthlyCatchTrend[11]).toEqual({ label: "12월", value: 0 });
  });

  it("바다 낚시의 최고 조건은 물때 기준이며 미입력과 꽝 기록은 제외되는지 확인", () => {
    const stats = getHomeStats({
      category: "salt",
      year: 2026,
      catchLogItems: [
        createCatchLogItem({
          count: 3,
          date: "2026.05.01",
          id: 1,
          tide: "3물",
          type: "salt",
        }),
        createCatchLogItem({
          count: 5,
          date: "2026.05.02",
          id: 2,
          tide: "7물",
          type: "salt",
        }),
        createCatchLogItem({
          count: 9,
          date: "2026.05.03",
          id: 3,
          tide: "물때 미입력",
          type: "salt",
        }),
        createCatchLogItem({
          count: 0,
          date: "2026.05.04",
          id: 4,
          tide: "1물",
          type: "salt",
        }),
      ],
    });

    expect(stats.bestConditionLabel).toBe("최고 물때");
    expect(stats.bestConditionValue).toBe("7물");
    expect(stats.bestConditionSubText).toBe("5마리");
    expect(stats.tidePerformance).toEqual([
      { catchCount: 5, label: "7물", value: 100 },
      { catchCount: 3, label: "3물", value: 60 },
    ]);
  });

  it("민물 낚시의 최고 조건은 포인트 기준으로 계산되는지 확인", () => {
    const stats = getHomeStats({
      category: "fresh",
      year: 2026,
      catchLogItems: [
        createCatchLogItem({
          count: 2,
          date: "2026.05.01",
          id: 1,
          location: "강 상류",
          type: "fresh",
        }),
        createCatchLogItem({
          count: 5,
          date: "2026.05.02",
          id: 2,
          location: "저수지",
          type: "fresh",
        }),
        createCatchLogItem({
          count: 4,
          date: "2026.05.03",
          id: 3,
          location: "저수지",
          type: "fresh",
        }),
      ],
    });

    expect(stats.bestConditionLabel).toBe("최고 포인트");
    expect(stats.bestConditionValue).toBe("저수지");
    expect(stats.bestConditionSubText).toBe("9마리");
    expect(stats.bestLocations[0]).toEqual({ catchCount: 9, name: "저수지" });
  });

  it("최근 조과가 기존 목록 순서대로 최대 5개만 남는지 확인", () => {
    const catchLogItems = Array.from({ length: 7 }, (_, index) =>
      createCatchLogItem({
        count: index + 1,
        date: `2026.05.${String(index + 1).padStart(2, "0")}`,
        id: index + 1,
        type: "salt",
      }),
    );

    const stats = getHomeStats({
      catchLogItems,
      category: "salt",
      year: 2026,
    });

    expect(stats.recentCatches.map((item) => item.id)).toEqual([1, 2, 3, 4, 5]);
  });
});

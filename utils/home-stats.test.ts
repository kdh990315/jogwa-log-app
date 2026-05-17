import type { CatchLogListItem, WaterType } from "@/types/catch-log";
import { getHomeStats, getTotalCount, getWinRate } from "@/utils/home-stats";

function createCatchLogItem(
  overrides: Partial<CatchLogListItem> & {
    count: number;
    fishingDate: string;
    id: number;
    type: WaterType;
  },
): CatchLogListItem {
  return {
    count: overrides.count,
    fishingDate: overrides.fishingDate,
    id: overrides.id,
    latitude: overrides.latitude ?? null,
    longitude: overrides.longitude ?? null,
    pointName: overrides.pointName ?? `포인트 ${overrides.id}`,
    sizeCm: overrides.sizeCm ?? null,
    speciesId: overrides.speciesId ?? null,
    speciesName: overrides.speciesName ?? "광어",
    tide: "tide" in overrides ? (overrides.tide ?? null) : "1물",
    type: overrides.type,
  };
}

describe("홈 통계 계산", () => {
  it("전체 마릿수와 출조 성공률이 제대로 계산되는지 확인", () => {
    const items = [
      createCatchLogItem({
        count: 3,
        fishingDate: "2026-05-01",
        id: 1,
        type: "salt",
      }),
      createCatchLogItem({
        count: 0,
        fishingDate: "2026-05-02",
        id: 2,
        type: "salt",
      }),
      createCatchLogItem({
        count: 2,
        fishingDate: "2026-05-03",
        id: 3,
        type: "salt",
      }),
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
          fishingDate: "2026-05-01",
          id: 1,
          type: "salt",
        }),
        createCatchLogItem({
          count: 4,
          fishingDate: "2026-05-02",
          id: 2,
          type: "fresh",
        }),
        createCatchLogItem({
          count: 5,
          fishingDate: "2025-05-01",
          id: 3,
          type: "salt",
        }),
      ],
    });

    expect(stats.totalCount).toBe(3);
    expect(stats.totalCountDeltaLabel).toBe("-2마리");
    expect(stats.winRate).toBe(100);
  });

  it("저장 날짜 기준으로 월별 조과 추이가 계산되는지 확인", () => {
    const stats = getHomeStats({
      category: "salt",
      year: 2026,
      catchLogItems: [
        createCatchLogItem({
          count: 3,
          fishingDate: "2026-01-15",
          id: 1,
          type: "salt",
        }),
        createCatchLogItem({
          count: 2,
          fishingDate: "2026-05-01",
          id: 2,
          type: "salt",
        }),
        createCatchLogItem({
          count: 4,
          fishingDate: "2026-05-20",
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
          fishingDate: "2026-05-01",
          id: 1,
          tide: "3물",
          type: "salt",
        }),
        createCatchLogItem({
          count: 5,
          fishingDate: "2026-05-02",
          id: 2,
          tide: "7물",
          type: "salt",
        }),
        createCatchLogItem({
          count: 9,
          fishingDate: "2026-05-03",
          id: 3,
          tide: null,
          type: "salt",
        }),
        createCatchLogItem({
          count: 0,
          fishingDate: "2026-05-04",
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
    expect(stats.tidePerformanceInsightText).toBe(
      "7물과 3물에서 조과가 좋았습니다.",
    );
  });

  it("조과가 있었던 모든 물때를 반환하고 물때 순서로도 정렬하는지 확인", () => {
    const stats = getHomeStats({
      category: "salt",
      year: 2026,
      catchLogItems: [
        createCatchLogItem({
          count: 8,
          fishingDate: "2026-05-01",
          id: 1,
          tide: "8물",
          type: "salt",
        }),
        createCatchLogItem({
          count: 7,
          fishingDate: "2026-05-02",
          id: 2,
          tide: "7물",
          type: "salt",
        }),
        createCatchLogItem({
          count: 6,
          fishingDate: "2026-05-03",
          id: 3,
          tide: "6물",
          type: "salt",
        }),
        createCatchLogItem({
          count: 5,
          fishingDate: "2026-05-04",
          id: 4,
          tide: "5물",
          type: "salt",
        }),
        createCatchLogItem({
          count: 4,
          fishingDate: "2026-05-05",
          id: 5,
          tide: "4물",
          type: "salt",
        }),
        createCatchLogItem({
          count: 3,
          fishingDate: "2026-05-06",
          id: 6,
          tide: "3물",
          type: "salt",
        }),
      ],
    });

    expect(stats.tidePerformance.map((item) => item.label)).toEqual([
      "8물",
      "7물",
      "6물",
      "5물",
      "4물",
      "3물",
    ]);
    expect(stats.tidePerformanceBySequence.map((item) => item.label)).toEqual([
      "3물",
      "4물",
      "5물",
      "6물",
      "7물",
      "8물",
    ]);
    expect(stats.tidePerformanceInsightText).toBe(
      "8물과 7물에서 조과가 좋았습니다.",
    );
  });

  it("조과가 있는 물때가 1개뿐이면 단수 문구를 반환하는지 확인", () => {
    const stats = getHomeStats({
      category: "salt",
      year: 2026,
      catchLogItems: [
        createCatchLogItem({
          count: 2,
          fishingDate: "2026-05-01",
          id: 1,
          tide: "무시",
          type: "salt",
        }),
        createCatchLogItem({
          count: 0,
          fishingDate: "2026-05-02",
          id: 2,
          tide: "3물",
          type: "salt",
        }),
      ],
    });

    expect(stats.tidePerformanceInsightText).toBe(
      "무시에서 조과가 좋았습니다.",
    );
  });

  it("민물 낚시의 최고 조건은 포인트 기준으로 계산되는지 확인", () => {
    const stats = getHomeStats({
      category: "fresh",
      year: 2026,
      catchLogItems: [
        createCatchLogItem({
          count: 2,
          fishingDate: "2026-05-01",
          id: 1,
          pointName: "강 상류",
          type: "fresh",
        }),
        createCatchLogItem({
          count: 5,
          fishingDate: "2026-05-02",
          id: 2,
          pointName: "저수지",
          type: "fresh",
        }),
        createCatchLogItem({
          count: 4,
          fishingDate: "2026-05-03",
          id: 3,
          pointName: "저수지",
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
        fishingDate: `2026-05-${String(index + 1).padStart(2, "0")}`,
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

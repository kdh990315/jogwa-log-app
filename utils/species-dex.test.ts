import type { CatchLogListItem } from "@/types/catch-log";
import type { FishSpecies } from "@/types/fish-species";
import {
  buildCaughtSpeciesStats,
  emptyCaughtSpeciesStats,
  getCatchLogsForFishSpecies,
  getCaughtStatsForFishSpecies,
} from "@/utils/species-dex";

function createCatchLogItem(
  overrides: Partial<CatchLogListItem> & {
    count: number;
    fishingDate: string;
    id: number;
  },
): CatchLogListItem {
  return {
    count: overrides.count,
    fishingDate: overrides.fishingDate,
    id: overrides.id,
    latitude: overrides.latitude ?? null,
    longitude: overrides.longitude ?? null,
    pointName: overrides.pointName ?? null,
    sizeCm: overrides.sizeCm ?? null,
    speciesId: "speciesId" in overrides ? (overrides.speciesId ?? null) : 10,
    speciesItems: overrides.speciesItems ?? [],
    speciesName: overrides.speciesName ?? "광어",
    tide: overrides.tide ?? null,
    type: overrides.type ?? "salt",
  };
}

const flatfish: FishSpecies = {
  id: 10,
  locationTypeId: 2,
  name: "광어",
  waterType: "saltwater",
};

describe("도감 조과 통계 유틸", () => {
  it("꽝 기록과 어종 ID가 없는 기록은 도감 해금 통계에서 제외되는지 확인", () => {
    const stats = buildCaughtSpeciesStats([
      createCatchLogItem({
        count: 0,
        fishingDate: "2026-05-01",
        id: 1,
        speciesId: 10,
      }),
      createCatchLogItem({
        count: 2,
        fishingDate: "2026-05-02",
        id: 2,
        speciesId: null,
      }),
    ]);

    expect(stats.byId.size).toBe(0);
  });

  it("어종별 누적 기록 수, 마릿수, 최대 크기, 최근 기록이 계산되는지 확인", () => {
    const stats = buildCaughtSpeciesStats([
      createCatchLogItem({
        count: 2,
        fishingDate: "2026-05-01",
        id: 1,
        sizeCm: 42.5,
      }),
      createCatchLogItem({
        count: 3,
        fishingDate: "2026-05-03",
        id: 2,
        sizeCm: 38,
      }),
      createCatchLogItem({
        count: 1,
        fishingDate: "2026-05-02",
        id: 3,
        sizeCm: null,
      }),
    ]);

    expect(getCaughtStatsForFishSpecies(stats, flatfish)).toEqual({
      maxSizeCm: 42.5,
      recentCatchLogId: 2,
      recentDate: "2026-05-03",
      recordCount: 3,
      totalCatchCount: 6,
    });
  });

  it("잡지 않은 어종은 빈 통계 객체를 반환하는지 확인", () => {
    const stats = buildCaughtSpeciesStats([]);

    expect(getCaughtStatsForFishSpecies(stats, flatfish)).toBe(
      emptyCaughtSpeciesStats,
    );
  });

  it("도감 상세의 최근 조과 목록은 해당 어종의 성공 기록만 최신순으로 반환하는지 확인", () => {
    const logs = [
      createCatchLogItem({
        count: 1,
        fishingDate: "2026-05-01",
        id: 1,
        speciesId: 10,
      }),
      createCatchLogItem({
        count: 0,
        fishingDate: "2026-05-04",
        id: 2,
        speciesId: 10,
      }),
      createCatchLogItem({
        count: 3,
        fishingDate: "2026-05-03",
        id: 3,
        speciesId: 20,
        speciesName: "붕어",
        type: "fresh",
      }),
      createCatchLogItem({
        count: 2,
        fishingDate: "2026-05-02",
        id: 4,
        speciesId: 10,
      }),
    ];

    expect(getCatchLogsForFishSpecies(logs, flatfish).map((item) => item.id)).toEqual([
      4,
      1,
    ]);
  });
});

import { getCatchLogList } from "@/api/catch-logs";

const mockEnsureSupabaseAuthConfig = jest.fn();
const mockSelect = jest.fn();
const mockRpc = jest.fn(
  (_name: string, _args: Record<string, unknown>) => ({ select: mockSelect }),
);

jest.mock("@/api/supabase", () => ({
  ensureSupabaseAuthConfig: () => mockEnsureSupabaseAuthConfig(),
  supabase: {
    rpc: (name: string, args: Record<string, unknown>) => mockRpc(name, args),
  },
}));

const catchLogRow = {
  count: 2,
  fishing_date: "2026-06-19",
  id: 7,
  latitude: 37.1,
  location_type_id: 2,
  longitude: 126.1,
  point_name: "방파제",
  size_cm: 42,
  species_id: 3,
  species_name: "감성돔",
  tide: "7물",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRpc.mockReturnValue({ select: mockSelect });
});

describe("getCatchLogList", () => {
  it("최신순 목록 RPC에 물 종류와 정리된 검색어를 전달한다", async () => {
    mockSelect.mockResolvedValue({ data: [catchLogRow], error: null });

    const result = await getCatchLogList({
      filter: "latest",
      searchQuery: "  감성돔  ",
      waterType: "salt",
    });

    expect(mockRpc).toHaveBeenCalledWith("get_catch_log_list", {
      p_location_type_id: 2,
      p_search_query: "감성돔",
      p_sort_order: "latest",
    });
    expect(result).toEqual({
      items: [
        {
          count: 2,
          fishingDate: "2026-06-19",
          id: 7,
          latitude: 37.1,
          longitude: 126.1,
          pointName: "방파제",
          sizeCm: 42,
          speciesId: 3,
          speciesName: "감성돔",
          tide: "7물",
          type: "salt",
        },
      ],
      view: "list",
    });
  });

  it("최대어순은 동일한 목록 RPC에 largest 정렬을 요청한다", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    await getCatchLogList({
      filter: "largest",
      searchQuery: "",
      waterType: "fresh",
    });

    expect(mockRpc).toHaveBeenCalledWith("get_catch_log_list", {
      p_location_type_id: 1,
      p_search_query: "",
      p_sort_order: "largest",
    });
  });

  it("어종별 RPC 응답을 SectionList 계약으로 변환한다", async () => {
    mockSelect.mockResolvedValue({
      data: [
        {
          catch_logs: [catchLogRow],
          species_name: "감성돔",
          total_records: "1",
        },
      ],
      error: null,
    });

    const result = await getCatchLogList({
      filter: "species",
      searchQuery: "",
      waterType: "salt",
    });

    expect(mockRpc).toHaveBeenCalledWith("get_catch_log_species_sections", {
      p_location_type_id: 2,
      p_search_query: "",
    });
    expect(result.view).toBe("species");
    if (result.view === "species") {
      expect(result.sections[0]).toMatchObject({
        speciesName: "감성돔",
        totalRecords: 1,
      });
      expect(result.sections[0].data[0].id).toBe(7);
    }
  });

  it("포인트별 RPC의 bigint 집계 값을 number로 변환한다", async () => {
    mockSelect.mockResolvedValue({
      data: [
        {
          last_date: "2026-06-19",
          main_species: "감성돔",
          point_name: "방파제",
          total_catch_count: "5",
          total_records: "2",
        },
      ],
      error: null,
    });

    const result = await getCatchLogList({
      filter: "points",
      searchQuery: "",
      waterType: "salt",
    });

    expect(result).toEqual({
      groups: [
        {
          lastDate: "2026-06-19",
          mainSpecies: "감성돔",
          pointName: "방파제",
          totalCatchCount: 5,
          totalRecords: 2,
        },
      ],
      view: "points",
    });
  });

  it("RPC 오류를 호출자에게 전달한다", async () => {
    const rpcError = new Error("RPC failed");

    mockSelect.mockResolvedValue({ data: null, error: rpcError });

    await expect(
      getCatchLogList({
        filter: "latest",
        searchQuery: "",
        waterType: "salt",
      }),
    ).rejects.toBe(rpcError);
  });
});

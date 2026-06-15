import { Platform } from "react-native";

import { ensureSupabaseAuthConfig, supabase } from "@/api/supabase";
import { getNotices } from "@/api/notices";

const mockQuery = {
  eq: jest.fn(),
  in: jest.fn(),
  or: jest.fn(),
  order: jest.fn(),
  returns: jest.fn(),
  select: jest.fn(),
};

jest.mock("@/api/supabase", () => ({
  ensureSupabaseAuthConfig: jest.fn(),
  supabase: {
    from: jest.fn(),
  },
}));

const mockEnsureSupabaseAuthConfig = jest.mocked(ensureSupabaseAuthConfig);
const mockFrom = jest.mocked(supabase.from);

describe("공지사항 API 계약", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-06-15T03:04:05.000Z"));

    for (const method of [
      mockQuery.eq,
      mockQuery.in,
      mockQuery.or,
      mockQuery.order,
      mockQuery.select,
    ]) {
      method.mockReturnValue(mockQuery);
    }
    mockFrom.mockReturnValue(
      mockQuery as unknown as ReturnType<typeof supabase.from>,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("게시 가능한 현재 플랫폼 공지를 정렬 조회하고 앱 DTO로 변환하는지 확인", async () => {
    mockQuery.returns.mockResolvedValue({
      data: [
        {
          body: "첫 문단\n\n두 번째 문단",
          created_at: "2026-06-14T00:00:00Z",
          id: "notice-1",
          is_published: true,
          metadata: {},
          published_at: "2026-06-15T00:00:00Z",
          title: "서비스 점검 안내",
        },
      ],
      error: null,
    });

    await expect(getNotices()).resolves.toEqual([
      {
        body: ["첫 문단", "두 번째 문단"],
        id: "notice-1",
        publishedAt: "2026.06.15",
        statusLabel: "게시중",
        title: "서비스 점검 안내",
      },
    ]);

    expect(mockEnsureSupabaseAuthConfig).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("notices");
    expect(mockQuery.eq).toHaveBeenCalledWith("is_published", true);
    expect(mockQuery.in).toHaveBeenCalledWith(
      "target_platform",
      Platform.OS === "ios" || Platform.OS === "android"
        ? ["all", Platform.OS]
        : ["all"],
    );
    expect(mockQuery.or).toHaveBeenCalledWith(
      "starts_at.is.null,starts_at.lte.2026-06-15T03:04:05Z",
    );
    expect(mockQuery.or).toHaveBeenCalledWith(
      "ends_at.is.null,ends_at.gt.2026-06-15T03:04:05Z",
    );
    expect(mockQuery.order.mock.calls).toEqual([
      ["pinned", { ascending: false }],
      ["priority", { ascending: false }],
      ["published_at", { ascending: false, nullsFirst: false }],
      ["created_at", { ascending: false }],
    ]);
  });

  it("Supabase 조회 오류를 호출자에게 전달하는지 확인", async () => {
    const error = new Error("query failed");
    mockQuery.returns.mockResolvedValue({ data: null, error });

    await expect(getNotices()).rejects.toBe(error);
  });
});

import { act, renderHook } from "@testing-library/react-native";
import { notifyManager } from "@tanstack/react-query";

import { deleteCatchLog } from "@/api/catch-logs";
import { catchLogKeys } from "@/constants/query-keys";
import { useDeleteCatchLog } from "@/hooks/queries/use-delete-catch-log";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/test-utils/query-client";

jest.mock("@/api/catch-logs", () => ({
  deleteCatchLog: jest.fn(),
}));

const mockDeleteCatchLog = jest.mocked(deleteCatchLog);

describe("조과 삭제 Query hook", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let unmountHook: (() => void) | undefined;

  beforeAll(() => {
    jest.useFakeTimers();
    notifyManager.setScheduler((callback) => callback());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    unmountHook?.();
    queryClient.clear();
  });

  afterAll(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("삭제 성공 후 목록 cache를 무효화하고 삭제된 상세 cache를 제거하는지 확인", async () => {
    const catchLogId = 42;
    const catchLogListKey = catchLogKeys.catchLogList({
      filter: "latest",
      searchQuery: "",
      waterType: "salt",
    });
    queryClient.setQueryData(catchLogListKey, ["list"]);
    queryClient.setQueryData(catchLogKeys.detail(catchLogId), { id: catchLogId });
    queryClient.setQueryData(catchLogKeys.edit(catchLogId), { id: catchLogId });
    mockDeleteCatchLog.mockResolvedValue();

    const { result, unmount } = renderHook(() => useDeleteCatchLog(), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    unmountHook = unmount;

    await act(async () => {
      await result.current.mutateAsync(catchLogId);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(mockDeleteCatchLog).toHaveBeenCalledWith(catchLogId);
    expect(queryClient.getQueryState(catchLogListKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(catchLogKeys.detail(catchLogId))).toBeUndefined();
    expect(queryClient.getQueryData(catchLogKeys.edit(catchLogId))).toBeUndefined();
  });

  it("삭제 실패 시 기존 cache를 유지하고 오류를 노출하는지 확인", async () => {
    const catchLogId = 42;
    const error = new Error("delete failed");
    queryClient.setQueryData(catchLogKeys.detail(catchLogId), { id: catchLogId });
    mockDeleteCatchLog.mockRejectedValue(error);

    const { result, unmount } = renderHook(() => useDeleteCatchLog(), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    unmountHook = unmount;

    await act(async () => {
      await expect(result.current.mutateAsync(catchLogId)).rejects.toBe(error);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
    expect(queryClient.getQueryData(catchLogKeys.detail(catchLogId))).toEqual({
      id: catchLogId,
    });
  });
});

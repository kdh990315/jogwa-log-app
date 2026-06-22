import React from "react";
import { Alert } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import CatchDetailScreen from "../../app/catch-log/[id]";
import type { CatchLogDetailItem } from "@/types/catch-log";

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseCatchLog = jest.fn();
const mockMutateAsync = jest.fn();
const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

let mockParams: Record<string, string | string[] | undefined> = { id: "42" };
let mockCatchLogQueryState: {
  data: CatchLogDetailItem | undefined;
  error: Error | null;
  isLoading: boolean;
};
let mockIsDeleting = false;

jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: { options?: { headerRight?: () => React.ReactNode } }) =>
      options?.headerRight?.() ?? null,
  },
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock("@expo/vector-icons/Ionicons", () => {
  return function MockIonicons({ name }: { name: string }) {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, name);
  };
});

jest.mock("@/hooks/use-app-theme", () => ({
  useAppTheme: () => ({ isDark: false }),
}));

jest.mock("@/hooks/queries/use-catch-logs", () => ({
  useCatchLog: (catchLogId: number, enabled: boolean) =>
    mockUseCatchLog(catchLogId, enabled),
}));

jest.mock("@/hooks/queries/use-delete-catch-log", () => ({
  useDeleteCatchLog: () => ({
    isPending: mockIsDeleting,
    mutateAsync: mockMutateAsync,
  }),
}));

// 상세 화면의 책임은 하위 컴포넌트 구현보다 올바른 props와 callback을 조립하는 것이다.
jest.mock("@/components/catch-log/catch-log-detail/CatchDetailActionSheet", () => {
  return function MockCatchDetailActionSheet({
    isDeleting,
    isVisible,
    onDelete,
    onEdit,
  }: {
    isDeleting: boolean;
    isVisible: boolean;
    onDelete: () => void;
    onEdit: () => void;
  }) {
    if (!isVisible) {
      return null;
    }

    const React = require("react");
    const { Text, TouchableOpacity, View } = require("react-native");

    return React.createElement(
      View,
      null,
      React.createElement(
        TouchableOpacity,
        { disabled: isDeleting, onPress: onEdit },
        React.createElement(Text, null, "수정하기"),
      ),
      React.createElement(
        TouchableOpacity,
        { disabled: isDeleting, onPress: onDelete },
        React.createElement(Text, null, isDeleting ? "삭제 중..." : "삭제하기"),
      ),
    );
  };
});

jest.mock("@/components/catch-log/catch-log-detail/CatchDetailPhotoGallery", () => {
  return function MockCatchDetailPhotoGallery({ images }: { images: string[] }) {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(
      Text,
      { testID: "photo-gallery" },
      images.join(",") || "사진 없음",
    );
  };
});

jest.mock(
  "@/components/catch-log/catch-log-detail/CatchDetailLocationSection",
  () => {
    return function MockCatchDetailLocationSection({
      latitude,
      longitude,
    }: {
      latitude: number | null;
      longitude: number | null;
    }) {
      const React = require("react");
      const { Text } = require("react-native");

      return React.createElement(
        Text,
        { testID: "location-section" },
        latitude,
        ",",
        longitude,
      );
    };
  },
);

jest.mock("@/components/ads/AdBannerSlot", () => {
  return function MockAdBannerSlot() {
    const React = require("react");
    const { View } = require("react-native");

    return React.createElement(View, { testID: "detail-ad-banner" });
  };
});

function createCatchLogDetail(
  overrides: Partial<CatchLogDetailItem> = {},
): CatchLogDetailItem {
  return {
    airTempC: 18,
    count: 2,
    fishingDate: "2026-06-19",
    id: 42,
    images: ["https://example.com/catch-1.jpg"],
    isKkwang: false,
    latitude: 35.1,
    longitude: 129.1,
    memo: "새벽에 입질이 좋았음",
    pointName: "방파제",
    sizeCm: 43,
    speciesName: "감성돔",
    tide: "7물",
    type: "salt",
    waterTempC: 15,
    waveHeightM: 0.5,
    weather: "맑음",
    windSpeedMs: 2,
    ...overrides,
  };
}

function setupCatchLogQueryState(
  overrides: Partial<typeof mockCatchLogQueryState> = {},
) {
  mockCatchLogQueryState = {
    data: createCatchLogDetail(),
    error: null,
    isLoading: false,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: "42" };
  mockIsDeleting = false;
  setupCatchLogQueryState();
  mockUseCatchLog.mockImplementation(() => mockCatchLogQueryState);
  mockMutateAsync.mockResolvedValue(undefined);
});

describe("CatchDetailScreen", () => {
  it("유효하지 않은 ID는 조회를 비활성화하고 이전 화면 이동을 제공한다", () => {
    mockParams = { id: "invalid-id" };

    render(<CatchDetailScreen />);

    expect(mockUseCatchLog).toHaveBeenCalledWith(Number.NaN, false);
    expect(screen.getByText("기록을 찾을 수 없습니다")).toBeTruthy();

    fireEvent.press(screen.getByText("이전으로"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("배열 route param의 첫 번째 ID로 상세 조회한다", () => {
    mockParams = { id: ["42", "99"] };

    render(<CatchDetailScreen />);

    expect(mockUseCatchLog).toHaveBeenCalledWith(42, true);
  });

  it("상세 조회 중에는 loading 상태를 보여준다", () => {
    setupCatchLogQueryState({ data: undefined, isLoading: true });

    render(<CatchDetailScreen />);

    expect(screen.getByText("조과 기록을 불러오는 중입니다")).toBeTruthy();
    expect(screen.queryByText("감성돔")).toBeNull();
  });

  it("상세 데이터가 없으면 error 상태와 기본 안내를 보여준다", () => {
    setupCatchLogQueryState({ data: undefined });

    render(<CatchDetailScreen />);

    expect(screen.getByText("기록을 찾을 수 없습니다")).toBeTruthy();
    expect(
      screen.getByText("요청한 조과 기록을 찾을 수 없습니다."),
    ).toBeTruthy();
  });

  it("조과 상세 데이터와 포맷된 보조 정보를 표시한다", () => {
    render(<CatchDetailScreen />);

    expect(screen.getByText("바다 조과")).toBeTruthy();
    expect(screen.getByText("감성돔")).toBeTruthy();
    expect(screen.getByText("2마리")).toBeTruthy();
    expect(screen.getByText("2026.06.19")).toBeTruthy();
    expect(screen.getByText("최대 길이 43cm")).toBeTruthy();
    expect(screen.getByText("7물")).toBeTruthy();
    expect(screen.getByText("맑음")).toBeTruthy();
    expect(screen.getByText("방파제")).toBeTruthy();
    expect(screen.getByText("새벽에 입질이 좋았음")).toBeTruthy();
    expect(screen.getByTestId("location-section").props.children).toEqual([
      35.1,
      ",",
      129.1,
    ]);
    expect(screen.getByTestId("photo-gallery").props.children).toBe(
      "https://example.com/catch-1.jpg",
    );
    expect(screen.getByTestId("detail-ad-banner")).toBeTruthy();
  });

  it("메모가 비어 있으면 기본 안내를 표시한다", () => {
    setupCatchLogQueryState({
      data: createCatchLogDetail({ memo: "   " }),
    });

    render(<CatchDetailScreen />);

    expect(screen.getByText("메모가 없습니다.")).toBeTruthy();
  });

  it("상세 메뉴에서 현재 기록을 수정 화면으로 전달한다", () => {
    render(<CatchDetailScreen />);

    fireEvent.press(screen.getByLabelText("조과 상세 메뉴 열기"));
    fireEvent.press(screen.getByText("수정하기"));

    expect(mockPush).toHaveBeenCalledWith({
      params: { editId: "42" },
      pathname: "/catch-register",
    });
    expect(screen.queryByText("수정하기")).toBeNull();
  });

  it("삭제 확인 후 기록을 삭제하고 목록 화면으로 대체한다", async () => {
    render(<CatchDetailScreen />);

    fireEvent.press(screen.getByLabelText("조과 상세 메뉴 열기"));
    fireEvent.press(screen.getByText("삭제하기"));

    expect(mockAlert).toHaveBeenCalledWith(
      "조과 삭제",
      "이 조과 기록과 사진을 삭제할까요? 삭제한 기록은 되돌릴 수 없습니다.",
      expect.any(Array),
    );

    const deleteButtons = mockAlert.mock.calls[0][2];
    const confirmDeleteButton = deleteButtons?.find(
      (button) => button.text === "삭제",
    );

    await act(async () => {
      confirmDeleteButton?.onPress?.();
      await Promise.resolve();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith(42);
    expect(mockAlert).toHaveBeenCalledWith(
      "삭제 완료",
      "조과 기록을 삭제했습니다.",
      expect.any(Array),
    );

    const successCall = mockAlert.mock.calls.find(
      ([title]) => title === "삭제 완료",
    );
    const successButton = successCall?.[2]?.[0];
    successButton?.onPress?.();

    expect(mockReplace).toHaveBeenCalledWith("/catch-log");
  });

  it("삭제 요청이 실패하면 오류를 알리고 현재 화면에 머문다", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("삭제 권한이 없습니다."));
    render(<CatchDetailScreen />);

    fireEvent.press(screen.getByLabelText("조과 상세 메뉴 열기"));
    fireEvent.press(screen.getByText("삭제하기"));

    const deleteButtons = mockAlert.mock.calls[0][2];
    const confirmDeleteButton = deleteButtons?.find(
      (button) => button.text === "삭제",
    );

    await act(async () => {
      confirmDeleteButton?.onPress?.();
      await Promise.resolve();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "삭제 실패",
      "삭제 권한이 없습니다.",
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("꽝 기록은 어종·크기·사진 대신 꽝 상태를 표시한다", () => {
    setupCatchLogQueryState({
      data: createCatchLogDetail({
        count: 0,
        images: ["https://example.com/should-not-show.jpg"],
        isKkwang: true,
        sizeCm: 50,
      }),
    });

    render(<CatchDetailScreen />);

    expect(screen.getByText("꽝")).toBeTruthy();
    expect(screen.getByText("0마리")).toBeTruthy();
    expect(screen.queryByText("감성돔")).toBeNull();
    expect(screen.queryByText("최대 길이 50cm")).toBeNull();
    expect(screen.getByTestId("photo-gallery").props.children).toBe(
      "사진 없음",
    );
  });
});

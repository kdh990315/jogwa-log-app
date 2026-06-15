import { fireEvent, render, screen } from "@testing-library/react-native";

import NoticesScreen from "@/app/(tabs)/settings/notices";
import { useNotices } from "@/hooks/queries/use-notices";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Notice } from "@/types/notice";

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("@expo/vector-icons/Ionicons", () => () => null);

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock("@/hooks/queries/use-notices", () => ({
  useNotices: jest.fn(),
}));

jest.mock("@/hooks/use-app-theme", () => ({
  useAppTheme: jest.fn(),
}));

const mockUseNotices = jest.mocked(useNotices);
const mockUseAppTheme = jest.mocked(useAppTheme);
const mockRefetch = jest.fn();

const notice: Notice = {
  body: ["점검 안내입니다."],
  id: "notice-1",
  publishedAt: "2026.06.15",
  statusLabel: "게시중",
  title: "서비스 점검 안내",
};

function setNoticesResult({
  data = [],
  error = null,
  isLoading = false,
}: {
  data?: Notice[];
  error?: Error | null;
  isLoading?: boolean;
} = {}) {
  mockUseNotices.mockReturnValue({
    data,
    error,
    isLoading,
    refetch: mockRefetch,
  } as unknown as ReturnType<typeof useNotices>);
}

describe("공지사항 화면", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppTheme.mockReturnValue({
      isDark: false,
    } as ReturnType<typeof useAppTheme>);
  });

  it("loading 상태를 표시하는지 확인", () => {
    setNoticesResult({ isLoading: true });

    render(<NoticesScreen />);

    expect(screen.getByText("공지사항을 불러오는 중입니다")).toBeOnTheScreen();
  });

  it("공지사항이 없을 때 empty 상태를 표시하는지 확인", () => {
    setNoticesResult();

    render(<NoticesScreen />);

    expect(screen.getByText("등록된 공지사항이 없습니다")).toBeOnTheScreen();
  });

  it("오류 상태에서 다시 시도를 요청하는지 확인", () => {
    setNoticesResult({ error: new Error("network failed") });

    render(<NoticesScreen />);
    fireEvent.press(screen.getByText("다시 시도"));

    expect(screen.getByText("공지사항을 불러오지 못했어요")).toBeOnTheScreen();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("공지사항 선택과 뒤로가기를 navigation 요청으로 전달하는지 확인", () => {
    setNoticesResult({ data: [notice] });

    render(<NoticesScreen />);
    fireEvent.press(screen.getByText(notice.title));
    fireEvent.press(screen.getByLabelText("뒤로가기"));

    expect(mockPush).toHaveBeenCalledWith("/settings/notices/notice-1");
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

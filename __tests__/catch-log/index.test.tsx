import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import CatchLogListScreen from "../../app/catch-log";
import type {
  CatchLogListItem,
  CatchLogListQuery,
  CatchLogListResult,
} from "@/types/catch-log";

// 이 테스트의 목적:
// 리팩토링 전에 "화면이 사용자에게 보여주는 동작"을 고정하는 회귀 테스트다.
// 현업에서는 큰 화면 컴포넌트를 바로 쪼개기 전에 이런 테스트를 먼저 만들어서,
// 이후 파일 분리/함수 추출/컴포넌트 분리를 해도 기존 UX가 깨지지 않았는지 확인한다.

// expo-router의 router.push 호출 여부를 검증하기 위한 spy 함수다.
// 실제 네비게이션을 실행하지 않고 "어떤 경로로 이동하려 했는지"만 확인한다.
const mockPush = jest.fn();
const mockUseCatchLogList = jest.fn();
// useLocalSearchParams가 반환할 값을 테스트마다 바꿔 끼우기 위한 변수다.
// 예: { waterType: "fresh" }를 넣으면 민물 탭으로 진입한 상황을 재현할 수 있다.
let mockParams: Record<string, string | string[] | undefined> = {};

// useCatchLogList hook이 반환할 서버 상태를 테스트마다 조절한다.
// 실제 Supabase/React Query를 호출하지 않고 data/loading/error 상태만 화면에 주입한다.
let mockCatchLogQueryState: {
  data: CatchLogListItem[];
  error: Error | null;
  isLoading: boolean;
};

// 화면 테스트에서는 라우터 자체보다 "라우터를 어떻게 사용했는지"가 중요하다.
// 그래서 expo-router를 mock 처리해서 URL 파라미터와 push 호출만 통제한다.
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    push: mockPush,
  }),
}));

// inset은 기기 환경에 따라 값이 달라질 수 있으므로 테스트에서는 고정한다.
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  }),
}));

// 아이콘 라이브러리는 이 화면의 핵심 동작이 아니다.
// 실제 벡터 아이콘을 렌더링하면 테스트 환경에서 불필요한 네이티브 의존성이 생길 수 있어 Text로 대체한다.
// jest.mock factory는 파일 상단 import 변수를 참조할 수 없어서 require를 함수 안에서 사용한다.
jest.mock("@expo/vector-icons/Ionicons", () => {
  return function MockIonicons({ name }: { name: string }) {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, name);
  };
});

// 이 테스트는 라이트/다크 테마 시각 차이가 아니라 목록 동작을 검증한다.
// 그래서 테마를 라이트 모드로 고정해 색상 계산이 테스트 결과에 영향을 주지 않게 한다.
jest.mock("@/hooks/use-app-theme", () => ({
  useAppTheme: () => ({ isDark: false }),
}));

// 서버 상태 hook을 mock으로 대체한다.
// 현업에서도 화면 테스트는 네트워크를 직접 부르지 않고, hook/API 경계를 mock해서 빠르고 안정적으로 만든다.
jest.mock("@/hooks/queries/use-catch-logs", () => ({
  useCatchLogList: (query: CatchLogListQuery) => mockUseCatchLogList(query),
}));

// CatchItem 자체의 스타일/내부 렌더링은 이 테스트의 관심사가 아니다.
// 이 화면에서는 "카드가 어떤 데이터로 몇 개 렌더링되는지"와 "누르면 상세로 가는지"만 중요하다.
// 그래서 최소한의 Text와 TouchableOpacity만 가진 가짜 카드로 바꾼다.
jest.mock("@/components/catch-log/CatchItem", () => {
  interface MockCatchItemProps {
    catchItem: {
      count: number;
      fishingDate: string;
      id: number;
      pointName: string | null;
      sizeCm: number | null;
      speciesName: string;
    };
    onPress: () => void;
  }

  return function MockCatchItem({
    catchItem,
    onPress,
  }: MockCatchItemProps) {
    const React = require("react");
    const { Text, TouchableOpacity } = require("react-native");

    return React.createElement(
      TouchableOpacity,
      {
        onPress,
        testID: `catch-card-${catchItem.id}`,
      },
      React.createElement(Text, null, catchItem.speciesName),
      React.createElement(Text, null, catchItem.pointName),
      React.createElement(Text, null, catchItem.fishingDate),
      React.createElement(
        Text,
        null,
        catchItem.sizeCm ? `${catchItem.sizeCm}cm` : "no-size",
      ),
      React.createElement(Text, null, `${catchItem.count}마리`),
    );
  };
});

// 테스트 데이터 생성 helper다.
// 공통 기본값을 두고 케이스마다 필요한 필드만 overrides로 바꾸면 테스트 의도가 잘 보인다.
// 현업에서는 테스트 fixture를 이렇게 만들면 중복이 줄고, 타입 변경도 한곳에서 대응하기 쉽다.
function createCatchLogItem(
  overrides: Partial<CatchLogListItem>,
): CatchLogListItem {
  return {
    count: 1,
    fishingDate: "2026-06-01",
    id: 1,
    latitude: null,
    longitude: null,
    pointName: "방파제",
    sizeCm: null,
    speciesId: null,
    speciesItems: [],
    speciesName: "감성돔",
    tide: "7물",
    type: "salt",
    ...overrides,
  };
}

// useCatchLogList의 반환값을 초기화하거나 특정 상태로 바꾸는 helper다.
// 기본 데이터는 바다 2건, 민물 1건으로 구성해서 필터/검색/정렬 테스트에 같이 재사용한다.
function setupCatchLogQueryState(
  overrides: Partial<typeof mockCatchLogQueryState> = {},
) {
  mockCatchLogQueryState = {
    data: [
      createCatchLogItem({
        count: 2,
        fishingDate: "2026-06-03",
        id: 1,
        pointName: "방파제",
        sizeCm: 35,
        speciesName: "감성돔",
        tide: "7물",
        type: "salt",
      }),
      createCatchLogItem({
        count: 1,
        fishingDate: "2026-06-01",
        id: 2,
        pointName: "갯바위",
        sizeCm: 48,
        speciesName: "농어",
        tide: "9물",
        type: "salt",
      }),
      createCatchLogItem({
        count: 3,
        fishingDate: "2026-06-02",
        id: 3,
        pointName: "저수지",
        sizeCm: 28,
        speciesName: "붕어",
        tide: null,
        type: "fresh",
      }),
    ],
    error: null,
    isLoading: false,
    ...overrides,
  };
}

function createMockCatchLogResult(
  query: CatchLogListQuery,
): CatchLogListResult {
  const normalizedSearchQuery = query.searchQuery.trim().toLowerCase();
  const matchingCatchLogs = mockCatchLogQueryState.data.filter((catchLog) => {
    if (catchLog.type !== query.waterType) {
      return false;
    }

    if (!normalizedSearchQuery) {
      return true;
    }

    return [catchLog.speciesName, catchLog.pointName ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchQuery);
  });

  if (query.filter === "species") {
    const speciesGroups = new Map<string, CatchLogListItem[]>();

    matchingCatchLogs.forEach((catchLog) => {
      const speciesCatchLogs = speciesGroups.get(catchLog.speciesName) ?? [];

      speciesCatchLogs.push(catchLog);
      speciesGroups.set(catchLog.speciesName, speciesCatchLogs);
    });

    return {
      sections: [...speciesGroups.entries()].map(
        ([speciesName, catchLogs]) => ({
          data: catchLogs,
          speciesName,
          totalRecords: catchLogs.length,
        }),
      ),
      view: "species",
    };
  }

  if (query.filter === "points") {
    return {
      groups: matchingCatchLogs.map((catchLog) => ({
        lastDate: catchLog.fishingDate,
        mainSpecies: catchLog.speciesName,
        pointName: catchLog.pointName ?? "포인트 미입력",
        totalCatchCount: catchLog.count,
        totalRecords: 1,
      })),
      view: "points",
    };
  }

  const sortedCatchLogs = [...matchingCatchLogs].sort((left, right) => {
    if (query.filter === "largest") {
      return (right.sizeCm ?? -1) - (left.sizeCm ?? -1);
    }

    return right.fishingDate.localeCompare(left.fishingDate);
  });

  return { items: sortedCatchLogs, view: "list" };
}

function createMockCatchLogQueryResponse(query: CatchLogListQuery) {
  return {
    ...mockCatchLogQueryState,
    data: createMockCatchLogResult(query),
  };
}

// 각 테스트는 서로 영향을 주면 안 된다.
// beforeEach에서 mock 호출 기록, route param, query state를 초기화해 테스트 격리를 보장한다.
beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  setupCatchLogQueryState();
  mockUseCatchLogList.mockImplementation(createMockCatchLogQueryResponse);
});

describe("CatchLogListScreen", () => {
  it("기본 진입 시 바다 조과만 보여준다", () => {
    render(<CatchLogListScreen />);

    // getByText는 요소가 반드시 있어야 할 때 쓴다. 없으면 테스트가 바로 실패한다.
    expect(screen.getByText("감성돔")).toBeTruthy();
    expect(screen.getByText("농어")).toBeTruthy();
    // queryByText는 요소가 없어야 하는지 확인할 때 쓴다. 없으면 null을 반환한다.
    expect(screen.queryByText("붕어")).toBeNull();
  });

  it("waterType=fresh 파라미터로 들어오면 민물 조과만 보여준다", () => {
    // 실제 앱에서 /catch-log?waterType=fresh 로 들어온 상황을 흉내 낸다.
    mockParams = { waterType: "fresh" };

    render(<CatchLogListScreen />);

    expect(screen.getByText("붕어")).toBeTruthy();
    expect(screen.queryByText("감성돔")).toBeNull();
    expect(screen.queryByText("농어")).toBeNull();
  });

  it("검색어로 조과 목록을 필터링한다", () => {
    jest.useFakeTimers();
    render(<CatchLogListScreen />);

    // fireEvent는 사용자의 입력/터치 같은 상호작용을 테스트에서 재현할 때 쓴다.
    fireEvent.changeText(screen.getByPlaceholderText("어종, 포인트 검색"), "갯바위");

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByText("농어")).toBeTruthy();
    expect(screen.queryByText("감성돔")).toBeNull();
    jest.useRealTimers();
  });

  it("최대어순 필터를 누르면 크기가 큰 조과를 먼저 보여준다", () => {
    render(<CatchLogListScreen />);

    fireEvent.press(screen.getByText("최대어순"));

    // 정렬 검증은 텍스트 존재 여부만으로는 부족하다.
    // 카드 testID의 순서를 읽어 실제 렌더링 순서가 바뀌었는지 확인한다.
    const renderedCards = screen.getAllByTestId(/^catch-card-/);

    expect(renderedCards.map((card) => card.props.testID)).toEqual([
      "catch-card-2",
      "catch-card-1",
    ]);
  });

  it("view=points 파라미터로 들어오면 포인트별 그룹을 보여준다", () => {
    // 홈이나 다른 화면에서 "포인트별 보기"로 진입하는 route param을 재현한다.
    mockParams = { view: "points" };

    render(<CatchLogListScreen />);

    expect(screen.getByText("방파제")).toBeTruthy();
    expect(screen.getByText("갯바위")).toBeTruthy();
    expect(screen.getByText(/주요 어종: 감성돔/)).toBeTruthy();
  });

  it("포인트별 그룹을 누르면 그룹명을 검색어로 넣고 최신순 목록으로 전환한다", () => {
    mockParams = { view: "points" };

    render(<CatchLogListScreen />);

    // 그룹 카드는 최종 상세가 아니라 "그 포인트의 실제 조과 목록"으로 드릴다운하는 UX다.
    fireEvent.press(screen.getByText("방파제"));

    expect(screen.getByPlaceholderText("어종, 포인트 검색").props.value).toBe(
      "방파제",
    );
    expect(screen.getByTestId("catch-card-1")).toBeTruthy();
    expect(screen.queryByTestId("catch-card-2")).toBeNull();
  });

  it("조과 카드를 누르면 상세 화면으로 이동한다", () => {
    render(<CatchLogListScreen />);

    fireEvent.press(screen.getByTestId("catch-card-1"));

    // router.push가 호출된 경로만 검증한다.
    // 화면 전환 자체는 Expo Router의 책임이므로 이 테스트에서 직접 확인하지 않는다.
    expect(mockPush).toHaveBeenCalledWith("/catch-log/1");
  });

  it("로딩 상태를 보여준다", () => {
    // data가 비어 있고 isLoading=true인 React Query 상태를 재현한다.
    setupCatchLogQueryState({
      data: [],
      isLoading: true,
    });

    render(<CatchLogListScreen />);

    expect(screen.getByText("조과 기록을 불러오는 중입니다")).toBeTruthy();
  });

  it("에러 상태를 보여준다", () => {
    // 서버 에러가 발생했을 때 빈 목록 대신 에러 상태 문구가 나오는지 확인한다.
    setupCatchLogQueryState({
      data: [],
      error: new Error("조과 기록을 불러오지 못했습니다"),
    });

    render(<CatchLogListScreen />);

    expect(screen.getByText("기록을 불러오지 못했습니다")).toBeTruthy();
  });

  it("조과가 없으면 빈 상태를 보여준다", () => {
    // 정상 응답이지만 data가 없는 상태다. loading/error와 구분되는 empty state를 검증한다.
    setupCatchLogQueryState({ data: [] });

    render(<CatchLogListScreen />);

    expect(screen.getByText("아직 등록한 조과가 없습니다")).toBeTruthy();
  });
});

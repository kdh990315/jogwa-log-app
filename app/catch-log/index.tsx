import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CatchLogFilterTab from "@/components/catch-log/CatchLogFilterTab";
import CatchLogHeader from "@/components/catch-log/CatchLogHeader";
import CatchLogListStatus from "@/components/catch-log/CatchLogListStatus";
import CatchLogResultsList from "@/components/catch-log/CatchLogResultsList";
import CatchLogSearchBar from "@/components/catch-log/CatchLogSearchBar";
import CatchLogTab from "@/components/catch-log/CatchLogTab";
import { colors } from "@/constants";
import { CATCH_LOG_FILTERS } from "@/constants/catch-log";
import { useCatchLogList } from "@/hooks/queries/use-catch-logs";
import { useAppTheme } from "@/hooks/use-app-theme";
import type {
  CatchLogListFilter,
  CatchLogListItem,
  WaterType,
} from "@/types/catch-log";
import { getCatchLogResultCount } from "@/utils/CatchLogResultCounter";
import { getUserErrorMessage } from "@/utils/user-error-message";

type CatchLogSearchParams = {
  view?: string;
  waterType?: string;
};

// 현재 테마에 맞는 화면 색상 토큰을 한곳에서 계산한다.
const getPalette = (isDark: boolean) => ({
  accent: colors.BRAND_PRIMARY,
  accentSoft: isDark ? colors.DARK_SURFACE_MUTED : colors.BRAND_PRIMARY_SOFT,
  background: isDark ? colors.DARK_BACKGROUND_DEEP : colors.WHITE,
  backButtonText: isDark ? colors.WHITE : colors.INK,
  cardBackground: isDark ? colors.DARK_SURFACE : colors.WHITE,
  cardBorder: isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT,
  chevron: colors.GRAY_400,
  controlBackground: isDark ? colors.DARK_SURFACE_MUTED : colors.SURFACE_SOFT,
  onAccent: colors.WHITE,
  textPrimary: isDark ? colors.WHITE : colors.INK,
  textSecondary: isDark ? colors.GRAY_400 : colors.MUTED_TEXT,
  textTertiary: colors.GRAY_400,
});

// 조과 목록 화면의 최상위 컨테이너다.
// URL 파라미터, 필터/검색 상태, 서버 데이터 조회 결과를 조합해 FlatList에 전달할 표시 데이터를 만든다.
const CatchLogListScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { view, waterType } = useLocalSearchParams<CatchLogSearchParams>();

  const initialWaterType: WaterType = waterType === "fresh" ? "fresh" : "salt";
  const initialFilter: CatchLogListFilter =
    view === "points" ? "points" : "latest";

  // 사용자의 바다/민물 탭의 상태
  const [selectedWaterType, setSelectedWaterType] =
    useState<WaterType>(initialWaterType);
  // 최신순/최대어순/포인별 탭의 상태
  const [activeFilter, setActiveFilter] =
    useState<CatchLogListFilter>(initialFilter);
  // 검색창 값
  const [searchQuery, setKeyword] = useState("");
  // 이걸 유틸함수로 만들거나 공용 훅으로 뺴서 사용하는 방안 생각해보기
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const {
    data: catchLogResult,
    error: catchLogError,
    isLoading: isCatchLogsLoading,
  } = useCatchLogList({
    filter: activeFilter,
    searchQuery: debouncedSearchQuery,
    waterType: selectedWaterType,
  });

  const palette = getPalette(isDark);

  const catchLogRecordCount = getCatchLogResultCount(catchLogResult);

  const activeFilterLabel =
    CATCH_LOG_FILTERS.find(({ value }) => value === activeFilter)?.label ?? "";

  const catchLogErrorMessage = getUserErrorMessage(
    catchLogError,
    "조과 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );

  //이것도 디바운스 유틸 함수로 분할 고려해보기
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // 조과 카드를 누르면 해당 조과 상세 화면으로 이동한다.
  const handlePressCatchItem = (catchItem: CatchLogListItem) => {
    router.push(`/catch-log/${catchItem.id}`);
  };

  // 그룹 카드를 누르면 그룹명을 검색어로 넣고 최신순 목록으로 전환해 실제 조과 행을 보여준다.
  const handlePressPointGroup = (pointName: string) => {
    setKeyword(pointName);
    setDebouncedSearchQuery(pointName);
    setActiveFilter("latest");
  };

  const catchLogListStatus = (
    <CatchLogListStatus
      colors={{
        accent: palette.accent,
        background: palette.cardBackground,
        border: palette.cardBorder,
        primaryText: palette.textPrimary,
        secondaryText: palette.textTertiary,
      }}
      errorMessage={catchLogError ? catchLogErrorMessage : null}
      isLoading={isCatchLogsLoading}
      isSearching={searchQuery.trim().length > 0}
    />
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <CatchLogSearchBar
        colors={{
          background: palette.cardBackground,
          border: palette.cardBorder,
          placeholder: palette.textTertiary,
          text: palette.textPrimary,
        }}
        onChangeText={setKeyword}
        value={searchQuery}
      />

      <CatchLogTab
        colors={{
          activeBackground: palette.cardBackground,
          activeBorder: palette.cardBorder,
          activeText: palette.textPrimary,
          background: palette.controlBackground,
          inactiveText: palette.textSecondary,
        }}
        onSelectWaterType={setSelectedWaterType}
        selectedWaterType={selectedWaterType}
      />

      <CatchLogFilterTab
        activeFilter={activeFilter}
        colors={{
          activeBackground: palette.accent,
          activeText: palette.onAccent,
          background: palette.cardBackground,
          border: palette.cardBorder,
          inactiveText: palette.textSecondary,
        }}
        onSelectFilter={setActiveFilter}
      />

      <CatchLogResultsList
        bottomInset={insets.bottom}
        colors={{
          accent: palette.accent,
          accentSoft: palette.accentSoft,
          cardBackground: palette.cardBackground,
          cardBorder: palette.cardBorder,
          chevron: palette.chevron,
          textPrimary: palette.textPrimary,
          textSecondary: palette.textSecondary,
          textTertiary: palette.textTertiary,
        }}
        emptyComponent={catchLogListStatus}
        headerComponent={
          <CatchLogHeader
            filterLabel={activeFilterLabel}
            filterTextColor={palette.textTertiary}
            recordCount={catchLogRecordCount}
            recordCountTextColor={palette.textSecondary}
          />
        }
        onPressCatch={handlePressCatchItem}
        onPressPoint={handlePressPointGroup}
        result={catchLogResult}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});

export default CatchLogListScreen;

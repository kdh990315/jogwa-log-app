import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ListRenderItem,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  CATCH_LOG_FILTERS,
} from "@/constants/catch-log";
import { colors } from "@/constants";
import RecentCatchCard from "@/components/catch-log/RecentCatchCard";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMyCatchLogs } from "@/hooks/queries/use-catch-logs";
import type {
  CatchLogListFilter,
  CatchLogListItem,
  WaterType,
} from "@/types/catch-log";
import { getUserErrorMessage } from "@/utils/user-error-message";

type GroupMode = "location";

interface CatchRowListItem {
  kind: "catch";
  id: string;
  catchItem: CatchLogListItem;
}

interface CatchSpeciesHeaderListItem {
  kind: "speciesHeader";
  id: string;
  title: string;
  totalRecords: number;
}

interface CatchGroupListItem {
  kind: "group";
  id: string;
  title: string;
  totalRecords: number;
  totalCatchCount: number;
  mainSpecies: string;
  lastDate: string;
  searchValue: string;
}

type CatchListDisplayItem =
  | CatchRowListItem
  | CatchSpeciesHeaderListItem
  | CatchGroupListItem;

// REFACTOR: route param 처리, 검색/정렬/그룹핑, palette 계산, list render 분기가 한 화면에 몰려 있다.
// query param 정규화와 display item 생성은 hook/util로 빼고, 헤더/필터/list는 섹션 컴포넌트로 나누는 편이 유지보수에 낫다.
export default function CatchLogListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { view, waterType } = useLocalSearchParams<
    Record<string, string | string[]>
  >();

  const normalizedView = normalizeParam(view);
  const normalizedWaterType = getWaterTypeFromParam(normalizeParam(waterType));

  const [selectedWaterType, setSelectedWaterType] =
    useState<WaterType>(normalizedWaterType);
  const [activeFilter, setActiveFilter] = useState<CatchLogListFilter>(
    getInitialFilter(normalizedView),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: catchLogItems = [],
    error: catchLogError,
    isLoading: isCatchLogsLoading,
  } = useMyCatchLogs();
  const palette = getPalette(isDark);
  const catchLogErrorMessage = getUserErrorMessage(
    catchLogError,
    "조과 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );

  useEffect(() => {
    setSelectedWaterType(normalizedWaterType);
    setSearchQuery("");
  }, [normalizedWaterType]);

  useEffect(() => {
    setActiveFilter(getInitialFilter(normalizedView));
    setSearchQuery("");
  }, [normalizedView]);

  const filteredCatchItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return catchLogItems.filter((item) => {
      if (item.type !== selectedWaterType) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      return matchesSearchQuery(item, normalizedQuery);
    });
  }, [catchLogItems, searchQuery, selectedWaterType]);

  const displayItems = useMemo<CatchListDisplayItem[]>(() => {
    if (activeFilter === "어종별") {
      return buildSpeciesSectionItems(filteredCatchItems);
    }

    if (activeFilter === "포인트별") {
      return buildGroupedItems(filteredCatchItems, "location");
    }

    const sortedCatchItems = [...filteredCatchItems].sort((left, right) => {
      if (activeFilter === "최대어순") {
        const sizeGap = (right.sizeCm ?? -1) - (left.sizeCm ?? -1);

        if (sizeGap !== 0) {
          return sizeGap;
        }
      }

      return getDateValue(right.date) - getDateValue(left.date);
    });

    return sortedCatchItems.map((item) => ({
      kind: "catch",
      id: `catch-${item.id}`,
      catchItem: item,
    }));
  }, [activeFilter, filteredCatchItems]);

  function handlePressCatchItem(catchItem: CatchLogListItem) {
    router.push(`/catch-log/${catchItem.id}`);
  }

  function handlePressGroupedItem(item: CatchGroupListItem) {
    setSearchQuery(item.searchValue);
    setActiveFilter("최신순");
  }

  function handlePressBack() {
    router.back();
  }

  const renderItem: ListRenderItem<CatchListDisplayItem> = ({ item }) => {
    if (item.kind === "speciesHeader") {
      return (
        <View style={styles.speciesSectionHeader}>
          <Text style={[styles.speciesSectionTitle, { color: palette.textPrimary }]}>
            {item.title}
          </Text>
          <Text
            style={[styles.speciesSectionCount, { color: palette.textSecondary }]}
          >
            {item.totalRecords}건
          </Text>
        </View>
      );
    }

    if (item.kind === "group") {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handlePressGroupedItem(item)}
          style={[
            styles.groupedCard,
            { borderBottomColor: palette.surfaceMuted },
          ]}
        >
          <View
            style={[
              styles.groupedIcon,
              { backgroundColor: palette.surfaceMuted },
            ]}
          >
            <Text style={styles.groupedIconText}>
              {activeFilter === "포인트별" ? "📍" : "🐟"}
            </Text>
          </View>

          <View style={styles.groupedInfo}>
            <Text style={[styles.groupedTitle, { color: palette.textPrimary }]}>
              {item.title}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.groupedSubtitle, { color: palette.textSecondary }]}
            >
              총 {item.totalRecords}건 기록 · 주요 어종: {item.mainSpecies}
            </Text>
          </View>

          <Text style={[styles.groupedDate, { color: palette.textTertiary }]}>
            {formatShortDate(item.lastDate)}
          </Text>
        </TouchableOpacity>
      );
    }

    const catchItem = item.catchItem;

    return (
      <RecentCatchCard
        catchItem={catchItem}
        colors={{
          accentText: palette.accent,
          badgeBackground: palette.surfaceMuted,
          badgeText: palette.textSecondary,
          cardBackground: palette.background,
          cardBorder: palette.surfaceSubtle,
          chevron: palette.textTertiary,
          metaText: palette.textTertiary,
          primaryText: palette.textPrimary,
        }}
        onPress={() => handlePressCatchItem(catchItem)}
        style={styles.recentCatchCard}
      />
    );
  };

  const listHeaderComponent =
    activeFilter === "어종별" ? (
      <Text style={[styles.totalCountText, { color: palette.textPrimary }]}>
        총 {filteredCatchItems.length}개의 기록
      </Text>
    ) : null;
  const listEmptyComponent = (
    <CatchLogListEmptyState
      errorMessage={catchLogError ? catchLogErrorMessage : null}
      isLoading={isCatchLogsLoading}
      isSearching={searchQuery.trim().length > 0}
      palette={palette}
    />
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: palette.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="뒤로가기"
          activeOpacity={0.8}
          onPress={handlePressBack}
          style={styles.backButton}
        >
          <Ionicons
            color={palette.backButtonText}
            name="chevron-back"
            size={22}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
          전체 조과 기록
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: palette.surfaceMuted },
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          onChangeText={setSearchQuery}
          placeholder="어종, 지역 등을 검색해보세요"
          placeholderTextColor={palette.textTertiary}
          style={[styles.searchInput, { color: palette.textPrimary }]}
          value={searchQuery}
        />
      </View>

      <View
        style={[
          styles.segmentContainer,
          { backgroundColor: palette.surfaceMuted },
        ]}
      >
        {(
          [
            { label: "바다", value: "salt" },
            { label: "민물", value: "fresh" },
          ] as const
        ).map((segment) => {
          const isActive = selectedWaterType === segment.value;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              key={segment.value}
              onPress={() => setSelectedWaterType(segment.value)}
              style={[
                styles.segmentButton,
                isActive && [
                  styles.segmentActive,
                  { backgroundColor: palette.background },
                ],
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: isActive ? palette.textPrimary : palette.textTertiary,
                    fontWeight: isActive ? "700" : "600",
                  },
                ]}
              >
                {segment.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView
          contentContainerStyle={styles.filterScroll}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {CATCH_LOG_FILTERS.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: palette.background,
                    borderColor: palette.surfaceSubtle,
                  },
                  isActive && {
                    backgroundColor: palette.accent,
                    borderColor: palette.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isActive ? palette.background : palette.textSecondary,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: 40 + insets.bottom },
        ]}
        data={displayItems}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={listEmptyComponent}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function CatchLogListEmptyState({
  errorMessage,
  isLoading,
  isSearching,
  palette,
}: {
  errorMessage: string | null;
  isLoading: boolean;
  isSearching: boolean;
  palette: ReturnType<typeof getPalette>;
}) {
  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator color={palette.accent} />
        <Text style={[styles.emptyDescription, { color: palette.textTertiary }]}>
          조과 기록을 불러오는 중입니다
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
          기록을 불러오지 못했습니다
        </Text>
        <Text style={[styles.emptyDescription, { color: palette.textTertiary }]}>
          {errorMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
        {isSearching ? "검색 결과가 없습니다" : "아직 등록한 조과가 없습니다"}
      </Text>
      <Text style={[styles.emptyDescription, { color: palette.textTertiary }]}>
        {isSearching
          ? "다른 어종이나 포인트명으로 다시 검색해보세요"
          : "조과 등록에서 첫 기록을 남겨보세요"}
      </Text>
    </View>
  );
}

// REFACTOR: 이 route param 정규화 헬퍼는 상세 화면과 중복된다.
// Expo Router param helper를 공통 util로 두면 화면마다 같은 방어 코드를 반복하지 않아도 된다.
function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getInitialFilter(view: string | undefined): CatchLogListFilter {
  if (view === "points") {
    return "포인트별";
  }

  return "최신순";
}

function getWaterTypeFromParam(waterType: string | undefined): WaterType {
  if (waterType === "fresh") {
    return "fresh";
  }

  return "salt";
}

function matchesSearchQuery(
  item: CatchLogListItem,
  normalizedQuery: string,
): boolean {
  const searchableText = [item.species, item.location, item.tide, item.date]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function getDateValue(date: string): number {
  return Number(date.replace(/\./g, ""));
}

function formatShortDate(date: string): string {
  return date.length > 5 ? date.slice(5) : date;
}

function buildSpeciesSectionItems(
  items: CatchLogListItem[],
): CatchListDisplayItem[] {
  const sortedItems = [...items].sort(
    (left, right) => getDateValue(right.date) - getDateValue(left.date),
  );
  const groupedMap = new Map<string, CatchLogListItem[]>();

  sortedItems.forEach((item) => {
    const currentGroup = groupedMap.get(item.species) ?? [];

    currentGroup.push(item);
    groupedMap.set(item.species, currentGroup);
  });

  return [...groupedMap.entries()].flatMap(([species, speciesItems]) => {
    const headerItem: CatchSpeciesHeaderListItem = {
      kind: "speciesHeader",
      id: `species-header-${species}`,
      title: species,
      totalRecords: speciesItems.length,
    };

    const catchItems: CatchRowListItem[] = speciesItems.map((item) => ({
      kind: "catch",
      id: `catch-${item.id}`,
      catchItem: item,
    }));

    return [headerItem, ...catchItems];
  });
}

function buildGroupedItems(
  items: CatchLogListItem[],
  mode: GroupMode,
): CatchGroupListItem[] {
  const groupedMap = new Map<
    string,
    {
      title: string;
      totalRecords: number;
      totalCatchCount: number;
      lastDate: string;
      lastDateValue: number;
      speciesCounts: Map<string, number>;
    }
  >();

  items.forEach((item) => {
    const title = mode === "location" ? item.location : item.species;
    const currentGroup = groupedMap.get(title);
    const currentDateValue = getDateValue(item.date);

    if (!currentGroup) {
      const nextSpeciesCounts = new Map<string, number>();

      nextSpeciesCounts.set(item.species, item.count);
      groupedMap.set(title, {
        title,
        totalRecords: 1,
        totalCatchCount: item.count,
        lastDate: item.date,
        lastDateValue: currentDateValue,
        speciesCounts: nextSpeciesCounts,
      });
      return;
    }

    currentGroup.totalRecords += 1;
    currentGroup.totalCatchCount += item.count;
    currentGroup.speciesCounts.set(
      item.species,
      (currentGroup.speciesCounts.get(item.species) ?? 0) + item.count,
    );

    if (currentDateValue > currentGroup.lastDateValue) {
      currentGroup.lastDate = item.date;
      currentGroup.lastDateValue = currentDateValue;
    }
  });

  return [...groupedMap.values()]
    .sort((left, right) => {
      const totalCatchCountGap = right.totalCatchCount - left.totalCatchCount;

      if (totalCatchCountGap !== 0) {
        return totalCatchCountGap;
      }

      const totalRecordGap = right.totalRecords - left.totalRecords;

      if (totalRecordGap !== 0) {
        return totalRecordGap;
      }

      if (right.lastDateValue !== left.lastDateValue) {
        return right.lastDateValue - left.lastDateValue;
      }

      return left.title.localeCompare(right.title, "ko");
    })
    .map((group) => {
      const mainSpecies =
        [...group.speciesCounts.entries()].sort((left, right) => {
          if (right[1] !== left[1]) {
            return right[1] - left[1];
          }

          return left[0].localeCompare(right[0], "ko");
        })[0]?.[0] ?? "기록 없음";

      return {
        kind: "group",
        id: `${mode}-${group.title}`,
        title: group.title,
        totalRecords: group.totalRecords,
        totalCatchCount: group.totalCatchCount,
        mainSpecies,
        lastDate: group.lastDate,
        searchValue: group.title,
      };
    });
}

function getPalette(isDark: boolean) {
  return {
    accent: colors.BLUE_600,
    accentSoft: colors.BLUE_100,
    background: isDark ? colors.DARK_BACKGROUND : colors.WHITE,
    backButtonText: isDark ? colors.WHITE : colors.GRAY_600,
    surfaceMuted: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100,
    surfaceSubtle: isDark ? colors.DARK_BORDER : colors.GRAY_300,
    textPrimary: isDark ? colors.WHITE : colors.GRAY_600,
    textSecondary: isDark ? colors.GRAY_400 : colors.GRAY_500,
    textTertiary: colors.GRAY_400,
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  segmentContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentActive: {
    boxShadow: "0 0 4px rgba(0, 0, 0, 0.05)",
    elevation: 2,
  },
  segmentText: {
    fontSize: 16,
  },
  filterWrapper: {
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  totalCountText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  speciesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  speciesSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  speciesSectionCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  recentCatchCard: {
    marginBottom: 10,
  },
  groupedCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  groupedIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  groupedIconText: {
    fontSize: 20,
  },
  groupedInfo: {
    flex: 1,
  },
  groupedTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  groupedSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  groupedDate: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
  },
});

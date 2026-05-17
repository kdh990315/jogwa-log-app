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
import { useCatchLogList } from "@/hooks/queries/use-catch-logs";
import type {
  CatchLogListFilter,
  CatchLogListItem,
  WaterType,
} from "@/types/catch-log";
import {
  formatCatchLogShortDateLabel,
  getCatchLogDateValue,
  getCatchLogPointLabel,
  getCatchLogTideLabel,
} from "@/utils/catch-log-display";
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
  } = useCatchLogList();
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

      return (
        getCatchLogDateValue(right.fishingDate) -
        getCatchLogDateValue(left.fishingDate)
      );
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
          <Text
            numberOfLines={1}
            style={[styles.speciesSectionTitle, { color: palette.textPrimary }]}
          >
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
            {
              backgroundColor: palette.cardBackground,
              borderColor: palette.cardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.groupedIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              color={palette.accent}
              name={activeFilter === "포인트별" ? "location-outline" : "fish-outline"}
              size={20}
            />
          </View>

          <View style={styles.groupedInfo}>
            <Text
              numberOfLines={1}
              style={[styles.groupedTitle, { color: palette.textPrimary }]}
            >
              {item.title}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.groupedSubtitle, { color: palette.textSecondary }]}
            >
              총 {item.totalRecords}건 기록 · 주요 어종: {item.mainSpecies}
            </Text>
          </View>

          <View style={styles.groupedTrail}>
            <Text
              numberOfLines={1}
              style={[styles.groupedDate, { color: palette.textTertiary }]}
            >
              {formatCatchLogShortDateLabel(item.lastDate)}
            </Text>
            <Ionicons color={palette.chevron} name="chevron-forward" size={16} />
          </View>
        </TouchableOpacity>
      );
    }

    const catchItem = item.catchItem;

    return (
      <RecentCatchCard
        catchItem={catchItem}
        colors={{
          accentText: palette.accent,
          badgeBackground: palette.accentSoft,
          badgeText: palette.textSecondary,
          cardBackground: palette.cardBackground,
          cardBorder: palette.cardBorder,
          chevron: palette.chevron,
          metaText: palette.textTertiary,
          primaryText: palette.textPrimary,
        }}
        onPress={() => handlePressCatchItem(catchItem)}
        style={styles.recentCatchCard}
      />
    );
  };

  const listHeaderComponent =
    filteredCatchItems.length > 0 ? (
      <View style={styles.listMetaRow}>
        <Text style={[styles.totalCountText, { color: palette.textSecondary }]}>
          {filteredCatchItems.length} records
        </Text>
        <Text style={[styles.totalCountText, { color: palette.textTertiary }]}>
          {activeFilter}
        </Text>
      </View>
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
          style={[
            styles.backButton,
            {
              backgroundColor: palette.controlBackground,
              borderColor: palette.cardBorder,
            },
          ]}
        >
          <Ionicons
            color={palette.backButtonText}
            name="chevron-back"
            size={22}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
          조과 기록
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: palette.cardBackground,
            borderColor: palette.cardBorder,
          },
        ]}
      >
        <Ionicons color={palette.textTertiary} name="search" size={19} />
        <TextInput
          onChangeText={setSearchQuery}
          placeholder="어종, 포인트 검색"
          placeholderTextColor={palette.textTertiary}
          style={[styles.searchInput, { color: palette.textPrimary }]}
          value={searchQuery}
        />
      </View>

      <View
        style={[
          styles.segmentContainer,
          { backgroundColor: palette.controlBackground },
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
                  {
                    backgroundColor: palette.cardBackground,
                    borderColor: palette.cardBorder,
                  },
                ],
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: isActive ? palette.textPrimary : palette.textSecondary,
                    fontWeight: isActive ? "700" : "500",
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
                    backgroundColor: palette.cardBackground,
                    borderColor: palette.cardBorder,
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
                      color: isActive ? palette.onAccent : palette.textSecondary,
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
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: palette.cardBackground,
            borderColor: palette.cardBorder,
          },
        ]}
      >
        <ActivityIndicator color={palette.accent} />
        <Text style={[styles.emptyDescription, { color: palette.textTertiary }]}>
          조과 기록을 불러오는 중입니다
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: palette.cardBackground,
            borderColor: palette.cardBorder,
          },
        ]}
      >
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
    <View
      style={[
        styles.emptyContainer,
        {
          backgroundColor: palette.cardBackground,
          borderColor: palette.cardBorder,
        },
      ]}
    >
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
  const searchableText = [
    item.speciesName,
    getCatchLogPointLabel(item.pointName),
    getCatchLogTideLabel(item.tide, item.type),
    item.fishingDate,
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function buildSpeciesSectionItems(
  items: CatchLogListItem[],
): CatchListDisplayItem[] {
  const sortedItems = [...items].sort(
    (left, right) =>
      getCatchLogDateValue(right.fishingDate) -
      getCatchLogDateValue(left.fishingDate),
  );
  const groupedMap = new Map<string, CatchLogListItem[]>();

  sortedItems.forEach((item) => {
    const currentGroup = groupedMap.get(item.speciesName) ?? [];

    currentGroup.push(item);
    groupedMap.set(item.speciesName, currentGroup);
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
    const title =
      mode === "location"
        ? getCatchLogPointLabel(item.pointName)
        : item.speciesName;
    const currentGroup = groupedMap.get(title);
    const currentDateValue = getCatchLogDateValue(item.fishingDate);

    if (!currentGroup) {
      const nextSpeciesCounts = new Map<string, number>();

      nextSpeciesCounts.set(item.speciesName, item.count);
      groupedMap.set(title, {
        title,
        totalRecords: 1,
        totalCatchCount: item.count,
        lastDate: item.fishingDate,
        lastDateValue: currentDateValue,
        speciesCounts: nextSpeciesCounts,
      });
      return;
    }

    currentGroup.totalRecords += 1;
    currentGroup.totalCatchCount += item.count;
    currentGroup.speciesCounts.set(
      item.speciesName,
      (currentGroup.speciesCounts.get(item.speciesName) ?? 0) + item.count,
    );

    if (currentDateValue > currentGroup.lastDateValue) {
      currentGroup.lastDate = item.fishingDate;
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  headerSpacer: {
    width: 34,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    marginBottom: 8,
    gap: 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 0,
  },
  segmentContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.TRANSPARENT,
  },
  segmentActive: {
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 13,
    lineHeight: 17,
  },
  filterWrapper: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    lineHeight: 15,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalCountText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
  },
  speciesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  speciesSectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  speciesSectionCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  recentCatchCard: {
    marginBottom: 8,
  },
  groupedCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  groupedIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  groupedInfo: {
    flex: 1,
    minWidth: 0,
  },
  groupedTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    marginBottom: 2,
  },
  groupedSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  groupedTrail: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 4,
    marginLeft: 10,
  },
  groupedDate: {
    fontSize: 10,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 34,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});

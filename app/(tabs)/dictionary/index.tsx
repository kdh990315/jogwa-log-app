import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { logAnalyticsEvent } from "@/api/analytics";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import AppScreenHeader from "@/components/AppScreenHeader";
import AppStateView from "@/components/AppStateView";
import { colors } from "@/constants";
import { analyticsEvents } from "@/constants/analytics";
import { getFishCollectionImageSource } from "@/constants/fish-collection-images";
import { useSpeciesDexCatchLogs } from "@/hooks/queries/use-catch-logs";
import { useFishSpecies } from "@/hooks/queries/use-fish-species";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { FishSpeciesWaterType } from "@/types/fish-species";
import {
  buildCaughtSpeciesStats,
  getCaughtStatsForFishSpecies,
} from "@/utils/species-dex";
import { getUserErrorMessage } from "@/utils/user-error-message";

type DictionaryCategory = "salt" | "fresh";

interface FishDictionaryItem {
  caughtCount: number;
  id: number;
  isCaught: boolean;
  name: string;
  totalCatchCount: number;
  type: DictionaryCategory;
}

interface DictionaryCategoryStats {
  caughtCount: number;
  totalCount: number;
}

interface QuestionCircleIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function DictionaryScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const backgroundColor = isDark ? colors.DARK_BACKGROUND : colors.SURFACE_SOFT;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_400;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;
  const [dictCategory, setDictCategory] = useState<DictionaryCategory>("salt");
  const [showTooltip, setShowTooltip] = useState(false);
  const {
    data: fishSpeciesList = [],
    error: fishSpeciesError,
    isLoading: isFishSpeciesLoading,
  } = useFishSpecies();
  const {
    data: catchLogItems = [],
    error: catchLogError,
    isLoading: isCatchLogsLoading,
  } = useSpeciesDexCatchLogs();

  useEffect(() => {
    void logAnalyticsEvent(analyticsEvents.speciesDexView);
  }, []);

  useEffect(() => {
    if (!showTooltip) return undefined;

    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showTooltip]);

  const caughtSpeciesStats = useMemo(
    () => buildCaughtSpeciesStats(catchLogItems),
    [catchLogItems],
  );
  const dictionaryItems = useMemo<FishDictionaryItem[]>(
    () =>
      fishSpeciesList.map((fish) => {
        const stats = getCaughtStatsForFishSpecies(caughtSpeciesStats, fish);

        return {
          caughtCount: stats.recordCount,
          id: fish.id,
          isCaught: stats.recordCount > 0,
          name: fish.name,
          totalCatchCount: stats.totalCatchCount,
          type: getDictionaryCategory(fish.waterType),
        };
      }),
    [caughtSpeciesStats, fishSpeciesList],
  );
  const categoryStats = useMemo(
    () => getDictionaryCategoryStats(dictionaryItems),
    [dictionaryItems],
  );
  const selectedStats = categoryStats[dictCategory];
  const filteredDictList = useMemo(
    () =>
      dictionaryItems
        .filter((fish) => fish.type === dictCategory)
        .sort((left, right) => {
          if (left.isCaught !== right.isCaught) {
            return Number(right.isCaught) - Number(left.isCaught);
          }

          return left.id - right.id;
        }),
    [dictCategory, dictionaryItems],
  );
  const fishSpeciesErrorMessage = getUserErrorMessage(
    fishSpeciesError,
    "어종 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  );
  const catchLogErrorMessage = getUserErrorMessage(
    catchLogError,
    "내 조과 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  );
  const isLoading = isFishSpeciesLoading || isCatchLogsLoading;
  const errorMessage = fishSpeciesError
    ? fishSpeciesErrorMessage
    : catchLogError
      ? catchLogErrorMessage
      : null;

  function handlePressFish(fish: FishDictionaryItem) {
    router.push(`/dictionary/${fish.id}`);
  }

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.safeArea, { backgroundColor }]}
    >
      <AppScreenHeader
        eyebrow="COLLECTION LOG"
        iconName="book-outline"
        title="도감"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={[styles.container, { backgroundColor }]}
      >
        <View style={styles.progressHeader}>
          <View style={styles.progressTextRow}>
            <View style={styles.progressTitleGroup}>
              <Text style={[styles.progressTitle, { color: textColor }]}>
                수집 진행도
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowTooltip(true)}
                style={[
                  styles.questionButton,
                  {
                    backgroundColor: isDark
                      ? colors.DARK_BORDER
                      : colors.GRAY_200,
                    borderColor,
                  },
                ]}
              >
                <QuestionCircleIcon
                  color={mutedTextColor}
                  height={18}
                  width={18}
                />
              </TouchableOpacity>

              {showTooltip ? (
                <View
                  style={[
                    styles.tooltipBox,
                    {
                      backgroundColor: isDark
                        ? colors.DARK_BORDER
                        : colors.GRAY_200,
                      borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tooltipText,
                      { color: isDark ? colors.GRAY_100 : colors.GRAY_500 },
                    ]}
                  >
                    어종 등록을 하면 자동으로 채워집니다
                  </Text>
                  <View
                    style={[
                      styles.tooltipTail,
                      {
                        borderBottomColor: isDark
                          ? colors.DARK_BORDER
                          : colors.GRAY_200,
                      },
                    ]}
                  />
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.progressCountHighlight,
                { color: colors.BRAND_PRIMARY },
              ]}
            >
              {selectedStats.caughtCount}{" "}
              <Text
                style={[styles.progressCountTotal, { color: mutedTextColor }]}
              >
                / {selectedStats.totalCount}
              </Text>
            </Text>
          </View>

          <View style={styles.categoryTabs}>
            <DictionaryCategoryTab
              caughtCount={categoryStats.salt.caughtCount}
              iconName="fish-outline"
              isActive={dictCategory === "salt"}
              isDark={isDark}
              label="바다"
              onPress={() => setDictCategory("salt")}
              totalCount={categoryStats.salt.totalCount}
              type="salt"
            />
            <DictionaryCategoryTab
              caughtCount={categoryStats.fresh.caughtCount}
              iconName="water-outline"
              isActive={dictCategory === "fresh"}
              isDark={isDark}
              label="민물"
              onPress={() => setDictCategory("fresh")}
              totalCount={categoryStats.fresh.totalCount}
              type="fresh"
            />
          </View>
        </View>

        {isLoading ? (
          <AppStateView
            description="어종 목록과 내 조과 기록을 불러오고 있어요."
            isLoading
            mutedTextColor={mutedTextColor}
            style={styles.stateView}
            textColor={textColor}
            title="도감을 불러오는 중"
          />
        ) : errorMessage ? (
          <AppStateView
            description={errorMessage}
            mutedTextColor={mutedTextColor}
            style={styles.stateView}
            textColor={textColor}
            title="도감을 불러오지 못했어요"
          />
        ) : filteredDictList.length === 0 ? (
          <AppStateView
            description={`선택한 ${getDictionaryCategoryLabel(
              dictCategory,
            )} 분류에 아직 등록된 어종이 없습니다.`}
            mutedTextColor={mutedTextColor}
            style={styles.stateView}
            textColor={textColor}
            title="등록된 어종이 없어요"
          />
        ) : (
          <>
            <View style={styles.gridContainer}>
              {filteredDictList.map((fish, index) => (
                <TouchableOpacity
                  activeOpacity={0.82}
                  accessibilityLabel={
                    fish.isCaught ? `${fish.name} 도감 상세` : "미해금 어종"
                  }
                  disabled={!fish.isCaught}
                  key={fish.id}
                  onPress={() => handlePressFish(fish)}
                  style={[
                    styles.gridItem,
                    index % 3 !== 2 && styles.gridItemSpacing,
                  ]}
                >
                  <View
                    style={[
                      styles.imageBox,
                      {
                        backgroundColor: fish.isCaught
                          ? isDark
                            ? colors.DARK_SURFACE_MUTED
                            : colors.WHITE
                          : isDark
                            ? colors.DARK_SURFACE_MUTED
                            : colors.GRAY_100,
                        borderColor: fish.isCaught
                          ? isDark
                            ? colors.DARK_BORDER
                            : colors.GRAY_300
                          : borderColor,
                      },
                    ]}
                  >
                    {fish.isCaught ? (
                      <Image
                        source={getFishCollectionImageSource(fish.id)}
                        style={styles.fishImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.uncaughtMarkContainer,
                          {
                            borderColor: isDark
                              ? colors.DARK_MUTED_TEXT
                              : colors.GRAY_300,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.uncaughtMark,
                            {
                              color: isDark
                                ? colors.DARK_MUTED_TEXT
                                : colors.GRAY_300,
                            },
                          ]}
                        >
                          ?
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.fishName,
                      {
                        color: fish.isCaught ? textColor : mutedTextColor,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {fish.isCaught ? fish.name : "???"}
                  </Text>
                  {fish.isCaught ? (
                    <Text
                      numberOfLines={1}
                      style={[styles.fishCount, { color: mutedTextColor }]}
                    >
                      {fish.caughtCount}회 · {fish.totalCatchCount}마리
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>

            <AdBannerSlot
              accessibilityLabel="도감 하단 광고 배너 영역"
              containerStyle={styles.dictionaryBottomAdSlot}
              isDark={isDark}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getDictionaryCategory(
  waterType: FishSpeciesWaterType,
): DictionaryCategory {
  if (waterType === "freshwater") {
    return "fresh";
  }

  return "salt";
}

function getDictionaryCategoryStats(
  dictionaryItems: FishDictionaryItem[],
): Record<DictionaryCategory, DictionaryCategoryStats> {
  return dictionaryItems.reduce<
    Record<DictionaryCategory, DictionaryCategoryStats>
  >(
    (stats, fish) => {
      stats[fish.type].totalCount += 1;

      if (fish.isCaught) {
        stats[fish.type].caughtCount += 1;
      }

      return stats;
    },
    {
      fresh: { caughtCount: 0, totalCount: 0 },
      salt: { caughtCount: 0, totalCount: 0 },
    },
  );
}

function getDictionaryAccentColor(type: DictionaryCategory) {
  return type === "salt" ? colors.BRAND_PRIMARY : colors.GREEN_600;
}

function getDictionaryCategoryLabel(type: DictionaryCategory) {
  return type === "salt" ? "바다" : "민물";
}

function getCaughtSpeciesBackgroundColor(
  type: DictionaryCategory,
  isDark: boolean,
) {
  if (isDark) {
    return colors.DARK_SURFACE_MUTED;
  }

  return type === "salt" ? colors.BRAND_PRIMARY_SOFT : colors.GREEN_100;
}

interface DictionaryCategoryTabProps {
  caughtCount: number;
  iconName: "fish-outline" | "water-outline";
  isActive: boolean;
  isDark: boolean;
  label: string;
  onPress: () => void;
  totalCount: number;
  type: DictionaryCategory;
}

function DictionaryCategoryTab({
  caughtCount,
  iconName,
  isActive,
  isDark,
  label,
  onPress,
  totalCount,
  type,
}: DictionaryCategoryTabProps) {
  const accentColor = getDictionaryAccentColor(type);
  const borderColor = isActive
    ? accentColor
    : isDark
      ? colors.DARK_BORDER
      : colors.HAIRLINE_SOFT;
  const backgroundColor = isActive
    ? getCaughtSpeciesBackgroundColor(type, isDark)
    : isDark
      ? colors.DARK_SURFACE
      : colors.WHITE;
  const iconBackgroundColor = isActive
    ? accentColor
    : isDark
      ? colors.DARK_SURFACE_MUTED
      : colors.GRAY_100;
  const iconColor = isActive
    ? colors.WHITE
    : isDark
      ? colors.GRAY_400
      : colors.GRAY_500;
  const labelColor = isActive
    ? accentColor
    : isDark
      ? colors.GRAY_100
      : colors.GRAY_500;
  const countColor = isActive
    ? isDark
      ? colors.GRAY_100
      : colors.GRAY_600
    : colors.GRAY_400;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.categoryTab,
        {
          backgroundColor,
          borderColor,
        },
        isActive && [styles.categoryTabActive, { borderColor: accentColor }],
      ]}
    >
      <View
        style={[
          styles.categoryTabIcon,
          { backgroundColor: iconBackgroundColor },
        ]}
      >
        <Ionicons color={iconColor} name={iconName} size={18} />
      </View>
      <View style={styles.categoryTabTextGroup}>
        <Text style={[styles.categoryTabLabel, { color: labelColor }]}>
          {label}
        </Text>
        <Text style={[styles.categoryTabCount, { color: countColor }]}>
          {caughtCount}/{totalCount}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function QuestionCircleIcon({
  width = 20,
  height = 20,
  color = colors.GRAY_400,
}: QuestionCircleIconProps) {
  return (
    <Svg
      fill="none"
      height={height}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={width}
    >
      <Path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  progressHeader: {
    marginBottom: 14,
    marginTop: 10,
    paddingHorizontal: 16,
    position: "relative",
    zIndex: 40,
  },
  questionButton: {
    borderRadius: 10,
    height: 26,
    width: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltipBox: {
    position: "absolute",
    top: 32,
    left: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 190,
  },
  tooltipTail: {
    position: "absolute",
    top: -6,
    left: 104,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderStyle: "solid",
    backgroundColor: colors.TRANSPARENT,
    borderLeftColor: colors.TRANSPARENT,
    borderRightColor: colors.TRANSPARENT,
  },
  progressTitleGroup: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 50,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    zIndex: 50,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressCountHighlight: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressCountTotal: {
    fontSize: 11,
    fontWeight: "700",
  },
  categoryTabs: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  categoryTab: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryTabActive: {
    borderWidth: 1,
  },
  categoryTabIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  categoryTabTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  categoryTabLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  categoryTabCount: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    rowGap: 16,
  },
  dictionaryBottomAdSlot: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  stateView: {
    paddingTop: 36,
  },
  gridItem: {
    width: "30.5%",
    alignItems: "center",
  },
  gridItemSpacing: {
    marginRight: "4.25%",
  },
  imageBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fishImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  uncaughtMarkContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uncaughtMark: {
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
    textAlign: "center",
    includeFontPadding: false,
  },
  fishName: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  fishCount: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});

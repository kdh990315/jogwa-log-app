import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { logAnalyticsEvent } from "@/api/analytics";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import { FishIcon, PlusIcon } from "@/components/home/HomeIcons";
import SafetyReminderCard from "@/components/safety-reminder/SafetyReminderCard";
import { colors } from "@/constants";
import { analyticsEvents } from "@/constants/analytics";
import { formatCatchSize } from "@/constants/catch-log";
import { useHomeCatchLogs } from "@/hooks/queries/use-catch-logs";
import { useAppTheme } from "@/hooks/use-app-theme";
import type {
  CatchLogEntryView,
  CatchLogListItem,
  WaterType,
} from "@/types/catch-log";
import {
  formatCatchLogShortDateLabel,
  getCatchLogPointLabel,
} from "@/utils/catch-log-display";
import {
  getHomeStats,
  type MonthlyCatchTrendItem,
  type TidePerformanceItem,
} from "@/utils/home-stats";
import { getUserErrorMessage } from "@/utils/user-error-message";

const CURRENT_YEAR = new Date().getFullYear();
const MONTHLY_CHART_SIDE_INSET = 14;
const MONTHLY_CHART_HEIGHT = 78;
const MONTHLY_CHART_OVERFLOW_TOP = 30;
const MONTHLY_CHART_TOTAL_HEIGHT =
  MONTHLY_CHART_HEIGHT + MONTHLY_CHART_OVERFLOW_TOP;
const MONTHLY_CHART_AREA_HEIGHT = MONTHLY_CHART_TOTAL_HEIGHT + 28;
const MONTHLY_CHART_Y_AXIS_WIDTH = 40;
const MONTHLY_CHART_LABEL_HEIGHT = 18;
const MONTHLY_CHART_NICE_MAX_VALUES = [
  1, 2, 4, 6, 8, 10, 12, 16, 20, 30, 40, 50, 75, 100,
];

export default function HomeTabScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [homeCategory, setHomeCategory] = useState<WaterType>("salt");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const primaryColor = colors.BRAND_PRIMARY;
  const waterAccentColor =
    homeCategory === "salt" ? colors.BRAND_PRIMARY : colors.GREEN_600;
  const backgroundColor = isDark ? colors.DARK_BACKGROUND_DEEP : colors.WHITE;
  const cardBorderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const textColor = isDark ? colors.WHITE : colors.INK;
  const {
    data: catchLogItems = [],
    error: catchLogError,
    isLoading: isCatchLogsLoading,
  } = useHomeCatchLogs();
  const yearOptions = useMemo(
    () =>
      getAvailableCatchYears({
        catchLogItems,
        category: homeCategory,
        fallbackYear: CURRENT_YEAR,
      }),
    [catchLogItems, homeCategory],
  );

  useEffect(() => {
    if (yearOptions.includes(selectedYear)) {
      return;
    }

    setSelectedYear(yearOptions[0] ?? CURRENT_YEAR);
  }, [selectedYear, yearOptions]);

  const homeStats = getHomeStats({
    catchLogItems,
    category: homeCategory,
    year: selectedYear,
  });
  const categoryLabel = homeCategory === "salt" ? "바다" : "민물";
  const summaryCaption =
    homeStats.totalCount > 0
      ? `${homeStats.recentCatches.length}개 최근 기록 · 최대 ${homeStats.maxSize}`
      : "사진, 위치, 물때까지 한 번에 기록";
  const isHomeEmpty =
    !isCatchLogsLoading &&
    !catchLogError &&
    homeStats.recentCatches.length === 0;
  const homeErrorMessage = getUserErrorMessage(
    catchLogError,
    "조과 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );

  function handlePressCatchLog() {
    void logAnalyticsEvent(analyticsEvents.catchLogStart);
    router.push("/catch-register");
  }

  function handleSelectHomeCategory(category: WaterType) {
    setHomeCategory(category);
    setIsYearPickerOpen(false);
  }

  function handlePressCatchList(view: CatchLogEntryView) {
    router.push({
      pathname: "/catch-log",
      params: {
        view,
        waterType: homeCategory,
      },
    });
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor }]}
    >
      <View style={[styles.container, { backgroundColor }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View style={styles.headerTitleContainer}>
              <Text
                style={[styles.screenKicker, { color: colors.BRAND_PRIMARY }]}
              >
                DASHBOARD
              </Text>
              <Text style={[styles.appName, { color: textColor }]}>
                어장관리
              </Text>
            </View>
            <View style={styles.headerYearContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={yearOptions.length <= 1}
                onPress={() => setIsYearPickerOpen((isOpen) => !isOpen)}
                style={[
                  styles.headerYearChip,
                  {
                    backgroundColor: isDark
                      ? colors.DARK_SURFACE_MUTED
                      : colors.SURFACE_SOFT,
                    borderColor: cardBorderColor,
                  },
                ]}
              >
                <Text style={[styles.headerYearChipText, { color: textColor }]}>
                  {selectedYear}년{yearOptions.length > 1 ? " ▾" : ""}
                </Text>
              </TouchableOpacity>
              {isYearPickerOpen && yearOptions.length > 1 ? (
                <View
                  style={[
                    styles.headerYearPickerMenu,
                    {
                      backgroundColor: isDark
                        ? colors.DARK_SURFACE_ELEVATED
                        : colors.WHITE,
                      borderColor: cardBorderColor,
                    },
                  ]}
                >
                  {yearOptions.map((year) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      key={year}
                      onPress={() => {
                        setSelectedYear(year);
                        setIsYearPickerOpen(false);
                      }}
                      style={[
                        styles.yearPickerOption,
                        year === selectedYear && {
                          backgroundColor: isDark
                            ? colors.DARK_SEGMENT_ACTIVE
                            : colors.GRAY_100,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.yearPickerOptionText,
                          {
                            color:
                              year === selectedYear
                                ? primaryColor
                                : mutedTextColor,
                          },
                        ]}
                      >
                        {year}년
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.controlPanel,
              {
                backgroundColor: isDark ? colors.DARK_SURFACE : colors.WHITE,
                borderColor: cardBorderColor,
              },
            ]}
          >
            <View
              style={[
                styles.segmentTrack,
                {
                  backgroundColor: isDark
                    ? colors.DARK_SURFACE_MUTED
                    : colors.SURFACE_SOFT,
                },
              ]}
            >
              <HomeSegmentButton
                isActive={homeCategory === "salt"}
                label="바다"
                onPress={() => handleSelectHomeCategory("salt")}
                isDark={isDark}
                type="salt"
              />
              <HomeSegmentButton
                isActive={homeCategory === "fresh"}
                label="민물"
                onPress={() => handleSelectHomeCategory("fresh")}
                isDark={isDark}
                type="fresh"
              />
            </View>
            <SafetyReminderCard isDark={isDark} variant="compactButton" />
            <TouchableOpacity
              accessibilityLabel="조과 등록"
              activeOpacity={0.82}
              onPress={handlePressCatchLog}
              style={[
                styles.inlineRegisterButton,
                { backgroundColor: colors.BRAND_PRIMARY },
              ]}
            >
              <PlusIcon height={17} width={17} />
              <Text style={styles.inlineRegisterText}>기록</Text>
            </TouchableOpacity>
          </View>

          {isCatchLogsLoading ? (
            <HomeLoadingState isDark={isDark} />
          ) : catchLogError ? (
            <HomeErrorState isDark={isDark} message={homeErrorMessage} />
          ) : isHomeEmpty ? (
            <HomeEmptyState isDark={isDark} onPress={handlePressCatchLog} />
          ) : (
            <>
              <View style={styles.summaryLine}>
                <View style={styles.summaryLineTextGroup}>
                  <Text
                    numberOfLines={1}
                    style={[styles.summaryLineTitle, { color: textColor }]}
                  >
                    {selectedYear}년 {categoryLabel}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.summaryLineCaption,
                      { color: mutedTextColor },
                    ]}
                  >
                    {summaryCaption}
                  </Text>
                </View>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  numberOfLines={1}
                  style={[styles.summaryLineValue, { color: waterAccentColor }]}
                >
                  {homeStats.totalCount}마리
                </Text>
              </View>

              <View style={styles.metricGrid}>
                <MetricTile
                  accentColor={primaryColor}
                  detail={homeStats.totalCountDeltaLabel ?? "올해 누적"}
                  isDark={isDark}
                  label="총 조과"
                  value={`${homeStats.totalCount}`}
                />
                <MetricTile
                  accentColor={primaryColor}
                  detail={homeStats.winRateDeltaLabel ?? "출조 성공률"}
                  isDark={isDark}
                  label="성공률"
                  value={`${homeStats.winRate}%`}
                />
                <MetricTile
                  accentColor={waterAccentColor}
                  detail={homeStats.maxSpecies}
                  isDark={isDark}
                  label="최대어"
                  value={homeStats.maxSize}
                />
                <MetricTile
                  accentColor={colors.ORANGE_500}
                  detail={homeStats.bestConditionSubText ?? "가장 좋은 조건"}
                  isDark={isDark}
                  label={homeStats.bestConditionLabel}
                  value={homeStats.bestConditionValue}
                />
              </View>

              <HomePanel
                actionLabel="전체"
                isDark={isDark}
                onPressAction={() => handlePressCatchList("recent")}
                title="최근 조과"
              >
                <CompactRecentList
                  isDark={isDark}
                  items={homeStats.recentCatches.slice(0, 4)}
                  onPressItem={(itemId) => router.push(`/catch-log/${itemId}`)}
                />
              </HomePanel>

              <HomePanel isDark={isDark} title="월별 흐름">
                <MonthlyBarChart
                  accentColor={primaryColor}
                  data={homeStats.monthlyCatchTrend}
                  isDark={isDark}
                />
              </HomePanel>

              <View style={styles.splitPanels}>
                <HomePanel
                  actionLabel="보기"
                  compact
                  isDark={isDark}
                  onPressAction={() => handlePressCatchList("points")}
                  title="포인트"
                >
                  <CompactPointList
                    bestLocations={homeStats.bestLocations.slice(0, 3)}
                    isDark={isDark}
                  />
                </HomePanel>

                <HomePanel
                  compact
                  isDark={isDark}
                  title={homeCategory === "salt" ? "물때" : "조건"}
                >
                  {homeCategory === "salt" &&
                  homeStats.tidePerformance.length > 0 ? (
                    <CompactTideList
                      data={homeStats.tidePerformance.slice(0, 3)}
                      isDark={isDark}
                    />
                  ) : (
                    <ConditionSummary
                      isDark={isDark}
                      subText={homeStats.bestConditionSubText}
                      value={homeStats.bestConditionValue}
                    />
                  )}
                </HomePanel>
              </View>

              {homeCategory === "salt" &&
              homeStats.tidePerformance.length > 0 ? (
                <HomePanel isDark={isDark} title="물때별 조과">
                  <TidePerformanceList
                    data={homeStats.tidePerformanceBySequence}
                    insightItems={homeStats.tidePerformance.slice(0, 2)}
                    isDark={isDark}
                  />
                </HomePanel>
              ) : null}

              <AdBannerSlot
                containerStyle={styles.homeAdSlot}
                isDark={isDark}
              />
            </>
          )}
        </ScrollView>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePressCatchLog}
          style={[styles.fab, { backgroundColor: colors.BRAND_PRIMARY }]}
        >
          <PlusIcon height={22} width={22} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getAvailableCatchYears({
  catchLogItems,
  category,
  fallbackYear,
}: {
  catchLogItems: CatchLogListItem[];
  category: WaterType;
  fallbackYear: number;
}) {
  const years = new Set([fallbackYear]);

  catchLogItems.forEach((item) => {
    if (item.type !== category) {
      return;
    }

    const [yearText] = item.fishingDate.split("-");
    const year = Number(yearText);

    if (Number.isInteger(year)) {
      years.add(year);
    }
  });

  return [...years].sort((left, right) => right - left);
}

interface HomeSegmentButtonProps {
  isActive: boolean;
  isDark: boolean;
  label: string;
  onPress: () => void;
  type: WaterType;
}

function HomeSegmentButton({
  isActive,
  isDark,
  label,
  onPress,
  type,
}: HomeSegmentButtonProps) {
  const activeColor = type === "salt" ? colors.BRAND_PRIMARY : colors.GREEN_600;
  const inactiveColor = isDark ? colors.GRAY_400 : colors.GRAY_500;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.segmentBtn,
        isActive && [
          styles.segmentBtnActive,
          {
            backgroundColor: isDark ? colors.DARK_SEGMENT_ACTIVE : colors.WHITE,
          },
        ],
      ]}
    >
      <Text
        style={[
          styles.segmentText,
          { color: isActive ? activeColor : inactiveColor },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface MetricTileProps {
  accentColor: string;
  detail: string;
  isDark: boolean;
  label: string;
  value: string;
}

function MetricTile({
  accentColor,
  detail,
  isDark,
  label,
  value,
}: MetricTileProps) {
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const surfaceColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <View
      style={[
        styles.metricTile,
        { backgroundColor: surfaceColor, borderColor },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.metricLabel, { color: mutedTextColor }]}
      >
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        numberOfLines={1}
        style={[styles.metricValue, { color: textColor }]}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.metricDetail, { color: accentColor }]}
      >
        {detail}
      </Text>
    </View>
  );
}

interface HomePanelProps {
  actionLabel?: string;
  children: React.ReactNode;
  compact?: boolean;
  isDark: boolean;
  onPressAction?: () => void;
  title: string;
}

function HomePanel({
  actionLabel,
  children,
  compact = false,
  isDark,
  onPressAction,
  title,
}: HomePanelProps) {
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const surfaceColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <View
      style={[
        styles.panel,
        compact && styles.panelCompact,
        { backgroundColor: surfaceColor, borderColor },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text
          numberOfLines={1}
          style={[styles.panelTitle, { color: textColor }]}
        >
          {title}
        </Text>
        {actionLabel && onPressAction ? (
          <TouchableOpacity activeOpacity={0.72} onPress={onPressAction}>
            <Text style={styles.panelActionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function CompactRecentList({
  isDark,
  items,
  onPressItem,
}: {
  isDark: boolean;
  items: CatchLogListItem[];
  onPressItem: (itemId: number) => void;
}) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;

  if (items.length === 0) {
    return (
      <Text style={[styles.compactEmptyText, { color: mutedTextColor }]}>
        아직 표시할 최근 조과가 없습니다.
      </Text>
    );
  }

  return (
    <View style={styles.compactList}>
      {items.map((item) => (
        <CompactRecentRow
          isDark={isDark}
          item={item}
          key={item.id}
          onPress={() => onPressItem(item.id)}
        />
      ))}
    </View>
  );
}

function CompactRecentRow({
  isDark,
  item,
  onPress,
}: {
  isDark: boolean;
  item: CatchLogListItem;
  onPress: () => void;
}) {
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const pointLabel = getCatchLogPointLabel(item.pointName);
  const sizeLabel = formatCatchSize(item.sizeCm);
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <TouchableOpacity
      activeOpacity={0.76}
      onPress={onPress}
      style={[styles.recentCompactRow, { borderBottomColor: borderColor }]}
    >
      <View style={styles.recentCompactMain}>
        <Text
          numberOfLines={1}
          style={[styles.recentCompactTitle, { color: textColor }]}
        >
          {item.speciesName}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.recentCompactMeta, { color: mutedTextColor }]}
        >
          {formatCatchLogShortDateLabel(item.fishingDate)} · {pointLabel}
        </Text>
      </View>
      <View style={styles.recentCompactSide}>
        <Text style={styles.recentCompactCount}>{item.count}마리</Text>
        {sizeLabel ? (
          <Text
            numberOfLines={1}
            style={[styles.recentCompactSize, { color: mutedTextColor }]}
          >
            {sizeLabel}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function CompactPointList({
  bestLocations,
  isDark,
}: {
  bestLocations: { catchCount: number; name: string }[];
  isDark: boolean;
}) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const textColor = isDark ? colors.WHITE : colors.INK;

  if (bestLocations.length === 0) {
    return (
      <Text style={[styles.compactEmptyText, { color: mutedTextColor }]}>
        포인트 데이터 없음
      </Text>
    );
  }

  return (
    <View style={styles.compactList}>
      {bestLocations.map((location, index) => (
        <View key={location.name} style={styles.pointCompactRow}>
          <Text style={styles.pointCompactRank}>{index + 1}</Text>
          <Text
            numberOfLines={1}
            style={[styles.pointCompactName, { color: textColor }]}
          >
            {location.name}
          </Text>
          <Text style={[styles.pointCompactCount, { color: mutedTextColor }]}>
            {location.catchCount}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CompactTideList({
  data,
  isDark,
}: {
  data: TidePerformanceItem[];
  isDark: boolean;
}) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;

  return (
    <View style={styles.tideCompactList}>
      {data.map((item) => (
        <View key={item.label} style={styles.tideCompactRow}>
          <Text
            numberOfLines={1}
            style={[styles.tideCompactLabel, { color: mutedTextColor }]}
          >
            {item.label}
          </Text>
          <View
            style={[
              styles.tideCompactTrack,
              {
                backgroundColor: isDark
                  ? colors.DARK_SURFACE_MUTED
                  : colors.SURFACE_SOFT,
              },
            ]}
          >
            <View
              style={[
                styles.tideCompactFill,
                {
                  backgroundColor: colors.BRAND_PRIMARY,
                  width: `${item.value}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.tideCompactValue, { color: mutedTextColor }]}>
            {item.catchCount}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TidePerformanceList({
  data,
  insightItems,
  isDark,
}: {
  data: TidePerformanceItem[];
  insightItems: TidePerformanceItem[];
  isDark: boolean;
}) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const insightBackgroundColor = isDark
    ? colors.DARK_SURFACE_MUTED
    : colors.BRAND_PRIMARY_SOFT;

  return (
    <View style={styles.tideBarList}>
      {data.map((item) => (
        <View key={item.label} style={styles.tideBarRow}>
          <Text
            numberOfLines={1}
            style={[styles.tideBarLabel, { color: mutedTextColor }]}
          >
            {item.label}
          </Text>
          <View
            style={[
              styles.tideBarTrack,
              {
                backgroundColor: isDark
                  ? colors.DARK_SURFACE_MUTED
                  : colors.SURFACE_SOFT,
              },
            ]}
          >
            <View
              style={[
                styles.tideBarFill,
                {
                  backgroundColor: colors.BRAND_PRIMARY,
                  width: `${item.value}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.tideBarValue, { color: mutedTextColor }]}>
            {item.catchCount}마리
          </Text>
        </View>
      ))}
      {insightItems.length > 0 ? (
        <View
          style={[
            styles.tideInsightBox,
            { backgroundColor: insightBackgroundColor },
          ]}
        >
          <TideInsightText isDark={isDark} items={insightItems} />
        </View>
      ) : null}
    </View>
  );
}

function TideInsightText({
  isDark,
  items,
}: {
  isDark: boolean;
  items: TidePerformanceItem[];
}) {
  const textColor = isDark ? colors.WHITE : colors.INK;
  const firstItem = items[0] ?? null;
  const secondItem = items[1] ?? null;

  if (!firstItem) {
    return null;
  }

  return (
    <Text style={[styles.tideInsightText, { color: textColor }]}>
      <Text style={styles.tideInsightPrimary}>{firstItem.label}</Text>
      {secondItem ? (
        <>
          {getAndParticle(firstItem.label)}{" "}
          <Text style={styles.tideInsightSecondary}>{secondItem.label}</Text>
        </>
      ) : null}
      에서 조과가 좋았습니다.
    </Text>
  );
}

function ConditionSummary({
  isDark,
  subText,
  value,
}: {
  isDark: boolean;
  subText: string | null;
  value: string;
}) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <View style={styles.conditionSummary}>
      <Text
        numberOfLines={1}
        style={[styles.conditionValue, { color: textColor }]}
      >
        {value}
      </Text>
      <Text
        numberOfLines={2}
        style={[styles.conditionSubText, { color: mutedTextColor }]}
      >
        {subText ?? "조과가 좋은 조건을 기록 중입니다."}
      </Text>
    </View>
  );
}

// REFACTOR: 월별 차트는 상태 측정, SVG 좌표 계산, 축/guide line 렌더링이 모두 묶여 있다.
// 전용 chart 컴포넌트로 분리하면 홈 화면 본문이 더 읽기 쉬워지고 차트 라이브러리 교체 영향도 줄어든다.
function MonthlyBarChart({
  accentColor,
  data,
  isDark,
}: {
  accentColor: string;
  data: MonthlyCatchTrendItem[];
  isDark: boolean;
}) {
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const plotWidth = Math.max(chartWidth - MONTHLY_CHART_Y_AXIS_WIDTH, 0);
  const maxValue = getMonthlyChartMaxValue(data);
  const chartPoints = getMonthlyChartPoints({ data, maxValue, plotWidth });
  const maxPoint = getMonthlyMaxPoint(chartPoints);
  const selectedPoint =
    chartPoints.find((point) => point.label === selectedLabel) ?? maxPoint;
  const barWidth = getMonthlyBarWidth(plotWidth, data.length);
  const baselineY = MONTHLY_CHART_OVERFLOW_TOP + MONTHLY_CHART_HEIGHT;
  const guideColor = isDark ? colors.DARK_BORDER : colors.GRAY_200;
  const emptyBarColor = isDark ? colors.DARK_SURFACE_ELEVATED : colors.GRAY_300;

  function handleLayout(event: LayoutChangeEvent) {
    setChartWidth(event.nativeEvent.layout.width);
  }

  return (
    <View onLayout={handleLayout} style={styles.monthlyChartArea}>
      {plotWidth > 0 ? (
        <>
          <View style={styles.monthlyGraphArea}>
            <MonthlyYAxisLabels isDark={isDark} maxValue={maxValue} />
            <View style={styles.monthlyPlotArea}>
              <Svg height={MONTHLY_CHART_TOTAL_HEIGHT} width={plotWidth}>
                {getMonthlyYAxisValues(maxValue).map((value) => {
                  const y = getMonthlyChartY({ maxValue, value });

                  return (
                    <Line
                      key={`h-${value}`}
                      stroke={guideColor}
                      strokeOpacity={0.85}
                      strokeWidth={StyleSheet.hairlineWidth}
                      x1={MONTHLY_CHART_SIDE_INSET}
                      x2={plotWidth - MONTHLY_CHART_SIDE_INSET}
                      y1={y}
                      y2={y}
                    />
                  );
                })}

                {chartPoints.map((point) => (
                  <Path
                    d={getMonthlyBarPath({
                      baselineY,
                      barWidth,
                      point,
                    })}
                    key={`bar-${point.label}`}
                    fill={point.value > 0 ? accentColor : emptyBarColor}
                    opacity={point.value > 0 ? (point.isMax ? 1 : 0.78) : 0.65}
                    stroke={
                      point.label === selectedPoint?.label
                        ? accentColor
                        : "transparent"
                    }
                    strokeWidth={point.label === selectedPoint?.label ? 2 : 0}
                  />
                ))}

                <Line
                  stroke={guideColor}
                  strokeWidth={StyleSheet.hairlineWidth}
                  x1={MONTHLY_CHART_SIDE_INSET}
                  x2={plotWidth - MONTHLY_CHART_SIDE_INSET}
                  y1={baselineY}
                  y2={baselineY}
                />

                {selectedPoint ? (
                  <MonthlyPointValueLabel
                    accentColor={accentColor}
                    point={selectedPoint}
                    plotWidth={plotWidth}
                  />
                ) : null}
              </Svg>
              <View pointerEvents="box-none" style={styles.monthlyTouchLayer}>
                {chartPoints.map((point, index) => {
                  const touchArea = getMonthlyTouchArea({
                    index,
                    plotWidth,
                    points: chartPoints,
                  });

                  return (
                    <Pressable
                      accessibilityLabel={`${point.label} 조과 ${point.value}마리`}
                      accessibilityRole="button"
                      key={`bar-touch-${point.label}`}
                      onPress={() => setSelectedLabel(point.label)}
                      style={[
                        styles.monthlyBarTouchArea,
                        {
                          left: touchArea.x,
                          width: touchArea.width,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
          <MonthlyAxisLabels data={data} isDark={isDark} />
        </>
      ) : null}
    </View>
  );
}

function MonthlyPointValueLabel({
  accentColor,
  plotWidth,
  point,
}: {
  accentColor: string;
  plotWidth: number;
  point: MonthlyChartPoint;
}) {
  const label = `${point.value}마리`;
  const labelWidth = Math.max(42, label.length * 8 + 14);
  const labelX = clamp(point.x - labelWidth / 2, 0, plotWidth - labelWidth);
  const labelY = Math.max(point.y - MONTHLY_CHART_LABEL_HEIGHT - 8, 0);

  return (
    <>
      <Rect
        fill={accentColor}
        height={MONTHLY_CHART_LABEL_HEIGHT}
        opacity={0.96}
        rx={9}
        width={labelWidth}
        x={labelX}
        y={labelY}
      />
      <SvgText
        fill={colors.WHITE}
        fontSize={10}
        fontWeight="700"
        textAnchor="middle"
        x={labelX + labelWidth / 2}
        y={labelY + 12.5}
      >
        {label}
      </SvgText>
    </>
  );
}

function MonthlyYAxisLabels({
  isDark,
  maxValue,
}: {
  isDark: boolean;
  maxValue: number;
}) {
  const values = getMonthlyYAxisValues(maxValue);

  return (
    <View style={styles.monthYAxis}>
      {values.map((value) => (
        <Text
          key={value}
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.monthYAxisLabel,
            { color: isDark ? colors.GRAY_400 : colors.GRAY_400 },
          ]}
        >
          {value}마리
        </Text>
      ))}
    </View>
  );
}

function MonthlyAxisLabels({
  data,
  isDark,
}: {
  data: MonthlyCatchTrendItem[];
  isDark: boolean;
}) {
  return (
    <View style={styles.monthAxisOuterRow}>
      <View style={styles.monthAxisOffset} />
      <View style={styles.monthAxisRow}>
        {data.map((item) => (
          <View key={item.label} style={styles.monthAxisCell}>
            <Text
              adjustsFontSizeToFit
              allowFontScaling={false}
              minimumFontScale={0.85}
              numberOfLines={1}
              style={[
                styles.monthAxisLabel,
                { color: isDark ? colors.GRAY_400 : colors.GRAY_400 },
              ]}
            >
              {getVisibleMonthAxisLabel(item.label)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function getMonthlyYAxisValues(maxValue: number) {
  const middleValue = Math.floor(maxValue / 2);

  return middleValue > 0 ? [maxValue, middleValue, 0] : [maxValue, 0];
}

function getMonthlyBarWidth(plotWidth: number, itemCount: number) {
  const plotInnerWidth = Math.max(plotWidth - MONTHLY_CHART_SIDE_INSET * 2, 0);
  const slotWidth = plotInnerWidth / Math.max(itemCount, 1);

  return clamp(slotWidth * 0.52, 8, 22);
}

interface MonthlyChartPoint {
  isMax: boolean;
  label: string;
  value: number;
  x: number;
  y: number;
}

function getMonthlyChartPoints({
  data,
  maxValue,
  plotWidth,
}: {
  data: MonthlyCatchTrendItem[];
  maxValue: number;
  plotWidth: number;
}): MonthlyChartPoint[] {
  const maxDataValue = Math.max(...data.map((item) => item.value), 0);
  const maxDataIndex = data.findIndex((item) => item.value === maxDataValue);
  const plotInnerWidth = Math.max(plotWidth - MONTHLY_CHART_SIDE_INSET * 2, 0);

  return data.map((item, index) => {
    const x =
      MONTHLY_CHART_SIDE_INSET +
      (plotInnerWidth * index) / Math.max(data.length - 1, 1);

    return {
      isMax: item.value > 0 && index === maxDataIndex,
      label: item.label,
      value: item.value,
      x,
      y: getMonthlyChartY({ maxValue, value: item.value }),
    };
  });
}

function getMonthlyChartY({
  maxValue,
  value,
}: {
  maxValue: number;
  value: number;
}) {
  return (
    MONTHLY_CHART_OVERFLOW_TOP +
    MONTHLY_CHART_HEIGHT * (1 - Math.min(value, maxValue) / maxValue)
  );
}

function getMonthlyMaxPoint(points: MonthlyChartPoint[]) {
  return points.find((point) => point.isMax) ?? null;
}

function getMonthlyBarPath({
  baselineY,
  barWidth,
  point,
}: {
  baselineY: number;
  barWidth: number;
  point: MonthlyChartPoint;
}) {
  const height = Math.max(baselineY - point.y, point.value > 0 ? 4 : 2);
  const leftX = point.x - barWidth / 2;
  const rightX = point.x + barWidth / 2;
  const topY = point.value > 0 ? point.y : baselineY - 2;
  const radius = Math.min(5, barWidth / 2, height);

  return [
    `M ${leftX} ${baselineY}`,
    `L ${leftX} ${topY + radius}`,
    `Q ${leftX} ${topY} ${leftX + radius} ${topY}`,
    `L ${rightX - radius} ${topY}`,
    `Q ${rightX} ${topY} ${rightX} ${topY + radius}`,
    `L ${rightX} ${baselineY}`,
    "Z",
  ].join(" ");
}

function getMonthlyTouchArea({
  index,
  plotWidth,
  points,
}: {
  index: number;
  plotWidth: number;
  points: MonthlyChartPoint[];
}) {
  const currentPoint = points[index];
  const previousPoint = points[index - 1] ?? null;
  const nextPoint = points[index + 1] ?? null;

  if (!currentPoint) {
    return { width: 0, x: 0 };
  }

  const left = previousPoint ? (previousPoint.x + currentPoint.x) / 2 : 0;
  const right = nextPoint ? (currentPoint.x + nextPoint.x) / 2 : plotWidth;

  return {
    width: Math.max(right - left, 0),
    x: left,
  };
}

function getAndParticle(label: string) {
  const lastCharacter = label.trim().at(-1);

  if (!lastCharacter) {
    return "와";
  }

  const codePoint = lastCharacter.charCodeAt(0);
  const hangulStartCode = 0xac00;
  const hangulEndCode = 0xd7a3;

  if (codePoint < hangulStartCode || codePoint > hangulEndCode) {
    return "와";
  }

  return (codePoint - hangulStartCode) % 28 === 0 ? "와" : "과";
}

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function getVisibleMonthAxisLabel(label: string | undefined) {
  return label ?? "";
}

function getMonthlyChartMaxValue(data: MonthlyCatchTrendItem[]) {
  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 0);

  const predefinedMaxValue = MONTHLY_CHART_NICE_MAX_VALUES.find(
    (value) => value >= maxValue,
  );

  if (predefinedMaxValue) {
    return predefinedMaxValue;
  }

  const scale = 10 ** Math.floor(Math.log10(maxValue));
  const normalizedMaxValue = maxValue / scale;
  const normalizedStep = [1, 1.5, 2, 3, 4, 5, 7.5, 10].find(
    (value) => value >= normalizedMaxValue,
  );

  return Math.ceil((normalizedStep ?? 10) * scale);
}

function HomeEmptyState({
  isDark,
  onPress,
}: {
  isDark: boolean;
  onPress: () => void;
}) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const textColor = isDark ? colors.WHITE : colors.INK;
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconBox,
          {
            backgroundColor: isDark
              ? colors.DARK_SURFACE_MUTED
              : colors.BRAND_PRIMARY_SOFT,
          },
        ]}
      >
        <FishIcon color={colors.BRAND_PRIMARY} height={48} width={48} />
      </View>
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        아직 기록이 없어요
      </Text>
      <Text style={[styles.emptySubtitle, { color: mutedTextColor }]}>
        첫 조과를 기록하고{"\n"}나만의 멋진 통계를 만들어보세요.
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.emptyButton, { backgroundColor: colors.BRAND_PRIMARY }]}
      >
        <Text style={styles.emptyButtonText}>조과 기록하러 가기</Text>
      </TouchableOpacity>
    </View>
  );
}

function HomeLoadingState({ isDark }: { isDark: boolean }) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;

  return (
    <View style={styles.emptyContainer}>
      <ActivityIndicator color={colors.BRAND_PRIMARY} />
      <Text style={[styles.emptySubtitle, { color: mutedTextColor }]}>
        조과 기록을 불러오는 중입니다
      </Text>
    </View>
  );
}

function HomeErrorState({
  isDark,
  message,
}: {
  isDark: boolean;
  message: string;
}) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        기록을 불러오지 못했습니다
      </Text>
      <Text style={[styles.emptySubtitle, { color: mutedTextColor }]}>
        {message}
      </Text>
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 86,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
    zIndex: 40,
  },
  headerTitleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  screenKicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    lineHeight: 13,
  },
  appName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 23,
  },
  headerYearContainer: {
    alignItems: "flex-end",
    position: "relative",
    zIndex: 50,
  },
  headerYearChip: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  headerYearChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  controlPanel: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 6,
    marginBottom: 12,
  },
  inlineRegisterButton: {
    minWidth: 66,
    height: 36,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  inlineRegisterText: {
    color: colors.WHITE,
    fontSize: 13,
    fontWeight: "700",
  },
  segmentTrack: {
    flex: 1,
    flexDirection: "row",
    padding: 3,
    borderRadius: 10,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentBtnActive: {
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
  },
  summaryLine: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLineTextGroup: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  summaryLineTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  summaryLineCaption: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  summaryLineValue: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
    rowGap: 8,
  },
  metricTile: {
    width: "48.8%",
    minHeight: 78,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  metricValue: {
    marginTop: 4,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 24,
  },
  metricDetail: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  panelCompact: {
    flex: 1,
    minWidth: 0,
    marginBottom: 0,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  panelTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 18,
    minWidth: 0,
  },
  panelActionText: {
    color: colors.BRAND_PRIMARY,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "700",
  },
  headerYearPickerMenu: {
    position: "absolute",
    right: 0,
    top: 48,
    minWidth: 104,
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  yearPickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  yearPickerOptionText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  splitPanels: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  compactEmptyText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  compactList: {
    gap: 0,
  },
  recentCompactRow: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingVertical: 7,
  },
  recentCompactMain: {
    flex: 1,
    minWidth: 0,
  },
  recentCompactTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  recentCompactMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
  },
  recentCompactSide: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  recentCompactCount: {
    color: colors.BRAND_PRIMARY,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  recentCompactSize: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 13,
  },
  pointCompactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    minHeight: 27,
  },
  pointCompactRank: {
    color: colors.BRAND_PRIMARY,
    fontSize: 12,
    fontWeight: "800",
    width: 14,
  },
  pointCompactName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    minWidth: 0,
  },
  pointCompactCount: {
    fontSize: 11,
    fontWeight: "700",
  },
  tideCompactList: {
    gap: 7,
  },
  tideCompactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 21,
  },
  tideCompactLabel: {
    fontSize: 11,
    fontWeight: "700",
    width: 32,
  },
  tideCompactTrack: {
    flex: 1,
    height: 8,
    borderRadius: 5,
    overflow: "hidden",
  },
  tideCompactFill: {
    height: "100%",
    borderRadius: 5,
  },
  tideCompactValue: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    width: 22,
  },
  conditionSummary: {
    minHeight: 76,
    justifyContent: "center",
  },
  conditionValue: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  conditionSubText: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  insightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  insightBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  monthlyChartArea: {
    width: "100%",
    height: MONTHLY_CHART_AREA_HEIGHT,
    marginTop: 4,
  },
  monthlyGraphArea: {
    flexDirection: "row",
    width: "100%",
    height: MONTHLY_CHART_TOTAL_HEIGHT,
    position: "relative",
  },
  monthlyPlotArea: {
    flex: 1,
    minWidth: 0,
    height: MONTHLY_CHART_TOTAL_HEIGHT,
    position: "relative",
  },
  monthlyTouchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  monthlyBarTouchArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  monthYAxis: {
    width: MONTHLY_CHART_Y_AXIS_WIDTH,
    height: MONTHLY_CHART_TOTAL_HEIGHT,
    paddingTop: MONTHLY_CHART_OVERFLOW_TOP,
    paddingRight: 6,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  monthYAxisLabel: {
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 12,
  },
  monthAxisOuterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    width: "100%",
  },
  monthAxisOffset: {
    width: MONTHLY_CHART_Y_AXIS_WIDTH,
  },
  monthAxisRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  monthAxisCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  monthAxisLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0,
  },
  tideBarList: {
    gap: 8,
  },
  tideBarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tideBarLabel: {
    width: 38,
    fontSize: 13,
    fontWeight: "600",
  },
  tideBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 5,
    overflow: "hidden",
  },
  tideBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  tideBarValue: {
    width: 42,
    marginLeft: 10,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
  },
  tideInsightBox: {
    alignItems: "center",
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tideInsightText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
  tideInsightPrimary: {
    color: colors.BRAND_PRIMARY,
    fontWeight: "900",
  },
  tideInsightSecondary: {
    color: colors.ORANGE_500,
    fontWeight: "900",
  },
  insightBox: {
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "center",
  },
  insightText: {
    fontSize: 14,
    fontWeight: "500",
  },
  insightHighlightText: {
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 54,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyButton: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  emptyButtonText: {
    color: colors.WHITE,
    fontSize: 16,
    fontWeight: "700",
  },
  homeAdSlot: {
    marginTop: 16,
    marginBottom: 8,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});

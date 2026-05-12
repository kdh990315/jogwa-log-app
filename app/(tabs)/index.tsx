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
import Svg, {
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";

import { logAnalyticsEvent } from "@/api/analytics";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import { colors } from "@/constants";
import { analyticsEvents } from "@/constants/analytics";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMyCatchLogs } from "@/hooks/queries/use-catch-logs";
import type {
  CatchLogEntryView,
  CatchLogListItem,
  WaterType,
} from "@/types/catch-log";
import BestPointSection from "@/components/home/BestPointSection";
import ChartCard from "@/components/home/ChartCard";
import { FishIcon, PlusIcon } from "@/components/home/HomeIcons";
import RecentListSection from "@/components/home/RecentListSection";
import SummarySection from "@/components/home/SummarySection";
import {
  getHomeStats,
  type MonthlyCatchTrendItem,
  type TidePerformanceItem,
} from "@/utils/home-stats";
import { getUserErrorMessage } from "@/utils/user-error-message";

const CURRENT_YEAR = new Date().getFullYear();
const MONTHLY_CHART_SIDE_INSET = 12;
const MONTHLY_CHART_HEIGHT = 114;
const MONTHLY_CHART_OVERFLOW_TOP = 20;
const MONTHLY_CHART_TOTAL_HEIGHT =
  MONTHLY_CHART_HEIGHT + MONTHLY_CHART_OVERFLOW_TOP;
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
  const accentColor =
    homeCategory === "salt" ? colors.BLUE_600 : colors.GREEN_600;
  const backgroundColor = isDark ? colors.DARK_BACKGROUND : colors.GRAY_200;
  const cardBorderColor = isDark ? colors.DARK_BORDER : colors.GRAY_200;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_500;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;
  const {
    data: catchLogItems = [],
    error: catchLogError,
    isLoading: isCatchLogsLoading,
  } = useMyCatchLogs();
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
  const isHomeEmpty =
    !isCatchLogsLoading && !catchLogError && homeStats.recentCatches.length === 0;
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
          <View style={styles.headerRow}>
            <View style={styles.headerTitleContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={yearOptions.length <= 1}
                onPress={() => setIsYearPickerOpen((isOpen) => !isOpen)}
                style={[
                  styles.headerYearChip,
                  {
                    backgroundColor: isDark
                      ? colors.DARK_SURFACE_MUTED
                      : colors.GRAY_300,
                    borderColor: cardBorderColor,
                  },
                ]}
              >
                <Text style={[styles.headerYearChipText, { color: textColor }]}>
                  {selectedYear}년{yearOptions.length > 1 ? " ▾" : ""}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: textColor }]}>
                나의 낚시 요약
              </Text>
              {isYearPickerOpen && yearOptions.length > 1 ? (
                <View
                  style={[
                    styles.headerYearPickerMenu,
                    {
                      backgroundColor: isDark ? colors.DARK_SURFACE_ELEVATED : colors.WHITE,
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
                                ? accentColor
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
            <View
              style={[
                styles.segmentTrack,
                { backgroundColor: isDark ? colors.DARK_BORDER : colors.GRAY_300 },
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
          </View>

          {isCatchLogsLoading ? (
            <HomeLoadingState isDark={isDark} />
          ) : catchLogError ? (
            <HomeErrorState isDark={isDark} message={homeErrorMessage} />
          ) : isHomeEmpty ? (
            <HomeEmptyState isDark={isDark} onPress={handlePressCatchLog} />
          ) : (
            <>
              <SummarySection
                accentColor={accentColor}
                homeCategory={homeCategory}
                isDark={isDark}
                bestConditionLabel={homeStats.bestConditionLabel}
                bestConditionSubText={homeStats.bestConditionSubText}
                bestConditionValue={homeStats.bestConditionValue}
                maxSize={homeStats.maxSize}
                maxSpecies={homeStats.maxSpecies}
                totalCount={homeStats.totalCount}
                totalCountDeltaLabel={homeStats.totalCountDeltaLabel}
                winRate={homeStats.winRate}
                winRateDeltaLabel={homeStats.winRateDeltaLabel}
              />

              <ChartCard isDark={isDark}>
                <View style={styles.chartHeader}>
                  <Text style={[styles.chartTitle, { color: textColor }]}>
                    월별 조과 비교
                  </Text>
                </View>
                <MonthlyBarChart
                  accentColor={accentColor}
                  data={homeStats.monthlyCatchTrend}
                  isDark={isDark}
                />
              </ChartCard>

              {homeCategory === "salt" && homeStats.tidePerformance.length > 0 ? (
                <ChartCard isDark={isDark}>
                  <View style={styles.chartHeader}>
                    <Text
                      style={[styles.chartTitle, { color: textColor }]}
                    >
                      물때별 성과
                    </Text>
                    <View
                      style={[
                        styles.insightBadge,
                        { backgroundColor: colors.BLUE_100 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.insightBadgeText,
                          { color: colors.BLUE_600 },
                        ]}
                      >
                        Insight
                      </Text>
                    </View>
                  </View>

                  <TidePerformanceChart
                    data={homeStats.tidePerformance}
                    isDark={isDark}
                  />

                  <View
                    style={[
                      styles.insightBox,
                      { backgroundColor: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100 },
                    ]}
                  >
                    <TideInsightText
                      accentColor={accentColor}
                      color={mutedTextColor}
                      tidePerformance={homeStats.tidePerformance}
                    />
                  </View>
                </ChartCard>
              ) : null}

              <BestPointSection
                bestLocations={homeStats.bestLocations}
                isDark={isDark}
                onPressMore={() => handlePressCatchList("points")}
              />

              <RecentListSection
                accentColor={accentColor}
                isDark={isDark}
                items={homeStats.recentCatches}
                onPressItem={(itemId) => router.push(`/catch-log/${itemId}`)}
                onPressMore={() => handlePressCatchList("recent")}
              />

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
          style={[styles.fab, { backgroundColor: colors.BLUE_600 }]}
        >
          <PlusIcon />
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

function TideInsightText({
  accentColor,
  color,
  tidePerformance,
}: {
  accentColor: string;
  color: string;
  tidePerformance: TidePerformanceItem[];
}) {
  const topTideLabels = tidePerformance.slice(0, 2).map((item) => item.label);
  const [firstTideLabel, secondTideLabel] = topTideLabels;

  return (
    <Text style={[styles.insightText, { color }]}>
      <Text style={[styles.insightHighlightText, { color: accentColor }]}>
        {firstTideLabel ?? "-"}
      </Text>
      {secondTideLabel ? (
        <>
          과{" "}
          <Text style={[styles.insightHighlightText, { color: accentColor }]}>
            {secondTideLabel}
          </Text>
        </>
      ) : null}
      에 조과가 좋았어요
    </Text>
  );
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
  const activeColor = type === "salt" ? colors.BLUE_600 : colors.GREEN_600;
  const inactiveColor = isDark ? colors.GRAY_400 : colors.GRAY_500;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.segmentBtn,
        isActive && [
          styles.segmentBtnActive,
          { backgroundColor: isDark ? colors.DARK_SEGMENT_ACTIVE : colors.WHITE },
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

  const left = previousPoint
    ? (previousPoint.x + currentPoint.x) / 2
    : 0;
  const right = nextPoint ? (currentPoint.x + nextPoint.x) / 2 : plotWidth;

  return {
    width: Math.max(right - left, 0),
    x: left,
  };
}

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function getVisibleMonthAxisLabel(label: string | undefined) {
  return label ?? "";
}

function TidePerformanceChart({
  data,
  isDark,
}: {
  data: TidePerformanceItem[];
  isDark: boolean;
}) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_500;
  return (
    <View style={styles.tideBarList}>
      {data.map((item) => (
        <View key={item.label} style={styles.tideBarRow}>
          <Text style={[styles.tideBarLabel, { color: mutedTextColor }]}>
            {item.label}
          </Text>
          <View
            style={[
              styles.tideBarTrack,
              { backgroundColor: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100 },
            ]}
          >
            <View
              style={[
                styles.tideBarFill,
                {
                  backgroundColor: colors.BLUE_600,
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
    </View>
  );
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
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_500;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconBox,
          { backgroundColor: isDark ? colors.DARK_BORDER : colors.GRAY_300 },
        ]}
      >
        <FishIcon color={colors.GRAY_400} height={48} width={48} />
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
        style={[styles.emptyButton, { backgroundColor: colors.BLUE_600 }]}
      >
        <Text style={styles.emptyButtonText}>조과 기록하러 가기</Text>
      </TouchableOpacity>
    </View>
  );
}

function HomeLoadingState({ isDark }: { isDark: boolean }) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_500;

  return (
    <View style={styles.emptyContainer}>
      <ActivityIndicator color={colors.BLUE_600} />
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
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_500;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;

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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
    position: "relative",
    zIndex: 30,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginRight: 12,
    position: "relative",
    zIndex: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerYearChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerYearChipText: {
    fontSize: 18,
    fontWeight: "700",
  },
  segmentTrack: {
    flexDirection: "row",
    padding: 2,
    borderRadius: 8,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentBtnActive: {
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    position: "relative",
    zIndex: 20,
  },
  chartTitle: {
    fontSize: 19,
    fontWeight: "700",
  },
  headerYearPickerMenu: {
    position: "absolute",
    left: 0,
    top: 30,
    minWidth: 88,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
    elevation: 8,
  },
  yearPickerOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  yearPickerOptionText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
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
    height: 172,
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
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  monthAxisOuterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
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
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0,
  },
  tideBarList: {
    gap: 12,
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
    height: 16,
    borderRadius: 999,
    overflow: "hidden",
  },
  tideBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  tideBarValue: {
    width: 42,
    marginLeft: 10,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
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
    paddingVertical: 80,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 23,
    fontWeight: "700",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
    elevation: 4,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(37, 99, 235, 0.4)",
    elevation: 6,
  },
});

import React from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/constants";
import type { WaterType } from "@/types/catch-log";

import { AnchorIcon, FishIcon, WaveIcon, WeatherIcon } from "./HomeIcons";
import SummaryCard from "./SummaryCard";

interface SummarySectionProps {
  accentColor: string;
  bestConditionLabel: string;
  bestConditionSubText: string | null;
  bestConditionValue: string;
  homeCategory: WaterType;
  isDark: boolean;
  maxSize: string;
  maxSpecies: string;
  totalCount: number;
  totalCountDeltaLabel: string | null;
  winRate: number;
  winRateDeltaLabel: string | null;
}

export default function SummarySection({
  accentColor,
  bestConditionLabel,
  bestConditionSubText,
  bestConditionValue,
  homeCategory,
  isDark,
  maxSize,
  maxSpecies,
  totalCount,
  totalCountDeltaLabel,
  winRate,
  winRateDeltaLabel,
}: SummarySectionProps) {
  const primarySoftColor = isDark
    ? colors.DARK_SURFACE_MUTED
    : colors.BRAND_PRIMARY_SOFT;
  const blueSoftColor = isDark ? colors.DARK_SURFACE_MUTED : colors.BRAND_PRIMARY_SOFT;
  const greenSoftColor = isDark ? colors.DARK_SURFACE_MUTED : colors.GREEN_100;
  const orangeSoftColor = isDark
    ? colors.DARK_SURFACE_MUTED
    : colors.ORANGE_100;

  return (
    <View style={styles.summaryGrid}>
      <SummaryCard
        accentColor={accentColor}
        icon={<FishIcon color={accentColor} height={14} width={14} />}
        iconBackground={primarySoftColor}
        badgeLabel={totalCountDeltaLabel ?? undefined}
        isDark={isDark}
        label="올해 총 조과"
        value={`${totalCount}마리`}
      />
      <SummaryCard
        icon={<AnchorIcon color={colors.BRAND_PRIMARY} />}
        iconBackground={blueSoftColor}
        accentColor={colors.BRAND_PRIMARY}
        badgeLabel={winRateDeltaLabel ?? undefined}
        isDark={isDark}
        label="성공률"
        value={`${winRate}%`}
      />
      <SummaryCard
        icon={
          <WaveIcon
            color={homeCategory === "salt" ? colors.BRAND_PRIMARY : colors.GREEN_600}
          />
        }
        iconBackground={homeCategory === "salt" ? blueSoftColor : greenSoftColor}
        isDark={isDark}
        label="최대 어종"
        subText={maxSpecies}
        value={maxSize}
      />
      <SummaryCard
        icon={<WeatherIcon color={colors.ORANGE_500} />}
        iconBackground={orangeSoftColor}
        isDark={isDark}
        label={bestConditionLabel}
        subText={bestConditionSubText ?? undefined}
        value={bestConditionValue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 4,
  },
});

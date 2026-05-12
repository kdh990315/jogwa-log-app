import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { formatCatchSize } from "@/constants/catch-log";
import type { CatchLogListItem } from "@/types/catch-log";
import {
  formatCatchLogDateLabel,
  getCatchLogPointLabel,
} from "@/utils/catch-log-display";

export interface RecentCatchCardColors {
  accentText: string;
  badgeBackground: string;
  badgeText: string;
  cardBackground: string;
  cardBorder: string;
  chevron: string;
  metaText: string;
  primaryText: string;
}

interface RecentCatchCardProps {
  catchItem: CatchLogListItem;
  colors: RecentCatchCardColors;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function RecentCatchCard({
  catchItem,
  colors,
  onPress,
  style,
}: RecentCatchCardProps) {
  const sizeLabel = formatCatchSize(catchItem.sizeCm);
  const dateLabel = formatCatchLogDateLabel(catchItem.fishingDate);
  const pointLabel = getCatchLogPointLabel(catchItem.pointName);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.recentItem,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
    >
      <View style={styles.recentLeft}>
        <Text style={[styles.recentSpecies, { color: colors.primaryText }]}>
          {catchItem.speciesName}
          {sizeLabel ? (
            <Text style={[styles.recentSize, { color: colors.accentText }]}>
              {" "}
              {sizeLabel}
            </Text>
          ) : null}
        </Text>
        <View
          style={[
            styles.recentCountBadge,
            { backgroundColor: colors.badgeBackground },
          ]}
        >
          <Text style={[styles.recentCountText, { color: colors.badgeText }]}>
            {catchItem.count}마리
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={[styles.recentMeta, { color: colors.metaText }]}
        >
          {dateLabel} · {pointLabel}
        </Text>
      </View>
      <ChevronRightIcon color={colors.chevron} />
    </TouchableOpacity>
  );
}

interface ChevronRightIconProps {
  color: string;
  height?: number;
  width?: number;
}

function ChevronRightIcon({
  color,
  width = 16,
  height = 16,
}: ChevronRightIconProps) {
  return (
    <Svg
      fill="none"
      height={height}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width={width}
    >
      <Path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  recentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  recentSpecies: {
    fontSize: 15,
    fontWeight: "700",
  },
  recentSize: {
    fontSize: 14,
  },
  recentCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recentCountText: {
    fontSize: 12,
    fontWeight: "600",
  },
  recentMeta: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
});

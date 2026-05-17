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
        <View style={styles.recentTitleRow}>
          <Text
            numberOfLines={1}
            style={[styles.recentSpecies, { color: colors.primaryText }]}
          >
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
            <Text
              numberOfLines={1}
              style={[styles.recentCountText, { color: colors.badgeText }]}
            >
              {catchItem.count}마리
            </Text>
          </View>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  recentLeft: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    marginRight: 10,
  },
  recentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: 6,
  },
  recentSpecies: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  recentSize: {
    fontSize: 12,
  },
  recentCountBadge: {
    flexShrink: 0,
    maxWidth: 66,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  recentCountText: {
    fontSize: 11,
    fontWeight: "600",
  },
  recentMeta: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
  },
});

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import RecentCatchCard from "@/components/catch-log/RecentCatchCard";
import { colors } from "@/constants";
import type { CatchLogListItem } from "@/types/catch-log";

interface RecentListSectionProps {
  accentColor: string;
  isDark: boolean;
  items: CatchLogListItem[];
  onPressItem: (itemId: number) => void;
  onPressMore: () => void;
}

export default function RecentListSection({
  accentColor,
  isDark,
  items,
  onPressItem,
  onPressMore,
}: RecentListSectionProps) {
  const borderColor = isDark ? colors.DARK_BORDER : colors.GRAY_200;
  const cardBackgroundColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_500;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;

  return (
    <View style={styles.recentSection}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: textColor }]}>
          최근 조과
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onPressMore}>
          <Text style={[styles.moreText, { color: colors.GRAY_400 }]}>
            더보기
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentList}>
        {items.map((item) => (
          <RecentCatchCard
            catchItem={item}
            colors={{
              accentText: accentColor,
              badgeBackground: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100,
              badgeText: mutedTextColor,
              cardBackground: cardBackgroundColor,
              cardBorder: borderColor,
              chevron: colors.GRAY_400,
              metaText: colors.GRAY_400,
              primaryText: textColor,
            }}
            key={item.id}
            onPress={() => onPressItem(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  recentSection: {
    marginTop: 12,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 19,
    fontWeight: "700",
  },
  moreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  recentList: {
    gap: 10,
  },
});

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "@/constants";

import ChartCard from "./ChartCard";
import { MapPinIcon } from "./HomeIcons";

interface BestPointSectionProps {
  bestLocations: {
    catchCount: number;
    name: string;
  }[];
  isDark: boolean;
  onPressMore: () => void;
}

export default function BestPointSection({
  bestLocations,
  isDark,
  onPressMore,
}: BestPointSectionProps) {
  const borderColor = isDark ? colors.DARK_BORDER : colors.GRAY_200;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_500;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;

  return (
    <ChartCard isDark={isDark}>
      <View style={styles.chartHeader}>
        <View>
          <View style={styles.titleWithIcon}>
            <Text style={[styles.chartTitle, { color: textColor }]}>
              나의 Best 포인트{" "}
            </Text>
            <MapPinIcon color={colors.RED_500} />
          </View>
          {bestLocations[0] ? (
            <Text style={[styles.chartSubTitle, { color: mutedTextColor }]}>
              {bestLocations[0].name}에서 가장 많이 잡았어요.
            </Text>
          ) : null}
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={onPressMore}>
          <Text style={[styles.moreText, { color: colors.GRAY_400 }]}>
            더보기
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pointList}>
        {bestLocations.map((location, index) => (
          <View key={location.name} style={styles.pointRow}>
            <View style={styles.pointLeft}>
              <Text style={[styles.pointRank, { color: colors.BLUE_600 }]}>
                {index + 1}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.pointName, { color: textColor }]}
              >
                {location.name}
              </Text>
            </View>
            <View
              style={[
                styles.pointCountBadge,
                {
                  backgroundColor: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100,
                  borderColor,
                },
              ]}
            >
              <Text
                style={[styles.pointCountText, { color: mutedTextColor }]}
              >
                {location.catchCount}마리
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
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
  chartSubTitle: {
    marginTop: 4,
    fontSize: 13,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  moreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pointList: {
    gap: 16,
  },
  pointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 12,
  },
  pointRank: {
    width: 20,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
  },
  pointName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  pointCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  pointCountText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

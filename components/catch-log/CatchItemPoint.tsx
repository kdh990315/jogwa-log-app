import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { CatchLogPointGroup } from "@/types/catch-log";
import { formatCatchLogShortDateLabel } from "@/utils/catch-log-display";

export interface CatchItemPointColors {
  accent: string;
  accentSoft: string;
  cardBackground: string;
  cardBorder: string;
  chevron: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
}

interface CatchItemPointProps {
  colors: CatchItemPointColors;
  pointGroup: CatchLogPointGroup;
  onPress: (pointName: string) => void;
}

const CatchItemPoint = ({
  colors,
  pointGroup,
  onPress,
}: CatchItemPointProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(pointGroup.pointName)}
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
        <Ionicons color={colors.accent} name="location-outline" size={20} />
      </View>

      <View style={styles.info}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.textPrimary }]}
        >
          {pointGroup.pointName}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          총 {pointGroup.totalRecords}건 기록 · 주요 어종: {pointGroup.mainSpecies}
        </Text>
      </View>

      <View style={styles.trail}>
        <Text
          numberOfLines={1}
          style={[styles.date, { color: colors.textTertiary }]}
        >
          {formatCatchLogShortDateLabel(pointGroup.lastDate)}
        </Text>
        <Ionicons color={colors.chevron} name="chevron-forward" size={16} />
      </View>
    </TouchableOpacity>
  );
};

export default CatchItemPoint;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  trail: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 4,
    marginLeft: 10,
  },
  date: {
    fontSize: 10,
    fontWeight: "500",
  },
});

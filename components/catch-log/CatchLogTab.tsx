import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants";
import type { WaterType } from "@/types/catch-log";

const WATER_TYPE_OPTIONS = [
  { label: "바다", value: "salt" },
  { label: "민물", value: "fresh" },
] as const;

export interface CatchLogTabColors {
  activeBackground: string;
  activeBorder: string;
  activeText: string;
  background: string;
  inactiveText: string;
}

interface CatchLogTabProps {
  colors: CatchLogTabColors;
  onSelectWaterType: (waterType: WaterType) => void;
  selectedWaterType: WaterType;
}

const CatchLogTab = ({
  colors: tabColors,
  onSelectWaterType,
  selectedWaterType,
}: CatchLogTabProps) => {
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { backgroundColor: tabColors.background }]}
    >
      {WATER_TYPE_OPTIONS.map(({ label, value }) => {
        const isActive = selectedWaterType === value;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={value}
            onPress={() => onSelectWaterType(value)}
            style={[
              styles.tab,
              isActive && [
                styles.activeTab,
                {
                  backgroundColor: tabColors.activeBackground,
                  borderColor: tabColors.activeBorder,
                },
              ],
            ]}
          >
            <Text
              style={[
                styles.text,
                isActive ? styles.activeText : styles.inactiveText,
                {
                  color: isActive
                    ? tabColors.activeText
                    : tabColors.inactiveText,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default CatchLogTab;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.TRANSPARENT,
  },
  activeTab: {
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    lineHeight: 17,
  },
  activeText: {
    fontWeight: "700",
  },
  inactiveText: {
    fontWeight: "500",
  },
});

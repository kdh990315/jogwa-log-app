import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CATCH_LOG_FILTERS } from "@/constants/catch-log";
import type { CatchLogListFilter } from "@/types/catch-log";

export interface CatchLogFilterTabColors {
  activeBackground: string;
  activeText: string;
  background: string;
  border: string;
  inactiveText: string;
}

interface CatchLogFilterTabProps {
  activeFilter: CatchLogListFilter;
  colors: CatchLogFilterTabColors;
  onSelectFilter: (filter: CatchLogListFilter) => void;
}

const CatchLogFilterTab = ({
  activeFilter,
  colors,
  onSelectFilter,
}: CatchLogFilterTabProps) => {
  return (
    <View accessibilityRole="radiogroup" style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {CATCH_LOG_FILTERS.map(({ label, value }) => {
          const isActive = activeFilter === value;

          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
              key={value}
              onPress={() => onSelectFilter(value)}
              style={({ pressed }) => [
                styles.filter,
                {
                  backgroundColor: isActive
                    ? colors.activeBackground
                    : colors.background,
                  borderColor: isActive
                    ? colors.activeBackground
                    : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.text,
                  isActive ? styles.activeText : styles.inactiveText,
                  {
                    color: isActive
                      ? colors.activeText
                      : colors.inactiveText,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CatchLogFilterTab;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filter: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 12,
    lineHeight: 15,
  },
  activeText: {
    fontWeight: "700",
  },
  inactiveText: {
    fontWeight: "500",
  },
});

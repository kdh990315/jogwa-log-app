import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/constants";

interface AdBannerSlotProps {
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  isDark: boolean;
}

export default function AdBannerSlot({
  accessibilityLabel = "광고 배너 영역",
  containerStyle,
  isDark,
}: AdBannerSlotProps) {
  const backgroundColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const labelColor = isDark ? colors.GRAY_400 : colors.GRAY_500;
  const placeholderColor = isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
        },
        containerStyle,
      ]}
    >
      <Text style={[styles.label, { color: labelColor }]}>AD</Text>
      <View
        style={[
          styles.placeholder,
          {
            backgroundColor: placeholderColor,
            borderColor,
          },
        ]}
      >
        <Text style={[styles.placeholderText, { color: labelColor }]}>
          광고 배너
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 76,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 8,
  },
  placeholder: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

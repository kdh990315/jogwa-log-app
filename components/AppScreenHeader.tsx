import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

interface AppScreenHeaderProps {
  eyebrow: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
}

export default function AppScreenHeader({
  eyebrow,
  iconName,
  title,
}: AppScreenHeaderProps) {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const textColor = isDark ? colors.WHITE : colors.INK;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const iconBackgroundColor = isDark
    ? colors.DARK_SURFACE_ELEVATED
    : colors.BRAND_PRIMARY_SOFT;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 12,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: iconBackgroundColor,
              borderColor,
            },
          ]}
        >
          <Ionicons color={colors.BRAND_PRIMARY} name={iconName} size={21} />
        </View>

        <View style={styles.titleTextGroup}>
          <Text style={[styles.eyebrow, { color: colors.BRAND_PRIMARY }]}>
            {eyebrow}
          </Text>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  iconBadge: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  titleTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 1,
  },
});

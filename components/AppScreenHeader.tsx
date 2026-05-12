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
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;
  const borderColor = isDark ? colors.DARK_BORDER : colors.GRAY_300;
  const iconBackgroundColor = isDark
    ? colors.DARK_SURFACE_ELEVATED
    : colors.BLUE_100;

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
          <Ionicons color={colors.BLUE_600} name={iconName} size={26} />
        </View>

        <View style={styles.titleTextGroup}>
          <Text style={[styles.eyebrow, { color: colors.BLUE_600 }]}>
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
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  iconBadge: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  titleTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2,
  },
});

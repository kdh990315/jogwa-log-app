import { Stack } from "expo-router";
import React from "react";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function DictionaryLayout() {
  const { isDark } = useAppTheme();
  const backgroundColor = isDark ? colors.DARK_BACKGROUND : colors.SURFACE_SOFT;
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor,
        },
        headerTintColor: textColor,
        contentStyle: {
          backgroundColor,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "도감" }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "도감 상세" }}
      />
    </Stack>
  );
}

import { Stack } from "expo-router";
import React from "react";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function SpeciesAnalysisLayout() {
  const { isDark } = useAppTheme();
  const backgroundColor = isDark ? colors.DARK_BACKGROUND : colors.GRAY_200;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor },
        headerShown: false,
        headerStyle: { backgroundColor },
        headerTintColor: textColor,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "ai 어종 분석",
        }}
      />
    </Stack>
  );
}

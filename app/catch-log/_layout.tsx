import { Stack } from "expo-router";
import React from "react";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

const CatchLogLayout = () => {
  const { isDark } = useAppTheme();
  const backgroundColor = isDark ? colors.DARK_BACKGROUND_DEEP : colors.WHITE;
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor },
        headerShadowVisible: false,
        headerStyle: { backgroundColor },
        headerTintColor: textColor,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerBackButtonDisplayMode: "minimal",
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 15,
            fontWeight: "700",
          },
          title: "조과 기록",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerBackButtonDisplayMode: "minimal",
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 15,
            fontWeight: "700",
          },
          title: "조과 상세",
        }}
      />
    </Stack>
  );
};

export default CatchLogLayout;

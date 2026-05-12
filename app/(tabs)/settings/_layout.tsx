import { Stack } from "expo-router";
import React from "react";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function SettingsLayout() {
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
        options={{ title: "설정" }}
      />
      <Stack.Screen
        name="profile"
        options={{ title: "내 정보 수정" }}
      />
      <Stack.Screen
        name="notices/index"
        options={{ title: "공지사항" }}
      />
      <Stack.Screen
        name="notices/[id]"
        options={{ title: "공지사항 상세" }}
      />
    </Stack>
  );
}

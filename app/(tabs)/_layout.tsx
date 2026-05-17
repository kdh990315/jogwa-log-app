import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import React from "react";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function TabLayout() {
  const { isDark } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.BRAND_PRIMARY,
        tabBarInactiveTintColor: colors.GRAY_400,
        tabBarStyle: {
          backgroundColor: isDark ? colors.DARK_BACKGROUND : colors.WHITE,
          borderTopColor: isDark ? colors.DARK_BORDER : colors.GRAY_300,
        },
        sceneStyle: {
          backgroundColor: isDark ? colors.DARK_BACKGROUND : colors.GRAY_200,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "home" : "home-outline"}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="species-analysis"
        options={{
          title: "어종분석",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "fish" : "fish-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dictionary"
        options={{
          title: "도감",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "book" : "book-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-map"
        options={{
          title: "나의 포인트",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "map" : "map-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "설정",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "settings" : "settings-outline"}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";

import { getFishSpeciesList } from "@/api/fish-species";
import { hasSupabaseAuthConfig } from "@/api/supabase";
import { fishSpeciesKeys } from "@/constants/query-keys";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/hooks/use-auth";
import AuthProvider from "@/providers/auth-provider";
import QueryProvider from "@/providers/query-provider";
import AppThemeProvider from "@/providers/theme-provider";

void SplashScreen.preventAutoHideAsync();

// REFACTOR: 루트 레이아웃이 provider 조립, splash 제어, auth redirect, reference prefetch까지 모두 책임진다.
// bootstrap concern이 더 늘기 전에 초기화 훅/부트스트랩 컴포넌트로 나누는 편이 라우팅 변경에 안전하다.
export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppThemeProvider>
          <ThemedRoot />
        </AppThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

function ThemedRoot() {
  const { colorScheme } = useAppTheme();
  const navigationTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const statusBarStyle = colorScheme === "dark" ? "light" : "dark";

  return (
    <ThemeProvider value={navigationTheme}>
      <ReferenceDataPrefetcher />
      <SplashScreenController />
      <AuthNavigationController />
      <RootNavigator />
      <StatusBar style={statusBarStyle} />
    </ThemeProvider>
  );
}

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/index" options={{ headerShown: false }} />
      <Stack.Screen name="policies/index" options={{ headerShown: false }} />
      <Stack.Screen name="policies/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="catch-register/index" options={{ headerShown: false }} />
      <Stack.Screen name="catch-log" options={{ headerShown: false }} />
    </Stack>
  );
}

function SplashScreenController() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return null;
}

function AuthNavigationController() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthRoute = segments[0] === "auth";
    const isPublicPolicyRoute = segments[0] === "policies";

    if (!isAuthenticated && !isAuthRoute && !isPublicPolicyRoute) {
      router.replace("/auth");
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

function ReferenceDataPrefetcher() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasSupabaseAuthConfig) {
      return;
    }

    void queryClient
      .prefetchQuery({
        queryFn: getFishSpeciesList,
        queryKey: fishSpeciesKeys.list(),
        staleTime: 1000 * 60 * 60 * 24,
      })
      .catch((error: unknown) => {
        console.warn("Failed to prefetch fish species.", error);
      });
  }, [queryClient]);

  return null;
}

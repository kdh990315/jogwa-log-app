import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform, useColorScheme } from "react-native";

export type AppColorScheme = "light" | "dark";
export type ThemeMode = "auto" | AppColorScheme;

interface AppThemeContextValue {
  colorScheme: AppColorScheme;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  themeMode: ThemeMode;
}

interface AppThemeProviderProps {
  children: ReactNode;
}

const THEME_MODE_STORAGE_KEY = "jogwa-log.theme-mode";
const DARK_MODE_START_HOUR = 18;
const DARK_MODE_END_HOUR = 6;

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export default function AppThemeProvider({ children }: AppThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    let isMounted = true;

    void getStoredThemeMode().then((storedThemeMode) => {
      if (isMounted && storedThemeMode) {
        setThemeModeState(storedThemeMode);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 1000 * 60);

    return () => clearInterval(timer);
  }, []);

  const colorScheme = resolveColorScheme({
    currentHour,
    systemColorScheme: systemColorScheme === "dark" ? "dark" : "light",
    themeMode,
  });

  const value = useMemo<AppThemeContextValue>(
    () => ({
      colorScheme,
      isDark: colorScheme === "dark",
      setThemeMode: async (mode) => {
        setThemeModeState(mode);
        await setStoredThemeMode(mode);
      },
      themeMode,
    }),
    [colorScheme, themeMode],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider.");
  }

  return context;
}

function resolveColorScheme({
  currentHour,
  systemColorScheme,
  themeMode,
}: {
  currentHour: number;
  systemColorScheme: AppColorScheme;
  themeMode: ThemeMode;
}): AppColorScheme {
  if (themeMode !== "auto") {
    return themeMode;
  }

  if (Number.isInteger(currentHour) && currentHour >= 0 && currentHour <= 23) {
    return currentHour >= DARK_MODE_START_HOUR || currentHour < DARK_MODE_END_HOUR
      ? "dark"
      : "light";
  }

  return systemColorScheme;
}

async function getStoredThemeMode(): Promise<ThemeMode | null> {
  const value = await getStoredValue(THEME_MODE_STORAGE_KEY);

  if (value === "auto" || value === "light" || value === "dark") {
    return value;
  }

  return null;
}

function getStoredValue(key: string) {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

function setStoredThemeMode(mode: ThemeMode) {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    return;
  }

  return SecureStore.setItemAsync(THEME_MODE_STORAGE_KEY, mode);
}

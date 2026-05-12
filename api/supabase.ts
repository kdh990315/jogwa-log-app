import "react-native-url-polyfill/auto";

import {
  createClient,
  processLock,
  type AuthSession,
  type SupportedStorage,
} from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const SUPABASE_URL_FALLBACK = "https://example.supabase.co";
const SUPABASE_KEY_FALLBACK = "sb_publishable_placeholder";
const isWeb = Platform.OS === "web";

const secureStoreAdapter: SupportedStorage = {
  getItem(key) {
    if (isWeb) {
      if (typeof window === "undefined" || !window.localStorage) {
        return null;
      }

      return window.localStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },
  removeItem(key) {
    if (isWeb) {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }

      window.localStorage.removeItem(key);
      return;
    }

    return SecureStore.deleteItemAsync(key);
  },
  setItem(key, value) {
    if (isWeb) {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }

      window.localStorage.setItem(key, value);
      return;
    }

    return SecureStore.setItemAsync(key, value);
  },
};

export const hasSupabaseAuthConfig = Boolean(
  supabaseUrl && supabasePublishableKey,
);

export const supabaseConfigErrorMessage =
  "Supabase 환경 변수가 없습니다. EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 설정해 주세요.";

export function ensureSupabaseAuthConfig() {
  if (!hasSupabaseAuthConfig) {
    throw new Error(supabaseConfigErrorMessage);
  }
}

export const supabase = createClient(
  supabaseUrl ?? SUPABASE_URL_FALLBACK,
  supabasePublishableKey ?? SUPABASE_KEY_FALLBACK,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      lock: processLock,
      persistSession: true,
      storage: secureStoreAdapter,
    },
  },
);

export type Session = AuthSession;

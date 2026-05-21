import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import {
  ensureSupabaseAuthConfig,
  supabase,
  type Session,
} from "@/api/supabase";

WebBrowser.maybeCompleteAuthSession();

const AUTH_REDIRECT_PATH = "auth";
const AUTH_REDIRECT_SCHEME = "jogwalog";

export type OAuthSignInProvider = "google" | "kakao";
export type KakaoSignInResult = "cancelled" | "success";
export type OAuthSignInResult = "cancelled" | "success";

interface AuthFunctionErrorResponse {
  message?: unknown;
}

export async function signInWithOAuthProvider(
  provider: OAuthSignInProvider,
): Promise<OAuthSignInResult> {
  ensureSupabaseAuthConfig();

  const redirectTo = createAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error(`${getProviderLabel(provider)} 로그인 URL을 생성하지 못했습니다.`);
  }

  const authUrl = assertHttpUrl(
    data.url,
    `${getProviderLabel(provider)} 로그인 URL이 올바르지 않습니다.`,
  );
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo, {
    showInRecents: true,
  });

  if (result.type !== "success") {
    return "cancelled";
  }

  await completeSupabaseSessionFromUrl(result.url, redirectTo);

  return "success";
}

export async function signInWithKakao(): Promise<KakaoSignInResult> {
  return signInWithOAuthProvider("kakao");
}

export async function signOut() {
  ensureSupabaseAuthConfig();

  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    throw error;
  }
}

export async function deleteAccount() {
  ensureSupabaseAuthConfig();

  const { error } = await supabase.functions.invoke("delete-account", {
    body: {},
  });

  if (error) {
    await throwAuthFunctionError(
      error,
      "회원 탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  try {
    await signOut();
  } catch {
    // Auth admin deletion does not automatically clear the local session.
    // If the remote session is already gone, auth state will still be reset
    // by the root auth guard after the function succeeds.
  }
}

export async function restoreAccount() {
  ensureSupabaseAuthConfig();

  const { error } = await supabase.functions.invoke("restore-account", {
    body: {},
  });

  if (error) {
    await throwAuthFunctionError(
      error,
      "계정 복구 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }
}

export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

async function throwAuthFunctionError(
  error: unknown,
  fallbackMessage: string,
): Promise<never> {
  const context = getFunctionErrorContext(error);

  if (context) {
    const response = context.clone();
    let body: AuthFunctionErrorResponse | null = null;

    try {
      body = (await response.json()) as AuthFunctionErrorResponse;
    } catch {
      body = null;
    }

    if (typeof body?.message === "string" && body.message.trim().length > 0) {
      throw new Error(body.message.trim());
    }
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(fallbackMessage);
}

function getFunctionErrorContext(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const context = (error as { context?: unknown }).context;

  if (typeof Response !== "undefined" && context instanceof Response) {
    return context;
  }

  return null;
}

function createAuthRedirectUrl() {
  if (Platform.OS !== "web") {
    return `${AUTH_REDIRECT_SCHEME}://${AUTH_REDIRECT_PATH}`;
  }

  return Linking.createURL(AUTH_REDIRECT_PATH);
}

function assertHttpUrl(url: string, errorMessage: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") {
      return parsedUrl.toString();
    }
  } catch {
    // Fall through to the shared error below.
  }

  throw new Error(errorMessage);
}

async function completeSupabaseSessionFromUrl(url: string, redirectTo: string) {
  const callbackParams = getAuthCallbackParams(url);
  const callbackError =
    callbackParams.get("error_description") ??
    callbackParams.get("error") ??
    callbackParams.get("error_code");

  if (callbackError) {
    throw new Error(callbackError);
  }

  const authCode = callbackParams.get("code");

  if (authCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      throw error;
    }

    return;
  }

  const session = extractImplicitSessionFromParams(callbackParams);

  if (!session) {
    throw new Error(
      `로그인 세션 정보를 받아오지 못했습니다. Supabase Redirect URLs에 ${redirectTo}가 등록되어 있는지 확인해 주세요.`,
    );
  }

  const { error } = await supabase.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });

  if (error) {
    throw error;
  }
}

function getAuthCallbackParams(url: string) {
  const parsedUrl = new URL(url);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  const searchParams = parsedUrl.searchParams;

  searchParams.forEach((value, key) => {
    if (!hashParams.has(key)) {
      hashParams.set(key, value);
    }
  });

  return hashParams;
}

function extractImplicitSessionFromParams(params: URLSearchParams) {
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

function getProviderLabel(provider: OAuthSignInProvider) {
  if (provider === "google") {
    return "구글";
  }

  return "카카오";
}

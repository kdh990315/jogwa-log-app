import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  signInWithOAuthProvider,
  type OAuthSignInProvider,
} from "@/api/auth";
import mainLogoSource from "@/assets/images/main-logo.png";
import { authMessages, colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/hooks/use-auth";
import { getUserErrorMessage } from "@/utils/user-error-message";

type AuthProvider = "kakao" | "google" | "apple";

// REFACTOR: provider별 버튼 UI, pending 처리, SVG 아이콘이 한 파일에 붙어 있어 로그인 수단이 늘수록 조건 분기가 커진다.
// provider config 배열과 공용 AuthButton 컴포넌트로 옮기면 OAuth 추가나 문구 변경이 훨씬 단순해진다.
export default function AuthScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const backgroundColor = isDark ? colors.DARK_BACKGROUND : colors.WHITE;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_400;
  const googleBackgroundColor = isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100;
  const googleTextColor = isDark ? colors.GRAY_400 : colors.GRAY_600;
  const appleBackgroundColor = isDark ? colors.WHITE : colors.BLACK;
  const applePressedTextColor = isDark ? colors.BLACK : colors.WHITE;
  const { isLoading: isSessionLoading } = useAuth();
  const [loadingProvider, setLoadingProvider] =
    React.useState<AuthProvider | null>(null);
  const isAuthActionLoading = Boolean(loadingProvider) || isSessionLoading;

  async function handleLogin(provider: AuthProvider) {
    if (provider === "kakao" || provider === "google") {
      try {
        setLoadingProvider(provider);

        const result = await signInWithOAuthProvider(
          provider satisfies OAuthSignInProvider,
        );

        if (result === "cancelled") {
          return;
        }
      } catch (error) {
        const providerLabel = getProviderLabel(provider);
        const message = getUserErrorMessage(
          error,
          `${providerLabel} 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.`,
        );

        Alert.alert("로그인 실패", message);
      } finally {
        setLoadingProvider(null);
      }

      return;
    }

    const providerLabel = getProviderLabel(provider);

    Alert.alert(
      authMessages.pendingTitle,
      authMessages.pendingLogin(providerLabel)
    );
  }

  function handlePressTerms() {
    router.push("/policies/terms-of-service");
  }

  function handlePressPrivacy() {
    router.push("/policies/privacy-policy");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.headerContainer}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={mainLogoSource}
          style={styles.logoImage}
        />
        <Text style={[styles.titleText, { color: textColor }]}>조과로그</Text>
        <Text style={[styles.subtitleText, { color: mutedTextColor }]}>
          나만의 낚시 여정
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isAuthActionLoading}
          onPress={() => {
            void handleLogin("kakao");
          }}
          style={[
            styles.loginButton,
            {
              backgroundColor: colors.KAKAO_YELLOW,
              opacity: isAuthActionLoading ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.buttonIconWrapper}>
            <KakaoIcon color={colors.KAKAO_TEXT} />
          </View>
          <Text style={[styles.buttonText, { color: colors.KAKAO_TEXT }]}>
            {loadingProvider === "kakao" ? "카카오 로그인 중..." : "카카오 로그인"}
          </Text>
          {loadingProvider === "kakao" ? (
            <ActivityIndicator
              color={colors.KAKAO_TEXT}
              size="small"
              style={styles.buttonLoadingIndicator}
            />
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isAuthActionLoading}
          onPress={() => {
            void handleLogin("google");
          }}
          style={[
            styles.loginButton,
            {
              backgroundColor: googleBackgroundColor,
              opacity: isAuthActionLoading ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.buttonIconWrapper}>
            <GoogleIcon />
          </View>
          <Text style={[styles.buttonText, { color: googleTextColor }]}>
            {loadingProvider === "google" ? "구글 로그인 중..." : "구글 로그인"}
          </Text>
          {loadingProvider === "google" ? (
            <ActivityIndicator
              color={googleTextColor}
              size="small"
              style={styles.buttonLoadingIndicator}
            />
          ) : null}
        </TouchableOpacity>

        {Platform.OS === "ios" ? (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isAuthActionLoading}
            onPress={() => {
              void handleLogin("apple");
            }}
            style={[
              styles.loginButton,
              {
                backgroundColor: appleBackgroundColor,
                opacity: isAuthActionLoading ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.buttonIconWrapper}>
              <AppleIcon color={applePressedTextColor} />
            </View>
            <Text style={[styles.buttonText, { color: applePressedTextColor }]}>
              Apple로 로그인
            </Text>
          </TouchableOpacity>
        ) : null}

        <Text style={[styles.termsText, { color: mutedTextColor }]}>
          계속 진행하면 조과로그의{"\n"}
          <Text onPress={handlePressTerms} style={styles.underlineText}>
            이용약관
          </Text>
          {" 및 "}
          <Text onPress={handlePressPrivacy} style={styles.underlineText}>
            개인정보처리방침
          </Text>
          에 동의하게 됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function getProviderLabel(provider: AuthProvider) {
  if (provider === "apple") {
    return "Apple";
  }

  if (provider === "google") {
    return "구글";
  }

  return "카카오";
}

// REFACTOR: 아이콘 SVG들이 auth 화면 내부에만 묶여 있어 다른 화면/컴포넌트에서 재사용하기 어렵다.
// auth 전용 icons 파일이나 shared icon 폴더로 이동하면 시각 자산 관리가 쉬워진다.
interface IconColorProps {
  color: string;
}

function KakaoIcon({ color }: IconColorProps) {
  return (
    <Svg fill={color} height={20} viewBox="0 0 24 24" width={20}>
      <Path d="M12 3c-5.523 0-10 3.5-10 7.818 0 2.8 1.83 5.226 4.672 6.551-.157.54-1.004 3.568-1.028 3.708-.033.197.142.274.28.188.106-.066 3.328-2.22 4.62-3.111.472.067.957.102 1.456.102 5.523 0 10-3.5 10-7.818C22 6.5 17.523 3 12 3z" />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg height={20} viewBox="0 0 24 24" width={20}>
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill={colors.GOOGLE_BLUE}
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill={colors.GOOGLE_GREEN}
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill={colors.GOOGLE_YELLOW}
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill={colors.GOOGLE_RED}
      />
    </Svg>
  );
}

function AppleIcon({ color }: IconColorProps) {
  return (
    <Svg fill={color} height={20} viewBox="0 0 24 24" width={20}>
      <Path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.126 3.805 3.07 1.52-.057 2.115-.968 3.96-.968 1.815 0 2.35.968 3.96.94 1.64-.027 2.66-1.482 3.633-2.958 1.127-1.64 1.591-3.228 1.62-3.315-.038-.016-3.136-1.203-3.174-4.814-.031-3.014 2.46-4.462 2.576-4.542-1.428-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.588 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 72,
  },
  logoImage: {
    width: 220,
    height: 170,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitleText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 48,
    gap: 12,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonLoadingIndicator: {
    position: "absolute",
    right: 20,
  },
  buttonIconWrapper: {
    position: "absolute",
    left: 20,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  termsText: {
    marginTop: 20,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },
  underlineText: {
    textDecorationLine: "underline",
  },
});

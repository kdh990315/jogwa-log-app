import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomCTAButton from "@/components/CustomCTAButton";
import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMyProfile } from "@/hooks/queries/use-my-profile";
import { useRestoreAccount } from "@/hooks/queries/use-restore-account";
import { useSignOut } from "@/hooks/queries/use-sign-out";
import { getUserErrorMessage } from "@/utils/user-error-message";

export default function AccountDeletionScreen() {
  const { isDark } = useAppTheme();
  const profileQuery = useMyProfile();
  const restoreAccountMutation = useRestoreAccount();
  const signOutMutation = useSignOut();
  const isPending =
    restoreAccountMutation.isPending || signOutMutation.isPending;
  const backgroundColor = isDark ? colors.DARK_BACKGROUND : colors.SURFACE_SOFT;
  const surfaceColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const titleColor = isDark ? colors.WHITE : colors.INK;
  const textColor = isDark ? colors.GRAY_300 : colors.BODY_TEXT;
  const mutedTextColor = isDark ? colors.DARK_MUTED_TEXT : colors.MUTED_TEXT;
  const scheduledHardDeleteText = formatKoreanDateTime(
    profileQuery.data?.scheduledHardDeleteAt ?? null,
  );

  async function handleRestoreAccount() {
    if (isPending) {
      return;
    }

    try {
      await restoreAccountMutation.mutateAsync();
      router.replace("/");
    } catch (error) {
      const message = getUserErrorMessage(
        error,
        "계정 복구 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );

      Alert.alert("복구 실패", message);
    }
  }

  async function handleSignOut() {
    if (isPending) {
      return;
    }

    try {
      await signOutMutation.mutateAsync();
      router.replace("/auth");
    } catch (error) {
      const message = getUserErrorMessage(
        error,
        "로그아웃 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );

      Alert.alert("로그아웃 실패", message);
    }
  }

  if (profileQuery.isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator color={colors.BRAND_PRIMARY} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (profileQuery.isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.container}>
          <View
            style={[
              styles.panel,
              {
                backgroundColor: surfaceColor,
                borderColor,
              },
            ]}
          >
            <Text style={[styles.title, { color: titleColor }]}>
              계정 상태를 확인하지 못했습니다
            </Text>
            <Text style={[styles.description, { color: textColor }]}>
              잠시 후 다시 로그인해 주세요.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isPending}
              onPress={() => {
                void handleSignOut();
              }}
              style={[styles.retrySignOutButton, { borderColor }]}
            >
              <Text style={[styles.retrySignOutText, { color: titleColor }]}>
                로그인 화면으로 돌아가기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container}>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: surfaceColor,
              borderColor,
            },
          ]}
        >
          <Text style={[styles.eyebrow, { color: mutedTextColor }]}>
            ACCOUNT DELETION
          </Text>
          <Text style={[styles.title, { color: titleColor }]}>
            계정 탈퇴가 신청되었습니다
          </Text>
          <Text style={[styles.description, { color: textColor }]}>
            계정은 현재 비활성화되어 있으며, 복구 기간 안에는 조과 기록과
            사진이 보관됩니다.
          </Text>

          <View style={[styles.infoBox, { borderColor }]}>
            <Text style={[styles.infoLabel, { color: mutedTextColor }]}>
              영구 삭제 예정
            </Text>
            <Text style={[styles.infoValue, { color: titleColor }]}>
              {scheduledHardDeleteText}
            </Text>
          </View>

          <CustomCTAButton
            backgroundColor={colors.BRAND_PRIMARY}
            disabled={isPending}
            label={
              restoreAccountMutation.isPending
                ? "계정 복구 중..."
                : "탈퇴 취소하고 계정 복구"
            }
            onPress={() => {
              void handleRestoreAccount();
            }}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isPending}
            onPress={() => {
              void handleSignOut();
            }}
            style={[styles.signOutButton, { opacity: isPending ? 0.5 : 1 }]}
          >
            <Text style={[styles.signOutText, { color: mutedTextColor }]}>
              로그인 화면으로 돌아가기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function formatKoreanDateTime(value: string | null) {
  if (!value) {
    return "확인 중";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "확인 중";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).format(date);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContent: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  panel: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 22,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 29,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  infoBox: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
    marginTop: 22,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  signOutButton: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 10,
  },
  retrySignOutButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    paddingVertical: 13,
  },
  retrySignOutText: {
    fontSize: 14,
    fontWeight: "700",
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

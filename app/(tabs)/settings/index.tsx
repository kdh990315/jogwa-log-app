import { useRouter } from "expo-router";
import React, { type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import AppScreenHeader from "@/components/AppScreenHeader";
import { colors } from "@/constants";
import { useAppTheme, type ThemeMode } from "@/hooks/use-app-theme";
import { useDeleteAccount } from "@/hooks/queries/use-delete-account";
import { useSignOut } from "@/hooks/queries/use-sign-out";
import { getUserErrorMessage } from "@/utils/user-error-message";

const APP_VERSION = "1.0.0";
const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSexQf4Mtne8w5iEjDjW-06VGYFV1cdGLUDX8Q_8gT6kLvRCfQ/viewform?usp=dialog";

interface SettingsListItemProps {
  title: string;
  isDark: boolean;
  isDisabled?: boolean;
  isDestructive?: boolean;
  onPress?: () => void;
  rightElement?: ReactNode;
  subtitle?: string;
}

interface ChevronRightIconProps {
  width?: number;
  height?: number;
  color?: string;
}

// REFACTOR: `isDarkMode`를 이 화면 로컬 state로 관리하면 앱 전체 테마와 쉽게 어긋난다.
// 사용자 테마 선호는 provider/storage 계층으로 올리고, 화면은 읽기/토글만 담당하도록 바꾸는 편이 맞다.
export default function SettingsScreen() {
  const router = useRouter();
  const deleteAccountMutation = useDeleteAccount();
  const signOutMutation = useSignOut();
  const { colorScheme, isDark, setThemeMode, themeMode } = useAppTheme();
  const isDeletingAccount = deleteAccountMutation.isPending;
  const isSigningOut = signOutMutation.isPending;
  const isAccountActionPending = isDeletingAccount || isSigningOut;
  const isAutomaticTheme = themeMode === "auto";
  const isDarkMode = colorScheme === "dark";
  const backgroundColor = isDark ? colors.DARK_BACKGROUND : colors.SURFACE_SOFT;
  const cardColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const dividerColor = isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100;
  const headerTextColor = colors.GRAY_400;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_400;
  const switchInactiveColor = isDark ? colors.DARK_BORDER : colors.GRAY_300;
  const chevronColor = isDark ? colors.DARK_MUTED_TEXT : colors.GRAY_300;

  function handleOpenFeedbackForm() {
    Alert.alert(
      "문의 및 건의하기",
      "Google 설문지로 이동할까요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "확인",
          onPress: async () => {
            try {
              await Linking.openURL(FEEDBACK_FORM_URL);
            } catch {
              Alert.alert(
                "이동 실패",
                "설문지를 열 수 없습니다. 잠시 후 다시 시도해 주세요.",
              );
            }
          },
        },
      ],
    );
  }

  function handleLogout() {
    if (isAccountActionPending) {
      return;
    }

    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
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
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    if (isAccountActionPending) {
      return;
    }

    async function confirmDeleteAccount() {
      try {
        await deleteAccountMutation.mutateAsync();
        router.replace("/auth");
      } catch (error) {
        const message = getUserErrorMessage(
          error,
          "회원 탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        );

        Alert.alert("회원 탈퇴 실패", message);
      }
    }

    function handleFinalDeleteAccountConfirm() {
      Alert.alert(
        "정말 탈퇴할까요?",
        "회원 탈퇴를 진행하면 계정과 개인 조과 데이터를 복구할 수 없습니다.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "탈퇴하기",
            style: "destructive",
            onPress: confirmDeleteAccount,
          },
        ],
      );
    }

    Alert.alert(
      "회원 탈퇴",
      "탈퇴하면 계정, 조과 기록, 조과 사진, AI 판별 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: handleFinalDeleteAccountConfirm,
        },
      ],
    );
  }

  function handleToggleAutomaticTheme(isEnabled: boolean) {
    void setThemeMode(isEnabled ? "auto" : colorScheme);
  }

  function handleToggleDarkMode(isEnabled: boolean) {
    const nextThemeMode: ThemeMode = isEnabled ? "dark" : "light";

    void setThemeMode(nextThemeMode);
  }

  // REFACTOR: 설정 섹션이 모두 수작업 JSX라 항목이 늘수록 Divider/props 중복과 누락이 생기기 쉽다.
  // typed config 배열로 선언하고 map 렌더링하면 항목 추가와 권한/배지/disabled 확장이 쉬워진다.
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={[styles.safeArea, { backgroundColor }]}
    >
      <AppScreenHeader
        eyebrow="APP CONTROL"
        iconName="settings-outline"
        title="설정"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={[styles.container, { backgroundColor }]}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: headerTextColor }]}>
            계정
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardColor,
                borderColor,
              },
            ]}
          >
            <SettingsListItem
              isDark={isDark}
              onPress={() => router.push("/settings/profile")}
              title="내 정보 수정"
            />
            <Divider color={dividerColor} />
            <SettingsListItem
              isDark={isDark}
              isDisabled={isAccountActionPending}
              onPress={handleLogout}
              rightElement={
                isSigningOut ? (
                  <ActivityIndicator color={chevronColor} size="small" />
                ) : undefined
              }
              subtitle="현재 기기에서 로그아웃합니다."
              title="로그아웃"
            />
            <Divider color={dividerColor} />
            <SettingsListItem
              isDark={isDark}
              isDisabled={isAccountActionPending}
              isDestructive
              onPress={handleDeleteAccount}
              rightElement={
                isDeletingAccount ? (
                  <ActivityIndicator color={colors.RED_500} size="small" />
                ) : undefined
              }
              subtitle="계정과 개인 조과 데이터를 영구 삭제합니다."
              title="회원 탈퇴"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: headerTextColor }]}>
            앱 설정
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardColor,
                borderColor,
              },
            ]}
          >
            <SettingsListItem
              isDark={isDark}
              rightElement={
                <Switch
                  ios_backgroundColor={switchInactiveColor}
                  onValueChange={handleToggleAutomaticTheme}
                  thumbColor={colors.WHITE}
                  trackColor={{
                    false: switchInactiveColor,
                    true: colors.BRAND_PRIMARY,
                  }}
                  value={isAutomaticTheme}
                />
              }
              subtitle="18:00~06:00에는 자동으로 다크모드를 적용합니다."
              title="자동 테마"
            />
            <Divider color={dividerColor} />
            <SettingsListItem
              isDark={isDark}
              rightElement={
                <Switch
                  disabled={isAutomaticTheme}
                  ios_backgroundColor={switchInactiveColor}
                  onValueChange={handleToggleDarkMode}
                  thumbColor={colors.WHITE}
                  trackColor={{
                    false: switchInactiveColor,
                    true: colors.BRAND_PRIMARY,
                  }}
                  value={isDarkMode}
                />
              }
              subtitle={
                isAutomaticTheme
                  ? "자동 테마가 켜져 있어 현재 시간 기준으로 적용됩니다."
                  : "직접 선택한 테마가 앱 전체에 적용됩니다."
              }
              title="다크 모드"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: headerTextColor }]}>
            안내
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardColor,
                borderColor,
              },
            ]}
          >
            <SettingsListItem
              isDark={isDark}
              onPress={() => router.push("/settings/notices")}
              title="공지사항"
            />
            <Divider color={dividerColor} />
            <SettingsListItem
              isDark={isDark}
              onPress={handleOpenFeedbackForm}
              title="문의 및 건의하기"
            />
            <Divider color={dividerColor} />
            <SettingsListItem
              isDark={isDark}
              onPress={() => router.push("/policies")}
              title="이용약관 및 정책"
            />
            <Divider color={dividerColor} />
            <SettingsListItem
              isDark={isDark}
              rightElement={
                <Text style={[styles.versionText, { color: mutedTextColor }]}>
                  {APP_VERSION}
                </Text>
              }
              title="앱 버전"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsListItem({
  title,
  isDark,
  isDisabled = false,
  isDestructive = false,
  onPress,
  rightElement,
  subtitle,
}: SettingsListItemProps) {
  const itemBackgroundColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const itemTextColor = isDark ? colors.WHITE : colors.INK;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_400;
  const chevronColor = isDark ? colors.DARK_MUTED_TEXT : colors.GRAY_300;
  const content = (
    <>
      <View style={styles.listItemTextContainer}>
        <Text
          style={[
            styles.listItemTitle,
            {
              color: isDestructive ? colors.RED_500 : itemTextColor,
            },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.listItemSubtitle, { color: mutedTextColor }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.rightElementContainer}>
        {rightElement ??
          (onPress ? <ChevronRightIcon color={chevronColor} /> : null)}
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.listItem, { backgroundColor: itemBackgroundColor }]}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.listItem,
        { backgroundColor: itemBackgroundColor, opacity: isDisabled ? 0.6 : 1 },
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

function ChevronRightIcon({
  width = 16,
  height = 16,
  color = colors.GRAY_300,
}: ChevronRightIconProps) {
  return (
    <Svg
      fill="none"
      height={height}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width={width}
    >
      <Path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    gap: 18,
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  section: {
    width: "100%",
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
    marginLeft: 4,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  listItem: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  listItemTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  listItemSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  rightElementContainer: {
    marginLeft: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

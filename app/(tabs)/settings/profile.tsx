import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";

import CustomButton from "@/components/CustomButton";
import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  useMyProfile,
  useUpdateMyProfile,
} from "@/hooks/queries/use-my-profile";
import type { MyProfile } from "@/types/profile";
import { getUserErrorMessage } from "@/utils/user-error-message";

interface ProfileFormValues {
  nickname: string;
}

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const profileQuery = useMyProfile();
  const updateProfileMutation = useUpdateMyProfile();
  const palette = getPalette(isDark);
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      nickname: "",
    },
  });
  const nicknameValue = form.watch("nickname");
  const isSaving = updateProfileMutation.isPending;
  const errorMessage = getUserErrorMessage(
    profileQuery.error,
    "프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        nickname: profileQuery.data.nickname ?? "",
      });
    }
  }, [form, profileQuery.data]);

  async function handleSubmit(values: ProfileFormValues) {
    try {
      const nickname = values.nickname.trim();
      const updatedProfile = await updateProfileMutation.mutateAsync({
        nickname: nickname.length > 0 ? nickname : null,
      });

      form.reset({
        nickname: updatedProfile.nickname ?? "",
      });
      Alert.alert("저장 완료", "내 정보가 수정되었습니다.");
    } catch (error) {
      const message = getUserErrorMessage(
        error,
        "내 정보 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );

      Alert.alert("저장 실패", message);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: palette.background,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity
          accessibilityLabel="뒤로가기"
          onPress={() => router.back()}
          style={[styles.headerIconButton, { backgroundColor: palette.surface }]}
        >
          <Ionicons color={palette.text} name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          내 정보 수정
        </Text>
        <View style={styles.headerIconPlaceholder} />
      </View>

      {profileQuery.isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator color={colors.BRAND_PRIMARY} />
          <Text style={[styles.stateDescription, { color: palette.mutedText }]}>
            프로필 정보를 불러오는 중입니다
          </Text>
        </View>
      ) : profileQuery.error ? (
        <View style={styles.stateContainer}>
          <Text style={[styles.stateTitle, { color: palette.text }]}>
            내 정보를 불러오지 못했습니다
          </Text>
          <Text style={[styles.stateDescription, { color: palette.mutedText }]}>
            {errorMessage}
          </Text>
          <CustomButton
            backgroundColor={colors.BRAND_PRIMARY}
            label="다시 시도"
            onPress={() => {
              void profileQuery.refetch();
            }}
            pressedBackgroundColor={colors.BRAND_PRIMARY_ACTIVE}
            textColor={colors.WHITE}
          />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <ProfileSummaryCard
              isDark={isDark}
              profile={profileQuery.data}
            />

            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: palette.mutedText }]}>
                닉네임
              </Text>
              <Controller
                control={form.control}
                rules={{
                  maxLength: {
                    message: "닉네임은 20자 이하로 입력해 주세요.",
                    value: 20,
                  },
                }}
                name="nickname"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSaving}
                    maxLength={20}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="닉네임을 입력해 주세요"
                    placeholderTextColor={palette.subText}
                    returnKeyType="done"
                    style={[
                      styles.input,
                      {
                        backgroundColor: palette.inputBackground,
                        borderColor: palette.border,
                        color: palette.text,
                        opacity: isSaving ? 0.6 : 1,
                      },
                    ]}
                    value={value}
                  />
                )}
              />
              <View style={styles.inputMetaRow}>
                <Text style={[styles.errorText, { color: colors.RED_500 }]}>
                  {form.formState.errors.nickname?.message ?? " "}
                </Text>
                <Text style={[styles.counterText, { color: palette.subText }]}>
                  {nicknameValue.length}/20
                </Text>
              </View>
            </View>

            <CustomButton
              backgroundColor={colors.BRAND_PRIMARY}
              disabled={isSaving || !form.formState.isDirty}
              label={isSaving ? "저장 중..." : "저장"}
              onPress={form.handleSubmit(handleSubmit)}
              pressedBackgroundColor={colors.BRAND_PRIMARY_ACTIVE}
              style={{
                opacity: isSaving || !form.formState.isDirty ? 0.55 : 1,
              }}
              textColor={colors.WHITE}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function ProfileSummaryCard({
  isDark,
  profile,
}: {
  isDark: boolean;
  profile: MyProfile | undefined;
}) {
  const palette = getPalette(isDark);
  const providerLabel = getProviderLabel(profile?.signupProvider ?? null);
  const emailLabel = profile?.email ?? "이메일 정보 없음";
  const nicknameLabel = profile?.nickname?.trim() || "닉네임 없음";

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: palette.avatarBackground }]}>
        <Ionicons color={colors.BRAND_PRIMARY} name="person" size={28} />
      </View>
      <View style={styles.summaryTextGroup}>
        <Text style={[styles.nicknameText, { color: palette.text }]}>
          {nicknameLabel}
        </Text>
        <Text style={[styles.emailText, { color: palette.mutedText }]}>
          {emailLabel}
        </Text>
      </View>
      <View style={[styles.providerBadge, { backgroundColor: palette.badge }]}>
        <Text style={[styles.providerText, { color: palette.badgeText }]}>
          {providerLabel}
        </Text>
      </View>
    </View>
  );
}

function getProviderLabel(provider: MyProfile["signupProvider"]) {
  if (provider === "kakao") {
    return "카카오";
  }

  if (provider === "google") {
    return "구글";
  }

  if (provider === "apple") {
    return "Apple";
  }

  return "로그인";
}

function getPalette(isDark: boolean) {
  return {
    avatarBackground: isDark ? colors.DARK_SURFACE_ELEVATED : colors.BRAND_PRIMARY_SOFT,
    background: isDark ? colors.DARK_BACKGROUND : colors.SURFACE_SOFT,
    badge: isDark ? colors.DARK_SURFACE_ELEVATED : colors.BRAND_PRIMARY_SOFT,
    badgeText: colors.BRAND_PRIMARY_ACTIVE,
    border: isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT,
    card: isDark ? colors.DARK_SURFACE : colors.WHITE,
    inputBackground: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100,
    mutedText: isDark ? colors.GRAY_400 : colors.MUTED_TEXT,
    subText: isDark ? colors.DARK_MUTED_TEXT : colors.GRAY_400,
    surface: isDark ? colors.DARK_SURFACE_MUTED : colors.WHITE,
    text: isDark ? colors.WHITE : colors.INK,
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  headerIconButton: {
    alignItems: "center",
    borderRadius: 10,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  headerIconPlaceholder: {
    height: 34,
    width: 34,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  stateContainer: {
    alignItems: "center",
    flex: 1,
    gap: 14,
    justifyContent: "center",
    padding: 24,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  stateDescription: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  summaryCard: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  summaryTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  nicknameText: {
    fontSize: 15,
    fontWeight: "800",
  },
  emailText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
  },
  providerBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  providerText: {
    fontSize: 11,
    fontWeight: "800",
  },
  formCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: "600",
    minHeight: 42,
    paddingHorizontal: 12,
  },
  inputMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
  },
  counterText: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 12,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppStateView from "@/components/AppStateView";
import { colors } from "@/constants";
import { useNotice } from "@/hooks/queries/use-notices";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getUserErrorMessage } from "@/utils/user-error-message";

export default function NoticeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<Record<string, string | string[]>>();
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const noticeId = normalizeParam(id) ?? null;
  const {
    data: notice,
    error,
    isLoading,
    refetch,
  } = useNotice(noticeId);
  const errorMessage = error
    ? getUserErrorMessage(
        error,
        "공지사항을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      )
    : null;

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
          style={styles.headerIconButton}
        >
          <Ionicons color={palette.text} name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          공지사항
        </Text>
        <View style={styles.headerIconPlaceholder} />
      </View>

      {isLoading ? (
        <AppStateView
          description="공지사항을 불러오는 중입니다"
          isLoading
          mutedTextColor={palette.mutedText}
          style={styles.stateView}
          textColor={palette.text}
        />
      ) : notice ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={{ backgroundColor: palette.background }}
        >
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
              },
            ]}
          >
            <View style={styles.noticeMetaRow}>
              <View style={[styles.statusBadge, { backgroundColor: palette.badge }]}>
                <Text style={[styles.statusText, { color: palette.badgeText }]}>
                  {notice.statusLabel}
                </Text>
              </View>
              <Text style={[styles.dateText, { color: palette.mutedText }]}>
                {notice.publishedAt}
              </Text>
            </View>

            <Text style={[styles.noticeTitle, { color: palette.text }]}>
              {notice.title}
            </Text>

            <View style={styles.noticeBody}>
              {notice.body.map((paragraph) => (
                <Text
                  key={paragraph}
                  style={[styles.noticeParagraph, { color: palette.bodyText }]}
                >
                  {paragraph}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : errorMessage ? (
        <AppStateView
          description={errorMessage}
          mutedTextColor={palette.mutedText}
          style={styles.stateView}
          textColor={palette.text}
          title="공지사항을 불러오지 못했어요"
        >
          <TouchableOpacity
            onPress={() => {
              void refetch();
            }}
            style={[styles.stateButton, { backgroundColor: palette.card }]}
          >
            <Text style={[styles.stateButtonText, { color: palette.text }]}>
              다시 시도
            </Text>
          </TouchableOpacity>
        </AppStateView>
      ) : (
        <AppStateView
          description="목록에서 다시 선택해 주세요."
          mutedTextColor={palette.mutedText}
          style={styles.stateView}
          textColor={palette.text}
          title="공지사항을 찾을 수 없습니다"
        />
      )}
    </SafeAreaView>
  );
}

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getPalette(isDark: boolean) {
  return {
    background: isDark ? colors.DARK_BACKGROUND : colors.SURFACE_SOFT,
    badge: isDark ? colors.DARK_SURFACE_ELEVATED : colors.BRAND_PRIMARY_SOFT,
    badgeText: colors.BRAND_PRIMARY_ACTIVE,
    bodyText: isDark ? colors.GRAY_300 : colors.GRAY_500,
    border: isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT,
    card: isDark ? colors.DARK_SURFACE : colors.WHITE,
    mutedText: isDark ? colors.DARK_MUTED_TEXT : colors.GRAY_400,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  stateView: {
    flex: 1,
  },
  stateButton: {
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stateButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  noticeCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  noticeMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  dateText: {
    fontSize: 11,
    fontWeight: "700",
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  noticeBody: {
    gap: 9,
    marginTop: 14,
  },
  noticeParagraph: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
  },
});

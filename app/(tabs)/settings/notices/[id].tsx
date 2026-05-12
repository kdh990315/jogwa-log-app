import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants";
import { getSettingsNoticeById } from "@/constants/settings-notices";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function NoticeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const notice = typeof id === "string" ? getSettingsNoticeById(id) : undefined;

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

      {notice ? (
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
      ) : (
        <View style={styles.stateContainer}>
          <Text style={[styles.stateTitle, { color: palette.text }]}>
            공지사항을 찾을 수 없습니다
          </Text>
          <Text style={[styles.stateDescription, { color: palette.mutedText }]}>
            목록에서 다시 선택해 주세요.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function getPalette(isDark: boolean) {
  return {
    background: isDark ? colors.DARK_BACKGROUND : colors.GRAY_200,
    badge: isDark ? colors.DARK_SURFACE_ELEVATED : colors.BLUE_100,
    badgeText: isDark ? colors.BLUE_300 : colors.BLUE_700,
    bodyText: isDark ? colors.GRAY_300 : colors.GRAY_500,
    border: isDark ? colors.DARK_BORDER : colors.GRAY_300,
    card: isDark ? colors.DARK_SURFACE : colors.WHITE,
    mutedText: isDark ? colors.DARK_MUTED_TEXT : colors.GRAY_400,
    text: isDark ? colors.WHITE : colors.GRAY_600,
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
    paddingVertical: 12,
  },
  headerIconButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerIconPlaceholder: {
    height: 40,
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  noticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  noticeMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  dateText: {
    fontSize: 13,
    fontWeight: "700",
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28,
  },
  noticeBody: {
    gap: 12,
    marginTop: 18,
  },
  noticeParagraph: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 23,
  },
  stateContainer: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    justifyContent: "center",
    padding: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stateDescription: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    textAlign: "center",
  },
});

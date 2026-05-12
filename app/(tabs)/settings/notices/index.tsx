import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants";
import { settingsNotices } from "@/constants/settings-notices";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { SettingsNotice } from "@/constants/settings-notices";

export default function NoticesScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);

  function handlePressNotice(noticeId: string) {
    router.push(`/settings/notices/${noticeId}`);
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
          style={styles.headerIconButton}
        >
          <Ionicons color={palette.text} name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          공지사항
        </Text>
        <View style={styles.headerIconPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: palette.background }}
      >
        <View
          style={[
            styles.listCard,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
            },
          ]}
        >
          {settingsNotices.map((notice, index) => (
            <React.Fragment key={notice.id}>
              {index > 0 ? <View style={[styles.divider, { backgroundColor: palette.divider }]} /> : null}
              <NoticeListItem
                notice={notice}
                onPress={() => handlePressNotice(notice.id)}
                palette={palette}
              />
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NoticeListItem({
  notice,
  onPress,
  palette,
}: {
  notice: SettingsNotice;
  onPress: () => void;
  palette: ReturnType<typeof getPalette>;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.noticeItem}
    >
      <View style={styles.noticeTextGroup}>
        <Text style={[styles.noticeTitle, { color: palette.text }]}>
          {notice.title}
        </Text>
        <Text style={[styles.noticeDate, { color: palette.mutedText }]}>
          {notice.publishedAt}
        </Text>
      </View>
      <Ionicons color={palette.chevron} name="chevron-forward" size={20} />
    </TouchableOpacity>
  );
}

function getPalette(isDark: boolean) {
  return {
    background: isDark ? colors.DARK_BACKGROUND : colors.GRAY_200,
    border: isDark ? colors.DARK_BORDER : colors.GRAY_300,
    card: isDark ? colors.DARK_SURFACE : colors.WHITE,
    chevron: isDark ? colors.DARK_MUTED_TEXT : colors.GRAY_300,
    divider: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100,
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
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  noticeItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noticeTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  noticeDate: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants";
import { settingsPolicies } from "@/constants/settings-policies";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { SettingsPolicy } from "@/constants/settings-policies";

export default function PoliciesScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);

  function handlePressPolicy(policyId: string) {
    router.push(`/policies/${policyId}`);
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
    >
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
          이용약관 및 정책
        </Text>
        <View style={styles.headerIconPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: palette.background }}
      >
        <View style={styles.introGroup}>
          <Text style={[styles.introTitle, { color: palette.text }]}>
            어장관리 정책 센터
          </Text>
          <Text style={[styles.introDescription, { color: palette.mutedText }]}>
            위치, 사진, AI 판별, 계정 삭제처럼 사용자 데이터와 관련된 기준을
            한곳에서 확인할 수 있습니다.
          </Text>
        </View>

        <View
          style={[
            styles.listCard,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
            },
          ]}
        >
          {settingsPolicies.map((policy, index) => (
            <React.Fragment key={policy.id}>
              {index > 0 ? (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: palette.divider },
                  ]}
                />
              ) : null}
              <PolicyListItem
                onPress={() => handlePressPolicy(policy.id)}
                palette={palette}
                policy={policy}
              />
            </React.Fragment>
          ))}
        </View>

        <Text style={[styles.footnote, { color: palette.mutedText }]}>
          정책 문구는 MVP 기준 초안이며, 정식 출시 전 실제 연동 서비스와 앱
          심사 요구사항에 맞춰 최종 검토가 필요합니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PolicyListItem({
  onPress,
  palette,
  policy,
}: {
  onPress: () => void;
  palette: ReturnType<typeof getPalette>;
  policy: SettingsPolicy;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.policyItem}
    >
      <View style={styles.policyTextGroup}>
        <View style={styles.policyTitleRow}>
          <Text style={[styles.policyTitle, { color: palette.text }]}>
            {policy.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: palette.badge }]}>
            <Text style={[styles.statusText, { color: palette.badgeText }]}>
              {policy.statusLabel}
            </Text>
          </View>
        </View>
        <Text style={[styles.policySummary, { color: palette.mutedText }]}>
          {policy.summary}
        </Text>
      </View>
      <Ionicons color={palette.chevron} name="chevron-forward" size={20} />
    </TouchableOpacity>
  );
}

function getPalette(isDark: boolean) {
  return {
    background: isDark ? colors.DARK_BACKGROUND : colors.SURFACE_SOFT,
    badge: isDark ? colors.DARK_SURFACE_ELEVATED : colors.BRAND_PRIMARY_SOFT,
    badgeText: colors.BRAND_PRIMARY_ACTIVE,
    border: isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT,
    card: isDark ? colors.DARK_SURFACE : colors.WHITE,
    chevron: isDark ? colors.DARK_MUTED_TEXT : colors.GRAY_300,
    divider: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100,
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
  introGroup: {
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 25,
  },
  introDescription: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 5,
  },
  listCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  policyItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  policyTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  policyTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
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
  policySummary: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  footnote: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
    marginTop: 12,
  },
});

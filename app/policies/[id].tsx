import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { getSettingsPolicyById } from "@/constants/settings-policies";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function PolicyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const policy = typeof id === "string" ? getSettingsPolicyById(id) : undefined;

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
          정책 상세
        </Text>
        <View style={styles.headerIconPlaceholder} />
      </View>

      {policy ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={{ backgroundColor: palette.background }}
        >
          <View
            style={[
              styles.policyCard,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
              },
            ]}
          >
            <View style={styles.policyMetaRow}>
              <View style={[styles.statusBadge, { backgroundColor: palette.badge }]}>
                <Text style={[styles.statusText, { color: palette.badgeText }]}>
                  {policy.statusLabel}
                </Text>
              </View>
              <Text style={[styles.dateText, { color: palette.mutedText }]}>
                {policy.lastUpdated}
              </Text>
            </View>

            <Text style={[styles.policyTitle, { color: palette.text }]}>
              {policy.title}
            </Text>
            <Text style={[styles.policySummary, { color: palette.mutedText }]}>
              {policy.summary}
            </Text>

            <View style={styles.policyBody}>
              {policy.sections.map((section) => (
                <View key={section.heading} style={styles.sectionGroup}>
                  <Text style={[styles.sectionHeading, { color: palette.text }]}>
                    {section.heading}
                  </Text>
                  {section.body.map((paragraph) => (
                    <Text
                      key={paragraph}
                      style={[styles.policyParagraph, { color: palette.bodyText }]}
                    >
                      {paragraph}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.stateContainer}>
          <Text style={[styles.stateTitle, { color: palette.text }]}>
            정책을 찾을 수 없습니다
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
  policyCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  policyMetaRow: {
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
  policyTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  policySummary: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 6,
  },
  policyBody: {
    gap: 14,
    marginTop: 16,
  },
  sectionGroup: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  policyParagraph: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
  },
  stateContainer: {
    alignItems: "center",
    flex: 1,
    gap: 8,
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
    fontWeight: "500",
    lineHeight: 17,
    textAlign: "center",
  },
});

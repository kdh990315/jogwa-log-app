import { colors } from "@/constants";
import { StyleSheet, Text, View } from "react-native";

interface SummaryCardProps {
  label: string;
  value: string;
  isDark: boolean;
  icon: React.ReactNode;
  iconBackground: string;
  accentColor?: string;
  badgeLabel?: string;
  subText?: string;
}

export default function SummaryCard({
  label,
  value,
  isDark,
  icon,
  iconBackground,
  accentColor,
  badgeLabel,
  subText,
}: SummaryCardProps) {
  const cardBackgroundColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const subTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardLabel, { color: mutedTextColor }]}>
          {label}
        </Text>
        <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
          {icon}
        </View>
      </View>
      <Text style={[styles.cardValue, { color: textColor }]}>{value}</Text>
      {badgeLabel && accentColor ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: iconBackground,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: accentColor }]}>
            {badgeLabel}
          </Text>
        </View>
      ) : null}
      {subText ? (
        <Text style={[styles.cardSubText, { color: subTextColor }]}>
          {subText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    width: "48.7%",
    minHeight: 128,
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 23,
  },
  cardSubText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

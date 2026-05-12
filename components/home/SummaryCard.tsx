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
  const borderColor = isDark ? colors.DARK_BORDER : colors.GRAY_200;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_500;
  const subTextColor = colors.GRAY_400;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;

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
    width: "48.5%",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    elevation: 1,
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
    fontWeight: "500",
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  cardSubText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

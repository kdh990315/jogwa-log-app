import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { CatchLogDetailItem } from "@/types/catch-log";
import {
  formatCatchLogDateLabel,
  formatCatchSize,
} from "@/utils/catch-log-display";

interface CatchDetailHeroCardProps {
  catchLog: CatchLogDetailItem;
}

const CatchDetailHeroCard = ({ catchLog }: CatchDetailHeroCardProps) => {
  const { isDark } = useAppTheme();
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const cardColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const primaryColor = colors.BRAND_PRIMARY;
  const softPrimaryColor = isDark
    ? colors.DARK_SURFACE_MUTED
    : colors.BRAND_PRIMARY_SOFT;
  const subTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const surfaceColor = isDark ? colors.DARK_SURFACE_MUTED : colors.SURFACE_SOFT;
  const textColor = isDark ? colors.WHITE : colors.INK;

  const dateLabel = formatCatchLogDateLabel(catchLog.fishingDate);
  const sizeLabel = formatCatchSize(catchLog.sizeCm);
  const waterTypeLabel = catchLog.type === "salt" ? "바다" : "민물";

  return (
    <View style={[styles.heroCard, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroCopy}>
          <View
            style={[
              styles.waterTypePill,
              { backgroundColor: softPrimaryColor },
            ]}
          >
            <Text style={[styles.waterTypeText, { color: primaryColor }]}>
              {waterTypeLabel} 조과
            </Text>
          </View>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            numberOfLines={2}
            style={[
              styles.speciesTitle,
              { color: catchLog.isKkwang ? subTextColor : textColor },
            ]}
          >
            {catchLog.isKkwang ? "꽝" : catchLog.speciesName}
          </Text>
          <Text style={[styles.dateText, { color: subTextColor }]}>
            {dateLabel}
          </Text>
        </View>
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: catchLog.isKkwang
                ? surfaceColor
                : colors.BRAND_PRIMARY,
            },
          ]}
        >
          <Text
            style={[
              styles.countBadgeText,
              { color: catchLog.isKkwang ? subTextColor : colors.WHITE },
            ]}
          >
            {catchLog.isKkwang ? "0마리" : `${catchLog.count}마리`}
          </Text>
        </View>
      </View>

      {!catchLog.isKkwang && sizeLabel ? (
        <View style={[styles.heroMetricRow, { borderTopColor: borderColor }]}>
          <Ionicons color={primaryColor} name="resize-outline" size={18} />
          <Text style={[styles.heroMetricText, { color: textColor }]}>
            최대 길이 {sizeLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  heroTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  waterTypePill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  waterTypeText: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  speciesTitle: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 24,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    marginTop: 2,
  },
  countBadge: {
    alignItems: "center",
    borderRadius: 9,
    flexShrink: 0,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 58,
    paddingHorizontal: 10,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  heroMetricRow: {
    alignItems: "center",
    borderTopColor: colors.HAIRLINE_SOFT,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
  },
  heroMetricText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
});

export default CatchDetailHeroCard;

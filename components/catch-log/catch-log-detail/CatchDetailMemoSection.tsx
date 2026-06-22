import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

interface CatchDetailMemoSectionProps {
  memo: string | null;
}

const CatchDetailMemoSection = ({ memo }: CatchDetailMemoSectionProps) => {
  const { isDark } = useAppTheme();
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const cardColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const surfaceColor = isDark ? colors.DARK_SURFACE_MUTED : colors.SURFACE_SOFT;
  const textColor = isDark ? colors.WHITE : colors.INK;
  const memoLabel = memo?.trim() || "메모가 없습니다.";

  return (
    <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.sectionHeader}>
        <View
          style={[styles.sectionIcon, { backgroundColor: surfaceColor }]}
        >
          <Ionicons
            color={colors.BRAND_PRIMARY}
            name="document-text-outline"
            size={17}
          />
        </View>
        <Text
          numberOfLines={1}
          style={[styles.sectionTitle, { color: textColor }]}
        >
          조과 메모
        </Text>
      </View>
      <View style={[styles.memoBox, { backgroundColor: surfaceColor }]}>
        <Text style={[styles.memoText, { color: mutedTextColor }]}>
          {memoLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  sectionIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
  },
  memoBox: {
    borderRadius: 12,
    minHeight: 72,
    padding: 12,
  },
  memoText: {
    fontSize: 12,
    lineHeight: 19,
  },
});

export default CatchDetailMemoSection;

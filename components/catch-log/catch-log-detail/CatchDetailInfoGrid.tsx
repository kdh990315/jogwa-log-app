import Ionicons from "@expo/vector-icons/Ionicons";
import type React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { CatchLogDetailItem } from "@/types/catch-log";
import { getCatchLogPointLabel } from "@/utils/catch-log-display";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface CatchDetailInfoGridProps {
  catchLog: CatchLogDetailItem;
}

interface DetailInfoItemProps {
  iconName: IoniconName;
  isDark: boolean;
  label: string;
  value: string;
}

const DetailInfoItem = ({
  iconName,
  isDark,
  label,
  value,
}: DetailInfoItemProps) => {
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const surfaceColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <View
      style={[styles.infoItem, { backgroundColor: surfaceColor, borderColor }]}
    >
      <View
        style={[
          styles.infoIcon,
          {
            backgroundColor: isDark
              ? colors.DARK_SURFACE_MUTED
              : colors.BRAND_PRIMARY_SOFT,
          },
        ]}
      >
        <Ionicons color={colors.BRAND_PRIMARY} name={iconName} size={17} />
      </View>
      <Text style={[styles.infoLabel, { color: mutedTextColor }]}>{label}</Text>
      <Text
        minimumFontScale={0.88}
        numberOfLines={2}
        style={[styles.infoValue, { color: textColor }]}
      >
        {value}
      </Text>
    </View>
  );
};

const CatchDetailInfoGrid = ({ catchLog }: CatchDetailInfoGridProps) => {
  const { isDark } = useAppTheme();
  const pointLabel = getCatchLogPointLabel(catchLog.pointName);
  const tideLabel =
    catchLog.tide?.trim() ||
    (catchLog.type === "fresh" ? "해당없음" : "물때 미입력");
  const weatherLabel = catchLog.weather?.trim() || "날씨 미입력";

  return (
    <View style={styles.infoGrid}>
      <DetailInfoItem
        iconName="water-outline"
        isDark={isDark}
        label="물때"
        value={tideLabel}
      />
      <DetailInfoItem
        iconName="partly-sunny-outline"
        isDark={isDark}
        label="날씨"
        value={weatherLabel}
      />
      <DetailInfoItem
        iconName="location-outline"
        isDark={isDark}
        label="포인트"
        value={pointLabel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  infoGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  infoItem: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 78,
    padding: 10,
  },
  infoIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 24,
    justifyContent: "center",
    marginBottom: 7,
    width: 24,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 13,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
});

export default CatchDetailInfoGrid;

import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import CatchLocationMap from "@/components/map/CatchLocationMap";
import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

interface CatchDetailLocationSectionProps {
  latitude: number | null;
  longitude: number | null;
}

const CatchDetailLocationSection = ({
  latitude,
  longitude,
}: CatchDetailLocationSectionProps) => {
  const { isDark } = useAppTheme();
  const [areMapGesturesEnabled, setMapGesturesEnabled] = useState(false);

  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const cardColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const sectionIconColor = isDark
    ? colors.DARK_SURFACE_MUTED
    : colors.BRAND_PRIMARY_SOFT;
  const surfaceColor = isDark ? colors.DARK_SURFACE_MUTED : colors.SURFACE_SOFT;
  const textColor = isDark ? colors.WHITE : colors.INK;
  const coordinate =
    typeof latitude === "number" && typeof longitude === "number"
      ? { latitude, longitude }
      : null;

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: cardColor, borderColor },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIcon,
            { backgroundColor: sectionIconColor },
          ]}
        >
          <Ionicons
            color={colors.BRAND_PRIMARY}
            name="map-outline"
            size={17}
          />
        </View>
        <Text
          numberOfLines={1}
          style={[styles.sectionTitle, { color: textColor }]}
        >
          포인트 위치
        </Text>
      </View>

      {coordinate ? (
        <CatchLocationMap
          gesturePrompt="터치해서 지도 움직이기"
          gesturesEnabled={areMapGesturesEnabled}
          onDisableGestures={() => setMapGesturesEnabled(false)}
          onEnableGestures={() => setMapGesturesEnabled(true)}
          selectedCoordinate={coordinate}
          style={styles.map}
        />
      ) : (
        <View style={[styles.emptyMap, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.emptyMapText, { color: mutedTextColor }]}>
            저장된 위치 좌표가 없습니다.
          </Text>
        </View>
      )}
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
  map: {
    borderRadius: 12,
    height: 190,
    overflow: "hidden",
  },
  emptyMap: {
    alignItems: "center",
    borderRadius: 12,
    height: 120,
    justifyContent: "center",
  },
  emptyMapText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default CatchDetailLocationSection;

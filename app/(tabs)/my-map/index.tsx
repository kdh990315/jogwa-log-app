import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type LatLng,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants";
import { useMapCatchLogs } from "@/hooks/queries/use-catch-logs";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { CatchLogListItem, WaterType } from "@/types/catch-log";
import {
  formatCatchLogDateLabel,
  getCatchLogPointLabel,
} from "@/utils/catch-log-display";
import { getUserErrorMessage } from "@/utils/user-error-message";

interface FishingPointMarker {
  catchCount: number;
  coordinate: LatLng;
  fishCount: number;
  id: string;
  isKkwangPoint: boolean;
  latestDate: string;
  location: string;
  recentCatches: CatchLogListItem[];
  speciesNames: string[];
  waterTypes: WaterType[];
}

const DEFAULT_REGION = {
  latitude: 36.5,
  latitudeDelta: 4.8,
  longitude: 127.8,
  longitudeDelta: 4.8,
};
const SINGLE_POINT_DELTA = 0.04;
const MARKER_LEGEND_ITEMS = [
  { color: colors.GRAY_500, label: "0" },
  { color: colors.GREEN_600, label: "1-3" },
  { color: colors.BRAND_PRIMARY, label: "4-9" },
  { color: colors.ORANGE_500, label: "10+" },
];

export default function MyMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { isDark } = useAppTheme();
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const {
    data: catchLogItems = [],
    error: catchLogError,
    isLoading: isCatchLogsLoading,
  } = useMapCatchLogs();
  const backgroundColor = isDark ? colors.DARK_BACKGROUND : colors.SURFACE_SOFT;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const mapBorderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const overlayColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const textColor = isDark ? colors.WHITE : colors.INK;
  const pointMarkers = useMemo(
    () => getFishingPointMarkers(catchLogItems),
    [catchLogItems],
  );
  const selectedPoint = useMemo(
    () => pointMarkers.find((point) => point.id === selectedPointId) ?? null,
    [pointMarkers, selectedPointId],
  );
  const hasPointMarkers = pointMarkers.length > 0;
  const catchLogErrorMessage = getUserErrorMessage(
    catchLogError,
    "내 포인트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );

  const moveToDefaultMapViewport = useCallback(
    (animated: boolean) => {
      if (pointMarkers.length === 0) {
        mapRef.current?.animateToRegion(DEFAULT_REGION, animated ? 300 : 0);
        return;
      }

      if (pointMarkers.length === 1) {
        mapRef.current?.animateToRegion(
          {
            ...pointMarkers[0].coordinate,
            latitudeDelta: SINGLE_POINT_DELTA,
            longitudeDelta: SINGLE_POINT_DELTA,
          },
          animated ? 350 : 0,
        );
        return;
      }

      mapRef.current?.fitToCoordinates(
        pointMarkers.map((point) => point.coordinate),
        {
          animated,
          edgePadding: {
            bottom: 96,
            left: 48,
            right: 48,
            top: 48,
          },
        },
      );
    },
    [pointMarkers],
  );

  useEffect(() => {
    if (!selectedPointId) {
      return;
    }

    const hasSelectedPoint = pointMarkers.some(
      (point) => point.id === selectedPointId,
    );

    if (!hasSelectedPoint) {
      setSelectedPointId(null);
    }
  }, [pointMarkers, selectedPointId]);

  useEffect(() => {
    if (pointMarkers.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      moveToDefaultMapViewport(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [moveToDefaultMapViewport, pointMarkers]);

  function handlePressPoint(point: FishingPointMarker) {
    setSelectedPointId(point.id);
    mapRef.current?.animateToRegion(
      {
        ...point.coordinate,
        latitudeDelta: SINGLE_POINT_DELTA,
        longitudeDelta: SINGLE_POINT_DELTA,
      },
      300,
    );
  }

  function handleClosePointCard() {
    setSelectedPointId(null);
  }

  function handleResetMapViewport() {
    setSelectedPointId(null);
    moveToDefaultMapViewport(true);
  }

  function handlePressPointCatchLogs(point: FishingPointMarker) {
    router.push({
      pathname: "/catch-log",
      params: {
        view: "points",
        waterType: getPrimaryWaterType(point),
      },
    });
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor }]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: isDark
                  ? colors.DARK_SURFACE_ELEVATED
                  : colors.BRAND_PRIMARY_SOFT,
                borderColor,
              },
            ]}
          >
            <Ionicons
              color={colors.BRAND_PRIMARY}
              name="map-outline"
              size={26}
            />
          </View>
          <View style={styles.titleGroup}>
            <Text style={[styles.eyebrow, { color: colors.BRAND_PRIMARY }]}>
              POINT MAP
            </Text>
            <Text style={[styles.title, { color: textColor }]}>나의 포인트</Text>
          </View>
        </View>

        <View
          style={[
            styles.mapContainer,
            {
              borderColor: mapBorderColor,
            },
          ]}
        >
          <MapView
            initialRegion={DEFAULT_REGION}
            mapType="hybrid"
            onPress={handleClosePointCard}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            ref={mapRef}
            style={styles.map}
          >
            {pointMarkers.map((point) => (
              <Marker
                coordinate={point.coordinate}
                key={point.id}
                onPress={() => handlePressPoint(point)}
              >
                <FishingPointMarkerView
                  fishCount={point.fishCount}
                  isKkwangPoint={point.isKkwangPoint}
                  isSelected={point.id === selectedPointId}
                />
              </Marker>
            ))}
          </MapView>

          {hasPointMarkers && !isCatchLogsLoading && !catchLogError ? (
            <>
              <Pressable
                accessibilityLabel="지도 원위치로 이동"
                accessibilityRole="button"
                onPress={handleResetMapViewport}
                style={({ pressed }) => [
                  styles.resetMapButton,
                  {
                    backgroundColor: overlayColor,
                    borderColor,
                  },
                  pressed && styles.mapButtonPressed,
                ]}
              >
                <Ionicons
                  color={colors.BRAND_PRIMARY}
                  name="locate-outline"
                  size={20}
                />
              </Pressable>
              <MarkerLegend
                backgroundColor={overlayColor}
                borderColor={borderColor}
                textColor={mutedTextColor}
              />
            </>
          ) : null}

          {isCatchLogsLoading ? (
            <MapOverlay backgroundColor={overlayColor}>
              <ActivityIndicator color={colors.BRAND_PRIMARY} />
              <Text style={[styles.overlayTitle, { color: textColor }]}>
                포인트를 불러오는 중입니다
              </Text>
            </MapOverlay>
          ) : catchLogError ? (
            <MapOverlay backgroundColor={overlayColor}>
              <Ionicons color={colors.RED_500} name="alert-circle" size={30} />
              <Text style={[styles.overlayTitle, { color: textColor }]}>
                포인트를 불러오지 못했습니다
              </Text>
              <Text
                style={[styles.overlayDescription, { color: mutedTextColor }]}
              >
                {catchLogErrorMessage}
              </Text>
            </MapOverlay>
          ) : !hasPointMarkers ? (
            <MapOverlay backgroundColor={overlayColor}>
              <View
                style={[
                  styles.placeholderIcon,
                  {
                    backgroundColor: isDark
                      ? colors.DARK_SURFACE_ELEVATED
                      : colors.BRAND_PRIMARY_SOFT,
                  },
                ]}
              >
                <Ionicons
                  color={colors.BRAND_PRIMARY}
                  name="location"
                  size={30}
                />
              </View>
              <Text style={[styles.overlayTitle, { color: textColor }]}>
                표시할 포인트가 없습니다
              </Text>
              <Text
                style={[styles.overlayDescription, { color: mutedTextColor }]}
              >
                위치가 저장된 조과를 등록하면 이곳에서 모아볼 수 있습니다.
              </Text>
            </MapOverlay>
          ) : null}

          {selectedPoint ? (
            <PointSummaryCard
              isDark={isDark}
              mutedTextColor={mutedTextColor}
              onClose={handleClosePointCard}
              onPressCatchLogs={() => handlePressPointCatchLogs(selectedPoint)}
              point={selectedPoint}
              textColor={textColor}
            />
          ) : null}
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: mutedTextColor }]}>
            좌표가 저장된 포인트 {pointMarkers.length}곳
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FishingPointMarkerView({
  fishCount,
  isKkwangPoint,
  isSelected,
}: {
  fishCount: number;
  isKkwangPoint: boolean;
  isSelected: boolean;
}) {
  const markerColor = getFishingPointMarkerColor({
    fishCount,
    isKkwangPoint,
  });
  const markerSize =
    getFishingPointMarkerSize(fishCount) + (isSelected ? 3 : 0);
  const hookIconSize = fishCount >= 10 ? 15 : 14;

  return (
    <View style={styles.markerContainer}>
      <View
        style={[
          styles.markerCircle,
          isSelected && styles.markerCircleSelected,
          {
            backgroundColor: markerColor,
            borderRadius: markerSize / 2,
            height: markerSize,
            width: markerSize,
          },
        ]}
      >
        <MaterialCommunityIcons
          color={colors.WHITE}
          name="hook"
          size={hookIconSize}
        />
      </View>
      <View
        style={[
          styles.markerTail,
          {
            borderTopColor: markerColor,
          },
        ]}
      />
    </View>
  );
}

function MarkerLegend({
  backgroundColor,
  borderColor,
  textColor,
}: {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}) {
  return (
    <View
      accessibilityLabel="포인트 색상 범례. 회색 0마리, 초록 1에서 3마리, 청록 4에서 9마리, 주황 10마리 이상"
      style={[
        styles.markerLegend,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      {MARKER_LEGEND_ITEMS.map((item) => (
        <View key={item.label} style={styles.markerLegendItem}>
          <View
            style={[
              styles.markerLegendDot,
              { backgroundColor: item.color },
            ]}
          />
          <Text style={[styles.markerLegendText, { color: textColor }]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getFishingPointMarkerColor({
  fishCount,
  isKkwangPoint,
}: {
  fishCount: number;
  isKkwangPoint: boolean;
}) {
  if (isKkwangPoint || fishCount <= 0) {
    return colors.GRAY_500;
  }

  if (fishCount <= 3) {
    return colors.GREEN_600;
  }

  if (fishCount <= 9) {
    return colors.BRAND_PRIMARY;
  }

  return colors.ORANGE_500;
}

function getFishingPointMarkerSize(fishCount: number) {
  if (fishCount <= 0) {
    return 26;
  }

  if (fishCount <= 3) {
    return 28;
  }

  if (fishCount <= 9) {
    return 30;
  }

  return 32;
}

function PointSummaryCard({
  isDark,
  mutedTextColor,
  onClose,
  onPressCatchLogs,
  point,
  textColor,
}: {
  isDark: boolean;
  mutedTextColor: string;
  onClose: () => void;
  onPressCatchLogs: () => void;
  point: FishingPointMarker;
  textColor: string;
}) {
  const cardBackgroundColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const statusColor = point.isKkwangPoint
    ? colors.GRAY_500
    : colors.BRAND_PRIMARY;
  const recentCatches = point.recentCatches.slice(0, 3);

  return (
    <View
      style={[
        styles.pointCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.pointCardHeader}>
        <View style={styles.pointTitleGroup}>
          <Text
            numberOfLines={1}
            style={[styles.pointTitle, { color: textColor }]}
          >
            {point.location}
          </Text>
          <Text style={[styles.pointSubtitle, { color: mutedTextColor }]}>
            최근 {formatCatchLogDateLabel(point.latestDate)}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="포인트 카드 닫기"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.pointCloseButton,
            {
              backgroundColor: isDark
                ? colors.DARK_SURFACE_ELEVATED
                : colors.GRAY_200,
            },
            pressed && styles.pointButtonPressed,
          ]}
        >
          <Ionicons color={mutedTextColor} name="close" size={18} />
        </Pressable>
      </View>

      <View style={styles.pointStatsRow}>
        <PointStat
          label="출조"
          textColor={textColor}
          value={`${point.catchCount}회`}
        />
        <PointStat
          label="조과"
          textColor={textColor}
          value={`${point.fishCount}마리`}
        />
        <PointStat
          label="상태"
          textColor={statusColor}
          value={point.isKkwangPoint ? "꽝" : "기록 있음"}
        />
      </View>

      <Text
        numberOfLines={1}
        style={[styles.pointSpeciesText, { color: mutedTextColor }]}
      >
        {point.speciesNames.join(", ")}
      </Text>

      <View style={styles.recentCatchList}>
        {recentCatches.map((catchLog) => (
          <View key={catchLog.id} style={styles.recentCatchRow}>
            <Text
              numberOfLines={1}
              style={[styles.recentCatchSpecies, { color: textColor }]}
            >
              {catchLog.speciesName}
            </Text>
            <Text style={[styles.recentCatchMeta, { color: mutedTextColor }]}>
              {formatCatchLogDateLabel(catchLog.fishingDate)} · {catchLog.count}
              마리
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onPressCatchLogs}
        style={({ pressed }) => [
          styles.pointActionButton,
          pressed && styles.pointButtonPressed,
        ]}
      >
        <Text style={styles.pointActionButtonText}>포인트별 조과 보기</Text>
      </Pressable>
    </View>
  );
}

function PointStat({
  label,
  textColor,
  value,
}: {
  label: string;
  textColor: string;
  value: string;
}) {
  return (
    <View style={styles.pointStat}>
      <Text style={[styles.pointStatValue, { color: textColor }]}>{value}</Text>
      <Text style={styles.pointStatLabel}>{label}</Text>
    </View>
  );
}

function MapOverlay({
  backgroundColor,
  children,
}: {
  backgroundColor: string;
  children: React.ReactNode;
}) {
  return <View style={[styles.overlay, { backgroundColor }]}>{children}</View>;
}

function getFishingPointMarkers(
  catchLogItems: CatchLogListItem[],
): FishingPointMarker[] {
  const pointMap = new Map<string, FishingPointMarker>();

  for (const catchLog of catchLogItems) {
    const coordinate = getValidCoordinate(
      catchLog.latitude,
      catchLog.longitude,
    );

    if (!coordinate) {
      continue;
    }

    const pointName = getCatchLogPointLabel(catchLog.pointName);
    const pointKey = [
      pointName,
      coordinate.latitude.toFixed(5),
      coordinate.longitude.toFixed(5),
    ].join(":");
    const currentPoint = pointMap.get(pointKey);

    if (!currentPoint) {
      pointMap.set(pointKey, {
        catchCount: 1,
        coordinate,
        fishCount: catchLog.count,
        id: pointKey,
        isKkwangPoint: catchLog.count <= 0,
        latestDate: catchLog.fishingDate,
        location: pointName,
        recentCatches: [catchLog],
        speciesNames: [catchLog.speciesName],
        waterTypes: [catchLog.type],
      });
      continue;
    }

    currentPoint.catchCount += 1;
    currentPoint.fishCount += catchLog.count;
    currentPoint.isKkwangPoint = currentPoint.fishCount <= 0;
    currentPoint.latestDate = getLatestDate(
      currentPoint.latestDate,
      catchLog.fishingDate,
    );
    currentPoint.recentCatches = [...currentPoint.recentCatches, catchLog]
      .sort((left, right) => right.fishingDate.localeCompare(left.fishingDate))
      .slice(0, 3);

    if (!currentPoint.speciesNames.includes(catchLog.speciesName)) {
      currentPoint.speciesNames.push(catchLog.speciesName);
    }

    if (!currentPoint.waterTypes.includes(catchLog.type)) {
      currentPoint.waterTypes.push(catchLog.type);
    }
  }

  return Array.from(pointMap.values()).sort((left, right) =>
    right.latestDate.localeCompare(left.latestDate),
  );
}

function getValidCoordinate(
  latitude: number | null,
  longitude: number | null,
): LatLng | null {
  const isValid =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  if (!isValid) {
    return null;
  }

  return { latitude, longitude };
}

function getLatestDate(leftDate: string, rightDate: string) {
  return rightDate.localeCompare(leftDate) > 0 ? rightDate : leftDate;
}

function getPrimaryWaterType(point: FishingPointMarker): WaterType {
  return point.waterTypes[0] ?? "salt";
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  iconBadge: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 1,
  },
  mapContainer: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 420,
    overflow: "hidden",
  },
  map: {
    height: "100%",
    width: "100%",
  },
  mapButtonPressed: {
    opacity: 0.76,
  },
  overlay: {
    alignItems: "center",
    borderRadius: 8,
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: "absolute",
    right: 20,
    top: "36%",
  },
  overlayDescription: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 6,
    textAlign: "center",
  },
  overlayTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
  },
  markerCircle: {
    alignItems: "center",
    borderColor: colors.WHITE,
    borderRadius: 15,
    borderWidth: 2,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  markerCircleSelected: {
    borderWidth: 3,
    height: 34,
    width: 34,
  },
  markerContainer: {
    alignItems: "center",
  },
  markerLegend: {
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 6,
    position: "absolute",
    right: 12,
    top: 58,
  },
  markerLegendDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  markerLegendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  markerLegendText: {
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
  markerTail: {
    borderLeftColor: colors.TRANSPARENT,
    borderLeftWidth: 5,
    borderRightColor: colors.TRANSPARENT,
    borderRightWidth: 5,
    borderTopWidth: 7,
    marginTop: -2,
  },
  pointActionButton: {
    alignItems: "center",
    backgroundColor: colors.BRAND_PRIMARY,
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 36,
  },
  pointActionButtonText: {
    color: colors.WHITE,
    fontSize: 12,
    fontWeight: "800",
  },
  pointButtonPressed: {
    opacity: 0.76,
  },
  pointCard: {
    borderRadius: 10,
    borderWidth: 1,
    bottom: 12,
    left: 12,
    padding: 12,
    position: "absolute",
    right: 12,
  },
  pointCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  pointCloseButton: {
    alignItems: "center",
    borderRadius: 9,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  pointSpeciesText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  pointStat: {
    flex: 1,
  },
  pointStatLabel: {
    color: colors.GRAY_400,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  pointStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  pointStatValue: {
    fontSize: 14,
    fontWeight: "900",
  },
  pointSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  pointTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  pointTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  recentCatchList: {
    gap: 5,
    marginTop: 8,
  },
  recentCatchMeta: {
    fontSize: 11,
    fontWeight: "700",
  },
  recentCatchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  recentCatchSpecies: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 0,
  },
  resetMapButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 40,
  },
  summaryRow: {
    marginTop: 8,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "700",
  },
  placeholderIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    marginBottom: 10,
    width: 48,
  },
});

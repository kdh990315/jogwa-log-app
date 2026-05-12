import { useEffect, useRef, useState } from "react";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type MapType,
  type MapPressEvent,
} from "react-native-maps";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/constants";

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

interface CatchLocationMapProps {
  gestureDisableLabel?: string;
  gesturePrompt?: string;
  gesturesEnabled?: boolean;
  onDisableGestures?: () => void;
  onEnableGestures?: () => void;
  onSelectCoordinate?: (coordinate: MapCoordinate) => void;
  selectedCoordinate?: MapCoordinate | null;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_REGION = {
  latitude: 36.5,
  latitudeDelta: 4.8,
  longitude: 127.8,
  longitudeDelta: 4.8,
};
const SELECTED_COORDINATE_DELTA = 0.02;
type CatchLocationMapType = Extract<MapType, "standard" | "hybrid">;

const MAP_TYPE_OPTIONS: {
  accessibilityLabel: string;
  label: string;
  value: CatchLocationMapType;
}[] = [
  {
    accessibilityLabel: "일반 지도 보기",
    label: "일반",
    value: "standard",
  },
  {
    accessibilityLabel: "위성 지도 보기",
    label: "위성",
    value: "hybrid",
  },
];

export default function CatchLocationMap({
  gestureDisableLabel = "지도 잠그기",
  gesturePrompt,
  gesturesEnabled = true,
  onDisableGestures,
  onEnableGestures,
  onSelectCoordinate,
  selectedCoordinate,
  style,
}: CatchLocationMapProps) {
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<CatchLocationMapType>("standard");

  useEffect(() => {
    if (!selectedCoordinate) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        ...selectedCoordinate,
        latitudeDelta: SELECTED_COORDINATE_DELTA,
        longitudeDelta: SELECTED_COORDINATE_DELTA,
      },
      350,
    );
  }, [selectedCoordinate]);

  function handlePressMap(event: MapPressEvent) {
    onSelectCoordinate?.(event.nativeEvent.coordinate);
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        initialRegion={
          selectedCoordinate
            ? {
                ...selectedCoordinate,
                latitudeDelta: SELECTED_COORDINATE_DELTA,
                longitudeDelta: SELECTED_COORDINATE_DELTA,
              }
            : DEFAULT_REGION
        }
        pitchEnabled={gesturesEnabled}
        mapType={mapType}
        onPress={handlePressMap}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        ref={mapRef}
        rotateEnabled={gesturesEnabled}
        scrollEnabled={gesturesEnabled}
        style={styles.map}
        zoomEnabled={gesturesEnabled}
      >
        {selectedCoordinate ? (
          <Marker coordinate={selectedCoordinate} />
        ) : null}
      </MapView>
      {!gesturesEnabled && gesturePrompt ? (
        <Pressable
          accessibilityLabel={gesturePrompt}
          accessibilityRole="button"
          onPress={onEnableGestures}
          style={({ pressed }) => [
            styles.gesturePromptOverlay,
            pressed && styles.gesturePromptOverlayPressed,
          ]}
        >
          <View style={styles.gesturePromptPill}>
            <Text style={styles.gesturePromptText}>{gesturePrompt}</Text>
          </View>
        </Pressable>
      ) : null}
      {gesturesEnabled && onDisableGestures ? (
        <Pressable
          accessibilityLabel={gestureDisableLabel}
          accessibilityRole="button"
          onPress={onDisableGestures}
          style={({ pressed }) => [
            styles.gestureLockButton,
            pressed && styles.mapTypeButtonPressed,
          ]}
        >
          <Text style={styles.gestureLockButtonText}>
            {gestureDisableLabel}
          </Text>
        </Pressable>
      ) : null}
      <View style={styles.mapTypeControl}>
        {MAP_TYPE_OPTIONS.map((option) => {
          const isSelected = mapType === option.value;

          return (
            <Pressable
              accessibilityLabel={option.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option.value}
              onPress={() => setMapType(option.value)}
              style={({ pressed }) => [
                styles.mapTypeButton,
                isSelected && styles.mapTypeButtonSelected,
                pressed && styles.mapTypeButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.mapTypeButtonText,
                  isSelected && styles.mapTypeButtonTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    height: 340,
    overflow: "hidden",
  },
  map: {
    height: "100%",
    width: "100%",
  },
  gestureLockButton: {
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.86)",
    borderRadius: 999,
    bottom: 12,
    justifyContent: "center",
    left: 12,
    minHeight: 36,
    paddingHorizontal: 14,
    position: "absolute",
    zIndex: 3,
  },
  gestureLockButtonText: {
    color: colors.WHITE,
    fontSize: 13,
    fontWeight: "700",
  },
  gesturePromptOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
  },
  gesturePromptOverlayPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.24)",
  },
  gesturePromptPill: {
    backgroundColor: "rgba(17, 24, 39, 0.88)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  gesturePromptText: {
    color: colors.WHITE,
    fontSize: 14,
    fontWeight: "700",
  },
  mapTypeButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    minWidth: 52,
    paddingHorizontal: 10,
  },
  mapTypeButtonPressed: {
    opacity: 0.78,
  },
  mapTypeButtonSelected: {
    backgroundColor: colors.BLUE_600,
  },
  mapTypeButtonText: {
    color: colors.GRAY_600,
    fontSize: 13,
    fontWeight: "700",
  },
  mapTypeButtonTextSelected: {
    color: colors.WHITE,
  },
  mapTypeControl: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 999,
    elevation: 3,
    flexDirection: "row",
    padding: 3,
    position: "absolute",
    right: 12,
    shadowColor: colors.BLACK,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    top: 12,
    zIndex: 2,
  },
});

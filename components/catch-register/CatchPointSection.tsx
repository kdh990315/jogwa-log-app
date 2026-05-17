import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import CatchLocationMap, {
  type MapCoordinate,
} from "@/components/map/CatchLocationMap";
import type { CatchFormValues } from "@/utils/catch-register-form";

interface CatchPointSectionProps {
  accentColor: string;
  borderColor: string;
  inputRef: React.RefObject<TextInput | null>;
  isSearchingLocation: boolean;
  mutedTextColor: string;
  onSearchLocation: () => void;
  onSelectCoordinate: (coordinate: MapCoordinate) => void;
  selectedCoordinate: MapCoordinate | null;
  subTextColor: string;
  surfaceColor: string;
  textColor: string;
}

export default function CatchPointSection({
  accentColor,
  borderColor,
  inputRef,
  isSearchingLocation,
  mutedTextColor,
  onSearchLocation,
  onSelectCoordinate,
  selectedCoordinate,
  subTextColor,
  surfaceColor,
  textColor,
}: CatchPointSectionProps) {
  const { control } = useFormContext<CatchFormValues>();

  return (
    <>
      <Controller
        control={control}
        name="pointName"
        render={({ field: { onBlur, onChange, value } }) => (
          <View>
            <Text style={[styles.inputLabel, { color: mutedTextColor }]}>
              포인트 명
            </Text>
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="나만의 포인트 이름을 지어주세요"
              placeholderTextColor={subTextColor}
              ref={inputRef}
              returnKeyType="done"
              style={[
                styles.input,
                {
                  backgroundColor: surfaceColor,
                  color: textColor,
                },
              ]}
              value={value}
            />
          </View>
        )}
      />

      <Pressable
        accessibilityLabel="포인트 위치 검색"
        accessibilityRole="button"
        disabled={isSearchingLocation}
        onPress={onSearchLocation}
        style={({ pressed }) => [
          styles.locationSearchButton,
          {
            backgroundColor: surfaceColor,
            borderColor,
            opacity: isSearchingLocation ? 0.55 : pressed ? 0.82 : 1,
          },
        ]}
      >
        <Ionicons color={accentColor} name="search" size={17} />
        <Text style={[styles.locationSearchText, { color: textColor }]}>
          {isSearchingLocation ? "검색 중..." : "포인트명/주소 검색"}
        </Text>
      </Pressable>

      <CatchLocationMap
        onSelectCoordinate={onSelectCoordinate}
        selectedCoordinate={selectedCoordinate}
        style={styles.mapView}
      />

      <Text style={[styles.mapHelperText, { color: mutedTextColor }]}>
        {selectedCoordinate
          ? `선택 위치 ${selectedCoordinate.latitude.toFixed(6)}, ${selectedCoordinate.longitude.toFixed(6)}`
          : "지도를 탭해 조과 위치를 선택해 주세요."}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 10,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationSearchButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  locationSearchText: {
    fontSize: 12,
    fontWeight: "700",
  },
  mapHelperText: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
    marginTop: 8,
  },
  mapView: {
    height: 220,
    marginTop: 8,
  },
});

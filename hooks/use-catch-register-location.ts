import * as Location from "expo-location";
import { useCallback, useMemo, useState } from "react";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { Alert, Keyboard, Platform } from "react-native";

import type { CatchFormValues } from "@/utils/catch-register-form";

interface MapCoordinate {
  latitude: number;
  longitude: number;
}

interface UseCatchRegisterLocationParams {
  getValues: UseFormGetValues<CatchFormValues>;
  latitude: number | null;
  longitude: number | null;
  setValue: UseFormSetValue<CatchFormValues>;
}

export function useCatchRegisterLocation({
  getValues,
  latitude,
  longitude,
  setValue,
}: UseCatchRegisterLocationParams) {
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const selectedMapCoordinate = useMemo(() => {
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return null;
    }

    return {
      latitude,
      longitude,
    };
  }, [latitude, longitude]);
  const hasSelectedMapCoordinate = selectedMapCoordinate !== null;

  const handleSelectMapCoordinate = useCallback(
    (coordinate: MapCoordinate) => {
      setValue("latitude", coordinate.latitude, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue("longitude", coordinate.longitude, {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue],
  );

  const handleSearchLocation = useCallback(async () => {
    const keyword = getValues("pointName").trim();

    if (keyword.length === 0) {
      Alert.alert("검색어 확인", "검색할 포인트명이나 주소를 입력해 주세요.");
      return;
    }

    Keyboard.dismiss();

    try {
      setIsSearchingLocation(true);

      if (Platform.OS === "android") {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "권한 필요",
            "Android에서는 주소 검색을 위해 위치 권한이 필요합니다.",
          );
          return;
        }
      }

      const locations = await Location.geocodeAsync(keyword);
      const firstLocation = locations[0];

      if (!firstLocation) {
        Alert.alert(
          "검색 결과 없음",
          "입력한 포인트명이나 주소의 위치를 찾지 못했습니다.",
        );
        return;
      }

      handleSelectMapCoordinate({
        latitude: firstLocation.latitude,
        longitude: firstLocation.longitude,
      });
    } catch {
      Alert.alert(
        "위치 검색 실패",
        "위치를 검색하지 못했습니다. 주소를 조금 더 자세히 입력해 주세요.",
      );
    } finally {
      setIsSearchingLocation(false);
    }
  }, [getValues, handleSelectMapCoordinate]);

  return {
    handleSearchLocation,
    handleSelectMapCoordinate,
    hasSelectedMapCoordinate,
    isSearchingLocation,
    selectedMapCoordinate,
  };
}

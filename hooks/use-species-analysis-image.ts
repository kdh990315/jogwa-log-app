import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert } from "react-native";

import { logAnalyticsEvent } from "@/api/analytics";
import { analyticsEvents } from "@/constants/analytics";

export interface SelectedAnalysisImage {
  fileSizeBytes?: number | null;
  heightPx?: number | null;
  mimeType?: string | null;
  uri: string;
  widthPx?: number | null;
}

interface UseSpeciesAnalysisImageOptions {
  onImageSelected: () => void;
}

export function useSpeciesAnalysisImage({
  onImageSelected,
}: UseSpeciesAnalysisImageOptions) {
  const [selectedImage, setSelectedImage] =
    useState<SelectedAnalysisImage | null>(null);

  async function handlePickImageFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "권한 필요",
        "사진을 선택하려면 앨범 접근 권한을 허용해야 합니다.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
      });

      handleApplySelectedImage(result);
    } catch {
      Alert.alert(
        "앨범 열기 실패",
        "사진을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "권한 필요",
        "사진을 촬영하려면 카메라 접근 권한을 허용해야 합니다.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 1,
      });

      handleApplySelectedImage(result);
    } catch {
      Alert.alert(
        "카메라 실행 실패",
        "카메라를 열지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  }

  function handleApplySelectedImage(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];

    setSelectedImage({
      fileSizeBytes: asset.fileSize ?? null,
      heightPx: asset.height ?? null,
      mimeType: asset.mimeType ?? null,
      uri: asset.uri,
      widthPx: asset.width ?? null,
    });
    onImageSelected();
    void logAnalyticsEvent(analyticsEvents.aiSpeciesImageSelected, {
      has_image: true,
    });
  }

  return {
    handlePickImageFromLibrary,
    handleTakePhoto,
    selectedImage,
    setSelectedImage,
  };
}

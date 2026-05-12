import * as ImagePicker from "expo-image-picker";
import { useCallback } from "react";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { Alert } from "react-native";

import type { CatchFormValues } from "@/utils/catch-register-form";

export const MAX_CATCH_PHOTO_COUNT = 3;

interface UseCatchRegisterPhotosParams {
  getValues: UseFormGetValues<CatchFormValues>;
  setValue: UseFormSetValue<CatchFormValues>;
}

export function useCatchRegisterPhotos({
  getValues,
  setValue,
}: UseCatchRegisterPhotosParams) {
  const handleAddPhoto = useCallback(async () => {
    const currentPhotos = getValues("photos");

    if (currentPhotos.length >= MAX_CATCH_PHOTO_COUNT) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "권한 필요",
        "현장 사진을 추가하려면 앨범 접근 권한을 허용해야 합니다.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];

    setValue(
      "photos",
      [
        ...currentPhotos,
        {
          fileSizeBytes: asset.fileSize ?? null,
          heightPx: asset.height ?? null,
          id: `${asset.uri}-${Date.now()}`,
          mimeType: asset.mimeType ?? null,
          uri: asset.uri,
          widthPx: asset.width ?? null,
        },
      ].slice(0, MAX_CATCH_PHOTO_COUNT),
      {
        shouldDirty: true,
        shouldTouch: true,
      },
    );
  }, [getValues, setValue]);

  const handleRemovePhoto = useCallback(
    (photoId: string) => {
      setValue(
        "photos",
        getValues("photos").filter((photo) => photo.id !== photoId),
        {
          shouldDirty: true,
          shouldTouch: true,
        },
      );
    },
    [getValues, setValue],
  );

  return {
    handleAddPhoto,
    handleRemovePhoto,
  };
}

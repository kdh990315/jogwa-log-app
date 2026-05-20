import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  uploadPhotoCatchDraftImage,
} from "@/api/photo-catch-draft";
import type {
  CreatePhotoCatchDraftRequest,
  PhotoCatchDraftResponse,
} from "@/types/photo-catch-draft";
import {
  normalizePhotoExif,
  type NormalizedPhotoExif,
} from "@/utils/photo-exif";
import { useCreatePhotoCatchDraft } from "@/hooks/queries/use-create-photo-catch-draft";

interface SelectedPhotoCatchImage {
  exif: Record<string, unknown> | null;
  fileSizeBytes: number | null;
  heightPx: number | null;
  mimeType: string | null;
  normalizedExif: NormalizedPhotoExif;
  pickSource: PhotoPickSource;
  uri: string;
  widthPx: number | null;
}

type PhotoPickSource = "camera" | "library";

export default function PhotoCatchRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const palette = getPhotoRegisterPalette(isDark);
  const [selectedImage, setSelectedImage] =
    useState<SelectedPhotoCatchImage | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const createPhotoCatchDraftMutation = useCreatePhotoCatchDraft();

  const pickPhoto = useCallback(async (source: PhotoPickSource) => {
    if (isPicking) {
      return;
    }

    setIsPicking(true);

    try {
      const hasPermission =
        source === "camera"
          ? await requestCameraPermission()
          : await requestMediaLibraryPermission();

      if (!hasPermission) {
        return;
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              exif: true,
              mediaTypes: ["images"],
              quality: 1,
            })
          : await ImagePicker.launchImageLibraryAsync({
              exif: true,
              mediaTypes: ["images"],
              quality: 1,
              selectionLimit: 1,
            });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const rawExif =
        asset.exif && typeof asset.exif === "object"
          ? (asset.exif as Record<string, unknown>)
          : null;

      setSelectedImage({
        exif: rawExif,
        fileSizeBytes: asset.fileSize ?? null,
        heightPx: asset.height ?? null,
        mimeType: asset.mimeType ?? null,
        normalizedExif: normalizePhotoExif(rawExif),
        pickSource: source,
        uri: asset.uri,
        widthPx: asset.width ?? null,
      });
    } catch {
      Alert.alert(
        source === "camera" ? "카메라 실행 실패" : "앨범 열기 실패",
        "사진을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsPicking(false);
    }
  }, [isPicking]);

  const handlePickFromLibrary = useCallback(async () => {
    await pickPhoto("library");
  }, [pickPhoto]);

  const handleTakePhoto = useCallback(async () => {
    await pickPhoto("camera");
  }, [pickPhoto]);

  const handleContinue = useCallback(async () => {
    if (!selectedImage || isCreatingDraft) {
      return;
    }

    setIsCreatingDraft(true);

    try {
      const coordinate = await resolvePhotoDraftCoordinate(selectedImage);
      const capturedAt = resolvePhotoDraftCapturedAt(selectedImage);

      if (coordinate.latitude === null || coordinate.longitude === null) {
        console.warn("[photo-catch-draft] 사진 EXIF GPS 정보가 없습니다.", {
          capturedAt: capturedAt.capturedAt,
          hasExif: selectedImage.normalizedExif.hasExif,
        });
      }

      const imagePath = await uploadPhotoCatchDraftImage({
        fileSizeBytes: selectedImage.fileSizeBytes,
        localUri: selectedImage.uri,
        mimeType: selectedImage.mimeType,
      });
      const request = {
        capturedAt: capturedAt.capturedAt,
        capturedAtSource: capturedAt.capturedAtSource,
        imagePath,
        latitude: coordinate.latitude,
        locationSource: coordinate.locationSource,
        longitude: coordinate.longitude,
        waterType: "saltwater" as const,
      };
      const draft = await createPhotoCatchDraftMutation.mutateAsync(request);

      console.log("[photo-catch-draft] full draft", draft);
      router.replace({
        pathname: "/catch-register",
        params: buildPhotoDraftRouteParams({
          draft,
          selectedImage,
        }),
      });
    } catch (error) {
      console.error("[photo-catch-draft] failed", error);
      Alert.alert(
        "초안 생성 실패",
        "사진 정보로 조과 초안을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsCreatingDraft(false);
    }
  }, [
    createPhotoCatchDraftMutation,
    isCreatingDraft,
    router,
    selectedImage,
  ]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: palette.background }]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="이전 화면으로 이동"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.iconButtonPressed,
          ]}
        >
          <Ionicons color={palette.text} name="chevron-back" size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          사진으로 등록
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 28 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.photoPanel,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          {selectedImage ? (
            <Image
              resizeMode="contain"
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: palette.accentSoft },
                ]}
              >
                <Ionicons
                  color={colors.BRAND_PRIMARY}
                  name="image-outline"
                  size={30}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>
                조과 사진을 선택해 주세요
              </Text>
              <Text style={[styles.emptyDescription, { color: palette.mutedText }]}>
                촬영 정보가 있으면 다음 단계에서 초안에 반영합니다.
              </Text>
            </View>
          )}
        </View>

        {selectedImage ? (
          <View
            style={[
              styles.photoInfo,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <PhotoInfoRow
              label="크기"
              textColor={palette.text}
              value={formatImageSize(selectedImage)}
            />
            <PhotoInfoRow
              label="형식"
              textColor={palette.text}
              value={selectedImage.mimeType ?? "확인 불가"}
            />
            <PhotoInfoRow
              label="EXIF"
              textColor={palette.text}
              value={selectedImage.normalizedExif.hasExif ? "포함됨" : "없음"}
            />
            <PhotoInfoRow
              label="촬영일시"
              textColor={palette.text}
              value={formatCapturedAtForPhoto(selectedImage)}
            />
            <PhotoInfoRow
              label="GPS"
              textColor={palette.text}
              value={formatCoordinate(selectedImage.normalizedExif)}
            />
          </View>
        ) : null}

        <View style={styles.actionGroup}>
          <CustomButton
            backgroundColor={colors.BRAND_PRIMARY}
            borderColor={colors.BRAND_PRIMARY}
            disabled={isPicking}
            label={selectedImage ? "다시 촬영" : "촬영하기"}
            leftIcon={
              <Ionicons color={colors.WHITE} name="camera-outline" size={18} />
            }
            onPress={handleTakePhoto}
            pressedBackgroundColor={colors.BRAND_PRIMARY_ACTIVE}
            textColor={colors.WHITE}
          />
          <CustomButton
            backgroundColor={palette.surface}
            borderColor={palette.border}
            disabled={isPicking}
            label={selectedImage ? "앨범에서 다시 선택" : "앨범에서 선택"}
            leftIcon={
              <Ionicons
                color={palette.mutedText}
                name="images-outline"
                size={18}
              />
            }
            onPress={handlePickFromLibrary}
            pressedBackgroundColor={palette.pressedSurface}
            textColor={palette.mutedText}
          />
        </View>

        {selectedImage ? (
          <CustomButton
            backgroundColor={colors.BRAND_PRIMARY}
            borderColor={colors.BRAND_PRIMARY}
            containerStyle={styles.continueButton}
            disabled={isCreatingDraft}
            label={isCreatingDraft ? "위치/날씨 확인 중..." : "이 사진으로 시작"}
            leftIcon={
              <Ionicons color={colors.WHITE} name="arrow-forward" size={18} />
            }
            onPress={handleContinue}
            pressedBackgroundColor={colors.BRAND_PRIMARY_ACTIVE}
            textColor={colors.WHITE}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function buildPhotoDraftRouteParams({
  draft,
  selectedImage,
}: {
  draft: PhotoCatchDraftResponse;
  selectedImage: SelectedPhotoCatchImage;
}) {
  const primarySpeciesCandidate = draft.speciesCandidates[0] ?? null;

  return omitNullishRouteParams({
    photoAddress: draft.address,
    photoAddressSource: draft.sources.address,
    photoAirTempC: draft.airTempC,
    photoCapturedAt: draft.capturedAt,
    photoCapturedAtSource: draft.sources.capturedAt,
    photoCurrentSpeedKn: draft.currentSpeedKn,
    photoFileSizeBytes: selectedImage.fileSizeBytes,
    photoFishingIndexForecastId: draft.fishingIndexForecastId,
    photoFishingIndexGrade: draft.fishingIndexGrade,
    photoFishingIndexScore: draft.fishingIndexScore,
    photoFishingLocationId: draft.fishingLocationId,
    photoHeightPx: selectedImage.heightPx,
    photoHumidityPercent: draft.humidityPercent,
    photoImagePath: draft.imagePath,
    photoLatitude: draft.latitude,
    photoLocationSource: draft.sources.location,
    photoLongitude: draft.longitude,
    photoMimeType: selectedImage.mimeType,
    photoPointName: draft.pointName,
    photoPrecipitationAmountMm: draft.precipitationAmountMm,
    photoPrecipitationProbabilityPercent:
      draft.precipitationProbabilityPercent,
    photoRegionName: draft.regionName,
    photoSpeciesSource: draft.sources.species,
    photoTide: draft.tide,
    photoUri: selectedImage.uri,
    photoWaterTempC: draft.waterTempC,
    photoWaveHeightM: draft.waveHeightM,
    photoWeather: draft.weather,
    photoWeatherForecastId: draft.weatherForecastId,
    photoWeatherLocationId: draft.weatherLocationId,
    photoWeatherSource: draft.sources.weather,
    photoWidthPx: selectedImage.widthPx,
    photoWindDirectionDeg: draft.windDirectionDeg,
    photoWindSpeedMs: draft.windSpeedMs,
    prefillAiPredictionId: draft.predictionId,
    prefillSpeciesId: primarySpeciesCandidate?.speciesId ?? null,
    prefillSpeciesName: primarySpeciesCandidate?.speciesName ?? null,
  });
}

function omitNullishRouteParams(values: Record<string, string | number | null>) {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => {
      if (value === null) {
        return [];
      }

      return [[key, String(value)]];
    }),
  );
}

function resolvePhotoDraftCapturedAt(
  selectedImage: SelectedPhotoCatchImage,
): Pick<CreatePhotoCatchDraftRequest, "capturedAt" | "capturedAtSource"> {
  if (selectedImage.normalizedExif.capturedAt) {
    return {
      capturedAt: selectedImage.normalizedExif.capturedAt,
      capturedAtSource: selectedImage.normalizedExif.capturedAtSource,
    };
  }

  if (selectedImage.pickSource === "camera") {
    return {
      capturedAt: new Date().toISOString(),
      capturedAtSource: "device_time",
    };
  }

  return {
    capturedAt: null,
    capturedAtSource: "none",
  };
}

async function resolvePhotoDraftCoordinate(
  selectedImage: SelectedPhotoCatchImage,
): Promise<
  Pick<CreatePhotoCatchDraftRequest, "latitude" | "locationSource" | "longitude">
> {
  if (
    selectedImage.normalizedExif.latitude !== null &&
    selectedImage.normalizedExif.longitude !== null
  ) {
    return {
      latitude: selectedImage.normalizedExif.latitude,
      locationSource: selectedImage.normalizedExif.locationSource,
      longitude: selectedImage.normalizedExif.longitude,
    };
  }

  if (selectedImage.pickSource !== "camera") {
    return {
      latitude: null,
      locationSource: "none",
      longitude: null,
    };
  }

  try {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "위치 권한 필요",
        "사진 위치를 자동으로 채우려면 위치 권한이 필요합니다. 권한 없이도 지도에서 직접 선택할 수 있습니다.",
      );
      return {
        latitude: null,
        locationSource: "none",
        longitude: null,
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = location.coords;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return {
        latitude: null,
        locationSource: "none",
        longitude: null,
      };
    }

    return {
      latitude,
      locationSource: "current_gps",
      longitude,
    };
  } catch (error) {
    console.warn(
      "[photo-catch-draft] 현재 위치 보강 실패",
      error instanceof Error ? error.message : error,
    );

    return {
      latitude: null,
      locationSource: "none",
      longitude: null,
    };
  }
}

async function requestMediaLibraryPermission() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "권한 필요",
      "사진을 선택하려면 앨범 접근 권한을 허용해야 합니다.",
    );
    return false;
  }

  return true;
}

async function requestCameraPermission() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "권한 필요",
      "사진을 촬영하려면 카메라 접근 권한을 허용해야 합니다.",
    );
    return false;
  }

  return true;
}

interface PhotoInfoRowProps {
  label: string;
  textColor: string;
  value: string;
}

function PhotoInfoRow({ label, textColor, value }: PhotoInfoRowProps) {
  return (
    <View style={styles.photoInfoRow}>
      <Text style={[styles.photoInfoLabel, { color: colors.GRAY_400 }]}>
        {label}
      </Text>
      <Text style={[styles.photoInfoValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

function formatImageSize(image: SelectedPhotoCatchImage) {
  if (image.widthPx && image.heightPx) {
    return `${image.widthPx} x ${image.heightPx}`;
  }

  return "확인 불가";
}

function formatCapturedAt(capturedAt: string | null) {
  if (!capturedAt) {
    return "없음";
  }

  const date = new Date(capturedAt);

  if (!Number.isFinite(date.getTime())) {
    return "없음";
  }

  return [
    date.getFullYear(),
    ".",
    String(date.getMonth() + 1).padStart(2, "0"),
    ".",
    String(date.getDate()).padStart(2, "0"),
    " ",
    String(date.getHours()).padStart(2, "0"),
    ":",
    String(date.getMinutes()).padStart(2, "0"),
  ].join("");
}

function formatCapturedAtForPhoto(image: SelectedPhotoCatchImage) {
  if (image.normalizedExif.capturedAt) {
    return formatCapturedAt(image.normalizedExif.capturedAt);
  }

  return image.pickSource === "camera" ? "촬영 시각으로 보강 예정" : "없음";
}

function formatCoordinate(exif: NormalizedPhotoExif) {
  if (exif.latitude === null || exif.longitude === null) {
    return "없음";
  }

  return `${exif.latitude.toFixed(6)}, ${exif.longitude.toFixed(6)}`;
}

function getPhotoRegisterPalette(isDark: boolean) {
  return {
    accentSoft: isDark ? colors.DARK_SURFACE_ELEVATED : colors.BRAND_PRIMARY_SOFT,
    background: isDark ? colors.DARK_BACKGROUND : colors.WHITE,
    border: isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT,
    mutedText: isDark ? colors.GRAY_400 : colors.MUTED_TEXT,
    pressedSurface: isDark ? colors.DARK_BORDER : colors.GRAY_200,
    surface: isDark ? colors.DARK_SURFACE_MUTED : colors.SURFACE_SOFT,
    text: isDark ? colors.WHITE : colors.INK,
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  backButton: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  photoPanel: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 52,
    justifyContent: "center",
    marginBottom: 14,
    width: 52,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  previewImage: {
    height: "100%",
    width: "100%",
  },
  photoInfo: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  photoInfoRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  photoInfoLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  photoInfoValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionGroup: {
    gap: 10,
    marginTop: 14,
  },
  continueButton: {
    marginTop: 18,
  },
});

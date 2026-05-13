import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { logAnalyticsEvent } from "@/api/analytics";
import CustomCTAButton from "@/components/CustomCTAButton";
import CatchFishingDatePickerModal from "@/components/catch-register/CatchFishingDatePickerModal";
import CatchSpeciesPickerModal from "@/components/catch-register/CatchSpeciesPickerModal";
import CatchLocationMap from "@/components/map/CatchLocationMap";
import { colors } from "@/constants";
import { analyticsEvents } from "@/constants/analytics";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useCatchRegisterFishingDate } from "@/hooks/use-catch-register-fishing-date";
import { useCatchRegisterLocation } from "@/hooks/use-catch-register-location";
import { useCatchRegisterSpeciesPicker } from "@/hooks/use-catch-register-species-picker";
import {
  MAX_CATCH_PHOTO_COUNT,
  useCatchRegisterPhotos,
} from "@/hooks/use-catch-register-photos";
import { useCreateCatchLog } from "@/hooks/queries/use-create-catch-log";
import { useEditableCatchLog } from "@/hooks/queries/use-catch-logs";
import { useFishSpecies } from "@/hooks/queries/use-fish-species";
import { useUpdateCatchLog } from "@/hooks/queries/use-update-catch-log";
import type { CatchLogWaterType } from "@/types/catch-log";
import {
  DEFAULT_CATCH_FORM_VALUES,
  buildCatchFormValues,
  buildCreateCatchLogInput,
  buildUpdateCatchLogInput,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  type CatchFormTextFieldName,
  type CatchFormValues,
} from "@/utils/catch-register-form";
import {
  getSevenMulTideLabel,
  isValidFishingDateInput,
} from "@/utils/tide";
import { getUserErrorMessage } from "@/utils/user-error-message";

type CatchStep = 1 | 2 | 3;

interface CatchRegisterColors {
  accent: string;
  accentSoft: string;
  background: string;
  border: string;
  elevatedSurface: string;
  mutedText: string;
  subText: string;
  surface: string;
  text: string;
}

const WEATHER_OPTIONS = ["맑음", "흐림", "안개", "비", "눈", "바람"] as const;

// REFACTOR: 이 화면은 step 전환, form 상태, 권한/이미지 선택, 플랫폼별 picker, 모달 UI를 한 파일에서 모두 관리한다.
// step별 section 컴포넌트와 photo/species/date 로직을 custom hook으로 분리하면 수정 범위와 회귀 위험을 줄일 수 있다.
export default function CatchLogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    editId?: string;
    prefillAiPredictionId?: string;
    prefillSpeciesId?: string;
    prefillSpeciesName?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { colorScheme, isDark } = useAppTheme();
  const theme = getCatchRegisterColors(isDark);

  const form = useForm<CatchFormValues>({
    defaultValues: DEFAULT_CATCH_FORM_VALUES,
    mode: "onChange",
  });
  const { control, getValues, reset, setValue } = form;
  const editIdParam = normalizeRouteParam(params.editId);
  const editCatchLogId = editIdParam ? Number(editIdParam) : Number.NaN;
  const isEditMode = editIdParam !== null;
  const isValidEditCatchLogId = Number.isFinite(editCatchLogId);
  const prefillAiPredictionId = normalizePositiveIntegerRouteParam(
    params.prefillAiPredictionId,
  );
  const prefillSpeciesId = normalizePositiveIntegerRouteParam(
    params.prefillSpeciesId,
  );
  const prefillSpeciesName = normalizeRouteParam(params.prefillSpeciesName);
  const {
    data: editableCatchLog,
    error: editableCatchLogError,
    isLoading: isEditableCatchLogLoading,
  } = useEditableCatchLog(editCatchLogId, isEditMode && isValidEditCatchLogId);
  const {
    data: fishSpeciesList = [],
    error: fishSpeciesError,
    isLoading: isFishSpeciesLoading,
  } = useFishSpecies();
  const createCatchLogMutation = useCreateCatchLog();
  const updateCatchLogMutation = useUpdateCatchLog();
  const { handleAddPhoto, handleRemovePhoto } = useCatchRegisterPhotos({
    getValues,
    setValue,
  });

  const [step, setStep] = useState<CatchStep>(1);
  const watchedValues = useWatch({
    control,
  });
  const formValues: CatchFormValues = {
    ...DEFAULT_CATCH_FORM_VALUES,
    ...watchedValues,
    photos: (watchedValues?.photos ?? DEFAULT_CATCH_FORM_VALUES.photos).flatMap(
      (photo) => {
        if (!photo?.id || !photo.uri) {
          return [];
        }

        return [
          {
            fileSizeBytes: photo.fileSizeBytes ?? null,
            heightPx: photo.heightPx ?? null,
            id: photo.id,
            mimeType: photo.mimeType ?? null,
            storagePath: photo.storagePath ?? null,
            uri: photo.uri,
            widthPx: photo.widthPx ?? null,
          },
        ];
      },
    ),
  };
  const [isWeatherSelectExpanded, setIsWeatherSelectExpanded] = useState(false);

  const stepScrollViewRef = useRef<ScrollView>(null);
  const appliedPrefillSpeciesRef = useRef<string | null>(null);
  const sizeInputRef = useRef<TextInput>(null);
  const countInputRef = useRef<TextInput>(null);
  const memoInputRef = useRef<TextInput>(null);
  const pointNameInputRef = useRef<TextInput>(null);
  const handleFocusCountAfterSpeciesSelection = useCallback(() => {
    setTimeout(() => {
      countInputRef.current?.focus();
    }, 80);
  }, []);
  const {
    filteredSpeciesOptions,
    handleApplySpeciesSearch,
    handleCloseSpeciesPicker,
    handleCommitSpeciesName,
    handleOpenSpeciesPicker,
    isSpeciesPickerVisible,
    normalizedSpeciesSearchKeyword,
    setSpeciesSearchKeyword,
    speciesOptions,
    speciesSearchInputRef,
    speciesSearchKeyword,
    syncSpeciesSearchKeyword,
  } = useCatchRegisterSpeciesPicker({
    fishSpeciesList,
    onSelectSpeciesComplete: handleFocusCountAfterSpeciesSelection,
    selectedSpeciesName: formValues.speciesName,
    setValue,
    waterType: formValues.waterType,
  });

  const progressWidth = `${(step / 3) * 100}%` as `${number}%`;
  const hasCatchCountInput = formValues.count.trim().length > 0;
  const hasPositiveCatchCount =
    hasCatchCountInput && Number(formValues.count) > 0;
  const isSizeFieldEnabled = hasPositiveCatchCount;
  const isTideFieldEnabled = formValues.waterType === "saltwater";
  const isSubmitting =
    createCatchLogMutation.isPending || updateCatchLogMutation.isPending;
  const isStepTwoValid =
    isValidFishingDateInput(formValues.fishingDate) &&
    formValues.speciesName.trim().length > 0 &&
    hasCatchCountInput;
  const hasPointNameInput = formValues.pointName.trim().length > 0;
  const {
    handleSearchLocation,
    handleSelectMapCoordinate,
    hasSelectedMapCoordinate,
    isSearchingLocation,
    selectedMapCoordinate,
  } = useCatchRegisterLocation({
    getValues,
    latitude: formValues.latitude,
    longitude: formValues.longitude,
    setValue,
  });
  const isPrimaryDisabled =
    isSubmitting ||
    (step === 2 && !isStepTwoValid) ||
    (step === 3 && (!hasPointNameInput || !hasSelectedMapCoordinate));
  const primaryButtonLabel = isSubmitting
    ? "처리 중..."
    : step === 3
      ? isEditMode
        ? "수정 저장하기"
        : "기록 저장하기"
      : "다음";
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android" || step === 1) {
        return undefined;
      }

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          setStep((current) => getPreviousStep(current));
          return true;
        },
      );

      return () => subscription.remove();
    }, [step]),
  );

  useEffect(() => {
    if (!editableCatchLog) {
      return;
    }

    reset(buildCatchFormValues(editableCatchLog));
    syncSpeciesSearchKeyword(editableCatchLog.speciesName);
    setStep(2);
  }, [editableCatchLog, reset, syncSpeciesSearchKeyword]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    if (
      !prefillSpeciesName ||
      appliedPrefillSpeciesRef.current === prefillSpeciesName
    ) {
      return;
    }

    appliedPrefillSpeciesRef.current = prefillSpeciesName;
    setValue("speciesName", prefillSpeciesName, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    syncSpeciesSearchKeyword(prefillSpeciesName);
    setStep(2);
  }, [isEditMode, prefillSpeciesName, setValue, syncSpeciesSearchKeyword]);

  useEffect(() => {
    const timer = setTimeout(() => {
      stepScrollViewRef.current?.scrollTo({ animated: false, y: 0 });
    }, 0);

    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (!isTideFieldEnabled) {
      if (getValues("tide").length === 0) {
        return;
      }

      setValue("tide", "", {
        shouldDirty: true,
        shouldTouch: true,
      });
      return;
    }

    const autoTide = getSevenMulTideLabel(formValues.fishingDate) ?? "";

    if (getValues("tide") === autoTide) {
      return;
    }

    setValue("tide", autoTide, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [formValues.fishingDate, getValues, isTideFieldEnabled, setValue]);

  useEffect(() => {
    if (isSizeFieldEnabled || formValues.sizeCm.length === 0) {
      return;
    }

    setValue("sizeCm", "", {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [formValues.sizeCm, isSizeFieldEnabled, setValue]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((current) => getPreviousStep(current));
      return;
    }

    if (isEditMode) {
      router.back();
      return;
    }

    router.replace("/");
  }, [isEditMode, router, step]);

  const handleSelectWaterType = useCallback(
    (waterType: CatchLogWaterType) => {
      setValue("waterType", waterType, {
        shouldDirty: true,
        shouldTouch: true,
      });
      void logAnalyticsEvent(analyticsEvents.catchLogStep1Complete, {
        water_type: waterType,
      });
      setStep(2);
    },
    [setValue],
  );

  const handleOpenWeatherSelect = useCallback(() => {
    setIsWeatherSelectExpanded(true);
  }, []);

  const handleToggleWeatherSelect = useCallback(() => {
    setIsWeatherSelectExpanded((current) => !current);
  }, []);

  const handleSelectWeather = useCallback(
    (weather: string) => {
      setValue("weather", weather, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setIsWeatherSelectExpanded(false);

      setTimeout(() => {
        memoInputRef.current?.focus();
      }, 80);
    },
    [setValue],
  );

  const handleFocusSpeciesAfterDateSelection = useCallback(() => {
    setTimeout(() => {
      handleOpenSpeciesPicker();
    }, 80);
  }, [handleOpenSpeciesPicker]);
  const {
    handleChangeFishingDatePicker,
    handleCloseFishingDatePicker,
    handleConfirmFishingDate,
    handleOpenFishingDatePicker,
    iosFishingDateDraft,
    isFishingDatePickerVisible,
    maxFishingDate,
  } = useCatchRegisterFishingDate({
    fishingDate: formValues.fishingDate,
    onSelectDateComplete: handleFocusSpeciesAfterDateSelection,
    setValue,
  });

  const handleSubmitCatchLog = useCallback(async () => {
    try {
      if (isEditMode) {
        if (!isValidEditCatchLogId) {
          Alert.alert("수정 실패", "수정할 조과 기록 정보가 올바르지 않습니다.");
          return;
        }

        const updatedCatchLog = await updateCatchLogMutation.mutateAsync({
          catchLogId: editCatchLogId,
          input: buildUpdateCatchLogInput(getValues(), fishSpeciesList),
        });

        Alert.alert(
          "수정 완료",
          `조과 기록 #${updatedCatchLog.id}번이 수정되었습니다.`,
          [
            {
              text: "확인",
              onPress: () => router.replace(`/catch-log/${updatedCatchLog.id}`),
            },
          ],
        );
        return;
      }

      const createdCatchLog = await createCatchLogMutation.mutateAsync(
        buildCreateCatchLogInput(getValues(), fishSpeciesList, {
          aiPredictionId: prefillAiPredictionId,
          prefillSpeciesId,
          prefillSpeciesName,
        }),
      );
      const submittedValues = getValues();

      void logAnalyticsEvent(analyticsEvents.catchLogCreateSuccess, {
        has_image: submittedValues.photos.length > 0,
        water_type: submittedValues.waterType,
      });

      Alert.alert(
        "등록 완료",
        "조과등록이 완료되었습니다.",
        [
          {
            text: "확인",
            onPress: () => router.replace(`/catch-log/${createdCatchLog.id}`),
          },
        ],
      );
    } catch (error) {
      const submittedValues = getValues();

      void logAnalyticsEvent(analyticsEvents.catchLogCreateFail, {
        error_code: "save_failed",
        has_image: submittedValues.photos.length > 0,
        water_type: submittedValues.waterType,
      });
      Alert.alert(
        isEditMode ? "수정 실패" : "등록 실패",
        getCatchLogMutationErrorMessage(error),
      );
    }
  }, [
    createCatchLogMutation,
    editCatchLogId,
    fishSpeciesList,
    getValues,
    isEditMode,
    isValidEditCatchLogId,
    prefillAiPredictionId,
    prefillSpeciesId,
    prefillSpeciesName,
    router,
    updateCatchLogMutation,
  ]);

  const handleContinue = useCallback(() => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!isStepTwoValid) {
        Alert.alert("입력 확인", "출조 날짜, 어종, 마릿수를 입력해 주세요.");
        return;
      }

      void logAnalyticsEvent(analyticsEvents.catchLogStep2Complete, {
        has_image: formValues.photos.length > 0,
        water_type: formValues.waterType,
      });
      setStep(3);
      return;
    }

    if (!hasPointNameInput) {
      Alert.alert("입력 확인", "나만의 포인트명을 입력해 주세요.");
      return;
    }

    if (!hasSelectedMapCoordinate) {
      Alert.alert("위치 확인", "지도를 탭해 조과 위치를 선택해 주세요.");
      return;
    }

    void logAnalyticsEvent(analyticsEvents.catchLogStep3Complete, {
      has_image: formValues.photos.length > 0,
      water_type: formValues.waterType,
    });
    void handleSubmitCatchLog();
  }, [
    formValues.photos.length,
    formValues.waterType,
    handleSubmitCatchLog,
    hasPointNameInput,
    hasSelectedMapCoordinate,
    isStepTwoValid,
    step,
  ]);

  if (isEditMode && (!isValidEditCatchLogId || isEditableCatchLogLoading)) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <View style={styles.editStateContainer}>
          <Text style={[styles.editStateTitle, { color: theme.text }]}>
            {!isValidEditCatchLogId
              ? "수정할 기록을 찾을 수 없습니다"
              : "조과 기록을 불러오는 중입니다"}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.editStateButton,
              {
                backgroundColor: theme.surface,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.editStateButtonText, { color: theme.text }]}>
              이전으로
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isEditMode && !editableCatchLog) {
    const errorMessage = getUserErrorMessage(
      editableCatchLogError,
      "수정할 조과 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );

    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <View style={styles.editStateContainer}>
          <Text style={[styles.editStateTitle, { color: theme.text }]}>
            수정할 기록을 찾을 수 없습니다
          </Text>
          <Text style={[styles.editStateDescription, { color: theme.mutedText }]}>
            {errorMessage}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.editStateButton,
              {
                backgroundColor: theme.surface,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.editStateButtonText, { color: theme.text }]}>
              이전으로
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <FormProvider {...form}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 16}
          style={styles.container}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="이전 단계로 이동"
              accessibilityRole="button"
              hitSlop={10}
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <Ionicons color={theme.text} name="chevron-back" size={24} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {isEditMode ? "조과 수정" : "조과 등록"}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <View
            style={[
              styles.progressBarContainer,
              { backgroundColor: theme.surface },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.accent,
                  width: progressWidth,
                },
              ]}
            />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 96 + insets.bottom },
            ]}
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            keyboardShouldPersistTaps="handled"
            ref={stepScrollViewRef}
            showsVerticalScrollIndicator={false}
          >
            {step === 1 ? (
              <View style={styles.stepContainer}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>
                  오늘 어떤 낚시를{"\n"}다녀오셨나요?
                </Text>
                <View style={styles.segmentContainer}>
                  <SegmentButton
                    iconName="water-outline"
                    label="바다 낚시"
                    onPress={() => handleSelectWaterType("saltwater")}
                    theme={theme}
                  />
                  <SegmentButton
                    iconName="leaf-outline"
                    label="민물 낚시"
                    onPress={() => handleSelectWaterType("freshwater")}
                    theme={theme}
                  />
                </View>
              </View>
            ) : null}

            {step === 2 ? (
              <View style={styles.stepContainer}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>
                  어떤 물고기를 잡으셨나요?
                </Text>

                <CatchFormDateField
                  label="출조 날짜"
                  name="fishingDate"
                  onPress={handleOpenFishingDatePicker}
                  placeholder="예: 2026.04.27"
                  theme={theme}
                />

                <CatchFormPickerField
                  label="어종"
                  name="speciesName"
                  onPress={handleOpenSpeciesPicker}
                  placeholder="예: 참돔, 광어"
                  theme={theme}
                />

                <Text style={[styles.optionHelperText, { color: theme.mutedText }]}>
                  탭해서 {formValues.waterType === "saltwater" ? "바다" : "민물"}{" "}
                  어종을 선택하거나 직접 입력해 주세요.
                </Text>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <CatchFormTextField
                      inputRef={countInputRef}
                      keyboardType="number-pad"
                      label="마릿수"
                      name="count"
                      onSubmitEditing={() =>
                        isSizeFieldEnabled
                          ? sizeInputRef.current?.focus()
                          : handleOpenWeatherSelect()
                      }
                      placeholder="예: 3"
                      returnKeyType="next"
                      sanitizeValue={sanitizeIntegerInput}
                      theme={theme}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <CatchFormTextField
                      editable={isSizeFieldEnabled}
                      inputRef={sizeInputRef}
                      keyboardType={
                        Platform.OS === "ios" ? "decimal-pad" : "numeric"
                      }
                      label="사이즈 (cm)"
                      name="sizeCm"
                      onSubmitEditing={handleOpenWeatherSelect}
                      placeholder={
                        isSizeFieldEnabled ? "예: 50" : "마릿수 입력"
                      }
                      returnKeyType="next"
                      sanitizeValue={sanitizeDecimalInput}
                      theme={theme}
                    />
                  </View>
                </View>

                <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
                  물때 / 날씨
                </Text>
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <CatchFormTextField
                      editable={false}
                      name="tide"
                      placeholder={isTideFieldEnabled ? "예: 7물" : "해당 없음"}
                      theme={theme}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <CatchFormInlineSelectField
                      isExpanded={isWeatherSelectExpanded}
                      name="weather"
                      onPress={handleToggleWeatherSelect}
                      onSelectOption={handleSelectWeather}
                      options={WEATHER_OPTIONS}
                      placeholder="날씨 선택"
                      theme={theme}
                    />
                  </View>
                </View>

                <CatchFormTextField
                  inputRef={memoInputRef}
                  label="조과 메모"
                  multiline
                  name="memo"
                  placeholder="그 날의 짜릿한 손맛을 기록해보세요!"
                  theme={theme}
                />
              </View>
            ) : null}

            {step === 3 ? (
              <View style={styles.stepContainer}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>
                  포인트와 사진을 남겨주세요
                </Text>

                <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
                  현장 사진 (최대 3장)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photoScroll}
                >
                  {formValues.photos.length < MAX_CATCH_PHOTO_COUNT ? (
                    <Pressable
                      accessibilityLabel="현장 사진 추가"
                      accessibilityRole="button"
                      onPress={() => {
                        void handleAddPhoto();
                      }}
                      style={({ pressed }) => [
                        styles.addPhotoButton,
                        {
                          backgroundColor: theme.surface,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        },
                      ]}
                    >
                      <Ionicons color={theme.mutedText} name="add" size={28} />
                    </Pressable>
                  ) : null}

                  {formValues.photos.map((photo) => (
                    <View key={photo.id} style={styles.photoCard}>
                      <Image
                        resizeMode="contain"
                        source={{ uri: photo.uri }}
                        style={styles.photoImage}
                      />
                      <Pressable
                        accessibilityLabel="사진 삭제"
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => handleRemovePhoto(photo.id)}
                        style={({ pressed }) => [
                          styles.removePhotoButton,
                          {
                            backgroundColor: theme.background,
                            transform: [{ scale: pressed ? 0.96 : 1 }],
                          },
                        ]}
                      >
                        <Ionicons color={theme.text} name="close" size={14} />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>

                <CatchFormTextField
                  inputRef={pointNameInputRef}
                  label="포인트 명"
                  name="pointName"
                  placeholder="나만의 포인트 이름을 지어주세요"
                  returnKeyType="done"
                  theme={theme}
                />

                <Pressable
                  accessibilityLabel="포인트 위치 검색"
                  accessibilityRole="button"
                  disabled={isSearchingLocation}
                  onPress={() => {
                    void handleSearchLocation();
                  }}
                  style={({ pressed }) => [
                    styles.locationSearchButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      opacity: isSearchingLocation ? 0.55 : pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    color={theme.accent}
                    name="search"
                    size={17}
                  />
                  <Text
                    style={[
                      styles.locationSearchText,
                      { color: theme.text },
                    ]}
                  >
                    {isSearchingLocation ? "검색 중..." : "포인트명/주소 검색"}
                  </Text>
                </Pressable>

                <CatchLocationMap
                  onSelectCoordinate={handleSelectMapCoordinate}
                  selectedCoordinate={selectedMapCoordinate}
                  style={styles.mapView}
                />

                <Text style={[styles.mapHelperText, { color: theme.mutedText }]}>
                  {selectedMapCoordinate
                    ? `선택 위치 ${selectedMapCoordinate.latitude.toFixed(6)}, ${selectedMapCoordinate.longitude.toFixed(6)}`
                    : "지도를 탭해 조과 위치를 선택해 주세요."}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {Platform.OS === "ios" ? (
            <CatchFishingDatePickerModal
              accentColor={theme.accent}
              backgroundColor={theme.background}
              borderColor={theme.border}
              date={iosFishingDateDraft}
              maxDate={maxFishingDate}
              mutedTextColor={theme.mutedText}
              onChange={handleChangeFishingDatePicker}
              onClose={handleCloseFishingDatePicker}
              onConfirm={handleConfirmFishingDate}
              paddingBottom={Math.max(insets.bottom, 16)}
              textColor={theme.text}
              themeVariant={colorScheme === "dark" ? "dark" : "light"}
              visible={isFishingDatePickerVisible}
            />
          ) : null}

          <CatchSpeciesPickerModal
            accentColor={theme.accent}
            accentSoftColor={theme.accentSoft}
            backgroundColor={theme.background}
            borderColor={theme.border}
            filteredSpeciesOptions={filteredSpeciesOptions}
            hasSpeciesError={Boolean(fishSpeciesError)}
            isLoading={isFishSpeciesLoading}
            mutedTextColor={theme.mutedText}
            normalizedSearchKeyword={normalizedSpeciesSearchKeyword}
            onApplySearch={handleApplySpeciesSearch}
            onChangeSearchKeyword={setSpeciesSearchKeyword}
            onClose={handleCloseSpeciesPicker}
            onSelectSpecies={handleCommitSpeciesName}
            searchInputRef={speciesSearchInputRef}
            searchKeyword={speciesSearchKeyword}
            selectedSpeciesName={formValues.speciesName}
            speciesCount={speciesOptions.length}
            subTextColor={theme.subText}
            surfaceColor={theme.surface}
            textColor={theme.text}
            visible={isSpeciesPickerVisible}
            waterType={formValues.waterType}
          />
        </KeyboardAvoidingView>

        {step !== 1 ? (
          <View
            style={[
              styles.footer,
              {
                backgroundColor: theme.background,
                borderTopColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 15),
              },
            ]}
          >
            <CustomCTAButton
              backgroundColor={theme.accent}
              disabled={isPrimaryDisabled}
              label={primaryButtonLabel}
              onPress={handleContinue}
            />
          </View>
        ) : null}
      </FormProvider>
    </SafeAreaView>
  );
}

// REFACTOR: 파일 하단에 필드 렌더러, sanitize 함수, payload 빌더까지 함께 쌓여 있다.
// `app/catch-register/components`와 `utils`로 분리하면 화면 본문이 훨씬 짧아지고 필드 재사용도 쉬워진다.
interface SegmentButtonProps {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  theme: CatchRegisterColors;
}

function SegmentButton({
  iconName,
  label,
  onPress,
  theme,
}: SegmentButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        {
          backgroundColor: theme.surface,
          borderColor: "transparent",
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.segmentContent}>
        <Ionicons color={theme.mutedText} name={iconName} size={20} />
        <Text style={[styles.segmentText, { color: theme.text }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

interface CatchFormTextFieldProps {
  theme: CatchRegisterColors;
  name: CatchFormTextFieldName;
  placeholder: string;
  label?: string;
  editable?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
  returnKeyType?: React.ComponentProps<typeof TextInput>["returnKeyType"];
  onSubmitEditing?: () => void;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  multiline?: boolean;
  sanitizeValue?: (value: string) => string;
}

interface CatchFormDateFieldProps {
  theme: CatchRegisterColors;
  name: "fishingDate";
  placeholder: string;
  label: string;
  onPress: () => void;
}

interface CatchFormPickerFieldProps {
  theme: CatchRegisterColors;
  name: "speciesName";
  placeholder: string;
  label: string;
  onPress: () => void;
}

interface CatchFormInlineSelectFieldProps {
  theme: CatchRegisterColors;
  name: "weather";
  label?: string;
  options: readonly string[];
  placeholder: string;
  isExpanded: boolean;
  onPress: () => void;
  onSelectOption: (value: string) => void;
}

function CatchFormDateField({
  theme,
  name,
  placeholder,
  label,
  onPress,
}: CatchFormDateFieldProps) {
  const { control } = useFormContext<CatchFormValues>();

  return (
    <>
      <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value } }) => {
          const hasValue = (value ?? "").trim().length > 0;

          return (
            <Pressable
              accessibilityHint="날짜 선택기를 엽니다"
              accessibilityLabel={label}
              accessibilityRole="button"
              onPress={onPress}
              style={({ pressed }) => [
                styles.input,
                styles.dateField,
                {
                  backgroundColor: theme.surface,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.dateFieldText,
                  {
                    color: hasValue ? theme.text : theme.subText,
                  },
                ]}
              >
                {hasValue ? value : placeholder}
              </Text>
              <Ionicons
                color={theme.mutedText}
                name="calendar-outline"
                size={20}
              />
            </Pressable>
          );
        }}
      />
    </>
  );
}

function CatchFormPickerField({
  theme,
  name,
  placeholder,
  label,
  onPress,
}: CatchFormPickerFieldProps) {
  const { control } = useFormContext<CatchFormValues>();

  return (
    <>
      <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value } }) => {
          const hasValue = (value ?? "").trim().length > 0;

          return (
            <Pressable
              accessibilityHint="어종 선택 모달을 엽니다"
              accessibilityLabel={label}
              accessibilityRole="button"
              onPress={onPress}
              style={({ pressed }) => [
                styles.input,
                styles.pickerField,
                {
                  backgroundColor: theme.surface,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.pickerFieldText,
                  {
                    color: hasValue ? theme.text : theme.subText,
                  },
                ]}
              >
                {hasValue ? value : placeholder}
              </Text>
              <Ionicons
                color={theme.mutedText}
                name="chevron-forward"
                size={20}
              />
            </Pressable>
          );
        }}
      />
    </>
  );
}

function CatchFormInlineSelectField({
  theme,
  name,
  options,
  label,
  placeholder,
  isExpanded,
  onPress,
  onSelectOption,
}: CatchFormInlineSelectFieldProps) {
  const { control } = useFormContext<CatchFormValues>();
  const selectedValue = useWatch({ control, name });
  const normalizedSelectedValue = (selectedValue ?? "").trim();
  const hasValue = normalizedSelectedValue.length > 0;

  return (
    <>
      {label ? (
        <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityLabel={label ?? placeholder}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.input,
          styles.inlineSelectField,
          {
            backgroundColor: theme.surface,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.inlineSelectFieldText,
            {
              color: hasValue ? theme.text : theme.subText,
            },
          ]}
        >
          {hasValue ? normalizedSelectedValue : placeholder}
        </Text>
        <Ionicons
          color={theme.mutedText}
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
        />
      </Pressable>
      {isExpanded ? (
        <View
          style={[
            styles.inlineSelectOptions,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {options.map((option, index) => {
            const isSelected = normalizedSelectedValue === option;
            const isLast = index === options.length - 1;

            return (
              <Pressable
                accessibilityRole="button"
                key={option}
                onPress={() => onSelectOption(isSelected ? "" : option)}
                style={({ pressed }) => [
                  styles.inlineSelectOption,
                  {
                    borderBottomColor: theme.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                  !isLast && styles.inlineSelectOptionDivider,
                ]}
              >
                <Text
                  style={[
                    styles.inlineSelectOptionText,
                    {
                      color: isSelected ? theme.accent : theme.text,
                    },
                  ]}
                >
                  {option}
                </Text>
                {isSelected ? (
                  <Ionicons
                    color={theme.accent}
                    name="checkmark"
                    size={18}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

function CatchFormTextField({
  theme,
  name,
  placeholder,
  label,
  editable = true,
  inputRef,
  returnKeyType,
  onSubmitEditing,
  keyboardType,
  multiline = false,
  sanitizeValue,
}: CatchFormTextFieldProps) {
  const { control } = useFormContext<CatchFormValues>();

  return (
    <>
      {label ? (
        <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
          {label}
        </Text>
      ) : null}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            editable={editable}
            keyboardType={keyboardType}
            multiline={multiline}
            onChangeText={(text) =>
              onChange(sanitizeValue ? sanitizeValue(text) : text)
            }
            onSubmitEditing={onSubmitEditing}
            placeholder={placeholder}
            placeholderTextColor={theme.subText}
            ref={inputRef}
            returnKeyType={returnKeyType}
            style={[
              styles.input,
              multiline && styles.textArea,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                opacity: editable ? 1 : 0.55,
              },
            ]}
            textAlignVertical={multiline ? "top" : "center"}
            value={value}
          />
        )}
      />
    </>
  );
}

function getCatchRegisterColors(isDark: boolean): CatchRegisterColors {
  return {
    accent: colors.BLUE_600,
    accentSoft: colors.BLUE_100,
    background: isDark ? colors.DARK_BACKGROUND : colors.WHITE,
    border: isDark ? colors.DARK_BORDER : colors.GRAY_200,
    elevatedSurface: isDark ? colors.DARK_BORDER : colors.GRAY_200,
    mutedText: isDark ? colors.GRAY_400 : colors.GRAY_500,
    subText: colors.GRAY_400,
    surface: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100,
    text: isDark ? colors.WHITE : colors.GRAY_600,
  };
}

function getPreviousStep(step: CatchStep): CatchStep {
  if (step === 3) {
    return 2;
  }

  return 1;
}

function getCatchLogMutationErrorMessage(error: unknown) {
  return getUserErrorMessage(
    error,
    "조과 기록을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );
}

function normalizeRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return value?.trim() || null;
}

function normalizePositiveIntegerRouteParam(
  value: string | string[] | undefined,
) {
  const normalizedValue = normalizeRouteParam(value);

  if (!normalizedValue) {
    return null;
  }

  const numberValue = Number(normalizedValue);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  editStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  editStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  editStateDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    textAlign: "center",
  },
  editStateButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editStateButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 28,
  },
  progressBarContainer: {
    height: 4,
    width: "100%",
  },
  progressBarFill: {
    borderRadius: 2,
    height: "100%",
  },
  scrollContent: {
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 30,
    marginTop: 10,
  },
  segmentContainer: {
    flexDirection: "column",
    gap: 20,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    flex: 1,
    paddingVertical: 30,
  },
  segmentContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 18,
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateField: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateFieldText: {
    flex: 1,
    fontSize: 16,
  },
  pickerField: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerFieldText: {
    flex: 1,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inlineSelectField: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inlineSelectFieldText: {
    flex: 1,
    fontSize: 16,
  },
  inlineSelectOptions: {
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    overflow: "hidden",
  },
  inlineSelectOption: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineSelectOptionDivider: {
    borderBottomWidth: 1,
  },
  inlineSelectOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionHelperText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  halfField: {
    flex: 1,
  },
  textArea: {
    height: 100,
  },
  locationSearchButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  locationSearchText: {
    fontSize: 14,
    fontWeight: "700",
  },
  mapHelperText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
    marginTop: 12,
  },
  mapView: {
    marginTop: 12,
  },
  photoScroll: {
    marginTop: 10,
  },
  addPhotoButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 80,
    justifyContent: "center",
    marginRight: 10,
    width: 80,
  },
  photoCard: {
    borderRadius: 12,
    height: 80,
    marginRight: 10,
    overflow: "hidden",
    position: "relative",
    width: 80,
  },
  photoImage: {
    height: "100%",
    width: "100%",
  },
  removePhotoButton: {
    alignItems: "center",
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    top: 6,
    width: 20,
  },
  footer: {
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
});

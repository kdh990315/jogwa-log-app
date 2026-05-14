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
  FormProvider,
  useForm,
  useWatch,
} from "react-hook-form";
import {
  Alert,
  BackHandler,
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
import CatchDetailsStep from "@/components/catch-register/CatchDetailsStep";
import CatchFishingDatePickerModal from "@/components/catch-register/CatchFishingDatePickerModal";
import type { CatchFormFieldTheme } from "@/components/catch-register/CatchFormFields";
import CatchRegisterStepThree from "@/components/catch-register/CatchRegisterStepThree";
import CatchSpeciesPickerModal from "@/components/catch-register/CatchSpeciesPickerModal";
import CatchWaterTypeStep from "@/components/catch-register/CatchWaterTypeStep";
import { colors } from "@/constants";
import { analyticsEvents } from "@/constants/analytics";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useCatchRegisterFishingDate } from "@/hooks/use-catch-register-fishing-date";
import { useCatchRegisterLocation } from "@/hooks/use-catch-register-location";
import { useCatchRegisterSpeciesPicker } from "@/hooks/use-catch-register-species-picker";
import { useCatchRegisterPhotos } from "@/hooks/use-catch-register-photos";
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
  type CatchFormValues,
} from "@/utils/catch-register-form";
import {
  getSevenMulTideLabel,
  isValidFishingDateInput,
} from "@/utils/tide";
import { getUserErrorMessage } from "@/utils/user-error-message";

type CatchStep = 1 | 2 | 3;

interface CatchRegisterColors extends CatchFormFieldTheme {
  accentSoft: string;
  background: string;
}

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
  const handleAddPhotoPress = useCallback(() => {
    void handleAddPhoto();
  }, [handleAddPhoto]);
  const handleSearchLocationPress = useCallback(() => {
    void handleSearchLocation();
  }, [handleSearchLocation]);
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
              <CatchWaterTypeStep
                mutedTextColor={theme.mutedText}
                onSelectWaterType={handleSelectWaterType}
                surfaceColor={theme.surface}
                textColor={theme.text}
              />
            ) : null}

            {step === 2 ? (
              <CatchDetailsStep
                countInputRef={countInputRef}
                isSizeFieldEnabled={isSizeFieldEnabled}
                isTideFieldEnabled={isTideFieldEnabled}
                isWeatherSelectExpanded={isWeatherSelectExpanded}
                memoInputRef={memoInputRef}
                onOpenFishingDatePicker={handleOpenFishingDatePicker}
                onOpenSpeciesPicker={handleOpenSpeciesPicker}
                onOpenWeatherSelect={handleOpenWeatherSelect}
                onSelectWeather={handleSelectWeather}
                onToggleWeatherSelect={handleToggleWeatherSelect}
                sizeInputRef={sizeInputRef}
                theme={theme}
                waterType={formValues.waterType}
              />
            ) : null}

            {step === 3 ? (
              <CatchRegisterStepThree
                isSearchingLocation={isSearchingLocation}
                onAddPhoto={handleAddPhotoPress}
                onRemovePhoto={handleRemovePhoto}
                onSearchLocation={handleSearchLocationPress}
                onSelectCoordinate={handleSelectMapCoordinate}
                photos={formValues.photos}
                pointNameInputRef={pointNameInputRef}
                selectedCoordinate={selectedMapCoordinate}
                theme={theme}
              />
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

function getCatchRegisterColors(isDark: boolean): CatchRegisterColors {
  return {
    accent: colors.BLUE_600,
    accentSoft: colors.BLUE_100,
    background: isDark ? colors.DARK_BACKGROUND : colors.WHITE,
    border: isDark ? colors.DARK_BORDER : colors.GRAY_200,
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

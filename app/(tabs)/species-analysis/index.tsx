import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
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

import { logAnalyticsEvent } from "@/api/analytics";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import AppScreenHeader from "@/components/AppScreenHeader";
import CustomButton from "@/components/CustomButton";
import { colors } from "@/constants";
import { analyticsEvents } from "@/constants/analytics";
import { useDetectFishSpecies } from "@/hooks/queries/use-detect-fish-species";
import { useCurrentSpeciesRegulations } from "@/hooks/queries/use-species-regulations";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { SpeciesRegulation } from "@/types/species-regulation";
import { getUserErrorMessage } from "@/utils/user-error-message";

interface AnalysisResult {
  confidence: number;
  speciesId: number | null;
  species: string;
  description: string;
  predictionId: number | null;
}

interface SelectedAnalysisImage {
  fileSizeBytes?: number | null;
  heightPx?: number | null;
  mimeType?: string | null;
  uri: string;
  widthPx?: number | null;
}

const UPLOAD_BOX_HEIGHT = 320;
const AI_ANALYSIS_TIP_HIDDEN_UNTIL_KEY =
  "jogwa-log.ai-analysis-tip-hidden-until";
const goodExampleImage = require("../../../assets/images/good-img.png");
const badExampleImage = require("../../../assets/images/bad-img.png");

// REFACTOR: 권한 요청, 이미지 선택, 스캔 애니메이션, 결과 카드, 조과 등록 이동이 한 화면에 섞여 있다.
// 실제 AI 연동 전에 upload/analysis 상태를 hook으로 분리하고, tip/result 영역을 컴포넌트화해 두는 편이 이후 교체 비용이 낮다.
export default function SpeciesAnalysisScreen() {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const backgroundColor = isDark ? colors.DARK_BACKGROUND : colors.GRAY_200;
  const borderColor = isDark ? colors.DARK_BORDER : colors.GRAY_300;
  const cardColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_500;
  const primaryButtonBackground = isDark ? colors.WHITE : colors.GRAY_600;
  const primaryButtonPressed = isDark ? colors.GRAY_400 : colors.GRAY_500;
  const primaryButtonText = isDark ? colors.BLACK : colors.WHITE;
  const tipPrimaryButtonBackground = isDark ? colors.BLUE_700 : colors.BLUE_600;
  const tipPrimaryButtonPressed = isDark ? colors.BLUE_600 : colors.BLUE_700;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;

  const [isTipModalVisible, setIsTipModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] =
    useState<SelectedAnalysisImage | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const detectFishSpeciesMutation = useDetectFishSpecies();
  const {
    data: speciesRegulations = [],
    isLoading: isSpeciesRegulationsLoading,
  } = useCurrentSpeciesRegulations(analysisResult?.speciesId ?? null);

  useEffect(() => {
    let isMounted = true;

    async function showTipIfAvailable() {
      const hiddenUntil = await getAiAnalysisTipHiddenUntil().catch(() => null);

      if (!isMounted) {
        return;
      }

      if (!hiddenUntil || Date.now() >= hiddenUntil.getTime()) {
        setIsTipModalVisible(true);
      }
    }

    void showTipIfAvailable();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAnalyzing) {
      scanAnimation.stopAnimation();
      scanAnimation.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isAnalyzing, scanAnimation]);

  const scanTranslateY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, UPLOAD_BOX_HEIGHT - 2],
  });

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
    setAnalysisResult(null);
    setIsAnalyzing(false);
    void logAnalyticsEvent(analyticsEvents.aiSpeciesImageSelected, {
      has_image: true,
    });
  }

  function handleResetAI() {
    setAnalysisResult(null);
    setIsAnalyzing(false);
  }

  function handleAddToCatchLog() {
    if (!analysisResult) {
      router.push("/catch-register");
      return;
    }

    void logAnalyticsEvent(analyticsEvents.aiSpeciesApplyToLog, {
      species_id: analysisResult.speciesId,
    });
    router.push({
      pathname: "/catch-register",
      params: {
        prefillAiPredictionId: analysisResult.predictionId?.toString() ?? "",
        prefillSpeciesId: analysisResult.speciesId?.toString() ?? "",
        prefillSpeciesName: analysisResult.species,
      },
    });
  }

  function handleCloseTipModal() {
    setIsTipModalVisible(false);
  }

  async function handleHideTipToday() {
    setIsTipModalVisible(false);
    await setAiAnalysisTipHiddenUntil(getTomorrowStart());
  }

  async function runAIAnalysis() {
    if (!selectedImage) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    void logAnalyticsEvent(analyticsEvents.aiSpeciesStart);

    try {
      const result = await detectFishSpeciesMutation.mutateAsync({
        image: {
          fileSizeBytes: selectedImage.fileSizeBytes,
          heightPx: selectedImage.heightPx,
          localUri: selectedImage.uri,
          mimeType: selectedImage.mimeType,
          widthPx: selectedImage.widthPx,
        },
      });
      const topCandidate = result.candidates[0];

      if (!topCandidate) {
        Alert.alert(
          "분석 결과 없음",
          "사진에서 어종 후보를 찾지 못했습니다. 다른 사진으로 다시 시도해 주세요.",
        );
        return;
      }

      setAnalysisResult({
        confidence: topCandidate.confidence,
        description: topCandidate.reason,
        predictionId: result.predictionId,
        species: topCandidate.speciesName,
        speciesId: topCandidate.speciesId,
      });
      void logAnalyticsEvent(analyticsEvents.aiSpeciesDetectSuccess, {
        candidate_count: result.candidates.length,
        top_confidence: topCandidate.confidence,
        top_species_id: topCandidate.speciesId,
      });
    } catch (error) {
      void logAnalyticsEvent(analyticsEvents.aiSpeciesDetectFail, {
        error_code: "detect_failed",
      });
      Alert.alert("AI 분석 실패", getAiAnalysisErrorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={[styles.container, { backgroundColor }]}
    >
      <AppScreenHeader
        eyebrow="AI SPECIES CHECK"
        iconName="sparkles"
        title="어종분석"
      />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.uploadArea,
            {
              backgroundColor: cardColor,
              borderColor,
            },
          ]}
        >
          {!selectedImage ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconWrapper,
                  {
                    backgroundColor: isDark
                      ? colors.DARK_BACKGROUND
                      : colors.BLUE_100,
                  },
                ]}
              >
                <Ionicons
                  color={isDark ? colors.GRAY_400 : colors.BLUE_500}
                  name="image-outline"
                  size={28}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                사진을 업로드 해주세요
              </Text>
              <Text
                style={[styles.emptyDescription, { color: mutedTextColor }]}
              >
                앨범에서 선택하거나 촬영하세요
              </Text>
              <View style={styles.emptyActionGroup}>
                <CustomButton
                  backgroundColor={primaryButtonBackground}
                  borderColor={primaryButtonBackground}
                  label="촬영하기"
                  leftIcon={
                    <Ionicons
                      color={primaryButtonText}
                      name="camera-outline"
                      size={18}
                    />
                  }
                  onPress={handleTakePhoto}
                  pressedBackgroundColor={primaryButtonPressed}
                  textColor={primaryButtonText}
                />
                <CustomButton
                  backgroundColor={
                    isDark ? colors.DARK_BACKGROUND : colors.WHITE
                  }
                  borderColor={borderColor}
                  label="앨범에서 선택"
                  leftIcon={
                    <Ionicons
                      color={mutedTextColor}
                      name="images-outline"
                      size={18}
                    />
                  }
                  onPress={handlePickImageFromLibrary}
                  pressedBackgroundColor={
                    isDark ? colors.DARK_BORDER : colors.GRAY_200
                  }
                  textColor={mutedTextColor}
                />
              </View>
            </View>
          ) : (
            <View style={styles.previewWrapper}>
              <Image
                resizeMode="contain"
                source={{ uri: selectedImage.uri }}
                style={styles.previewImage}
              />

              {isAnalyzing ? (
                <>
                  <View style={styles.analysisOverlay}>
                    <ActivityIndicator color={colors.BLUE_600} size="large" />
                    <Text style={styles.analysisTitle}>
                      <Ionicons
                        color={colors.WHITE}
                        name="sparkles"
                        size={14}
                      />{" "}
                      AI 분석 중...
                    </Text>
                    <Text style={styles.analysisSubtitle}>
                      특징을 찾고 있어요
                    </Text>
                  </View>
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [{ translateY: scanTranslateY }],
                      },
                    ]}
                  />
                </>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.bottomArea}>
          {selectedImage && !isAnalyzing && !analysisResult ? (
            <View style={styles.selectedActions}>
              <View style={styles.actionRow}>
                <CustomButton
                  backgroundColor={
                    isDark ? colors.DARK_BACKGROUND : colors.WHITE
                  }
                  borderColor={borderColor}
                  containerStyle={styles.reselectButton}
                  label="다시 촬영"
                  leftIcon={
                    <Ionicons
                      color={mutedTextColor}
                      name="camera-outline"
                      size={16}
                    />
                  }
                  onPress={handleTakePhoto}
                  pressedBackgroundColor={
                    isDark ? colors.DARK_BORDER : colors.GRAY_200
                  }
                  textColor={mutedTextColor}
                />
                <CustomButton
                  backgroundColor={
                    isDark ? colors.DARK_BACKGROUND : colors.WHITE
                  }
                  borderColor={borderColor}
                  containerStyle={styles.reselectButton}
                  label="앨범"
                  leftIcon={
                    <Ionicons
                      color={mutedTextColor}
                      name="images-outline"
                      size={16}
                    />
                  }
                  onPress={handlePickImageFromLibrary}
                  pressedBackgroundColor={
                    isDark ? colors.DARK_BORDER : colors.GRAY_200
                  }
                  textColor={mutedTextColor}
                />
              </View>
              <CustomButton
                backgroundColor={colors.BLUE_600}
                borderColor={colors.BLUE_600}
                containerStyle={styles.analysisButton}
                label="어종 분석하기"
                leftIcon={
                  <Ionicons color={colors.WHITE} name="sparkles" size={16} />
                }
                onPress={runAIAnalysis}
                pressedBackgroundColor={colors.BLUE_700}
                textColor={colors.WHITE}
              />
            </View>
          ) : null}

          {analysisResult ? (
            <View
              style={[
                styles.resultCard,
                {
                  backgroundColor: cardColor,
                  borderColor,
                },
              ]}
            >
              <View style={styles.resultTopRow}>
                <View>
                  <View
                    style={[
                      styles.resultConfidenceBadge,
                      {
                        backgroundColor: colors.BLUE_100,
                      },
                    ]}
                  >
                    <Text style={styles.resultConfidenceText}>
                      일치율 {analysisResult.confidence}%
                    </Text>
                  </View>
                  <Text style={[styles.resultSpecies, { color: textColor }]}>
                    {analysisResult.species}
                  </Text>
                </View>

                <Pressable
                  onPress={handleResetAI}
                  style={({ pressed }) => [
                    styles.resultCloseButton,
                    { transform: [{ scale: pressed ? 0.94 : 1 }] },
                  ]}
                >
                  <Ionicons color={mutedTextColor} name="close" size={20} />
                </Pressable>
              </View>

              <Text
                style={[styles.resultDescription, { color: mutedTextColor }]}
              >
                {analysisResult.description}
              </Text>

              <View
                style={[
                  styles.regulationBox,
                  {
                    backgroundColor: isDark
                      ? colors.DARK_BACKGROUND
                      : colors.GRAY_100,
                  },
                ]}
              >
                <View style={styles.regulationHeader}>
                  <View
                    style={[
                      styles.regulationHeaderIcon,
                      {
                        backgroundColor: isDark
                          ? colors.DARK_SURFACE_MUTED
                          : colors.BLUE_100,
                      },
                    ]}
                  >
                    <Ionicons
                      color={colors.BLUE_600}
                      name="shield-checkmark-outline"
                      size={17}
                    />
                  </View>
                  <View style={styles.regulationHeaderText}>
                    <Text
                      style={[styles.regulationTitle, { color: textColor }]}
                    >
                      포획 기준
                    </Text>
                    <Text
                      style={[
                        styles.regulationDescription,
                        { color: mutedTextColor },
                      ]}
                    >
                      금어기와 금지체장·체중을 확인하세요.
                    </Text>
                  </View>
                </View>
                {isSpeciesRegulationsLoading ? (
                  <View style={styles.regulationStatusRow}>
                    <ActivityIndicator color={colors.BLUE_600} size="small" />
                    <Text
                      style={[
                        styles.regulationDescription,
                        { color: mutedTextColor },
                      ]}
                    >
                      기준 정보를 확인하는 중입니다.
                    </Text>
                  </View>
                ) : speciesRegulations.length > 0 ? (
                  <>
                    {speciesRegulations.map((regulation) => {
                      const regulationMeta =
                        getSpeciesRegulationMeta(regulation);
                      const regulationNote =
                        formatSpeciesRegulationNote(regulation);

                      return (
                        <View
                          key={regulation.id}
                          style={[
                            styles.regulationItem,
                            {
                              backgroundColor: isDark
                                ? colors.DARK_SURFACE
                                : colors.WHITE,
                              borderColor,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.regulationItemIcon,
                              {
                                backgroundColor: regulationMeta.backgroundColor,
                              },
                            ]}
                          >
                            <Ionicons
                              color={regulationMeta.color}
                              name={regulationMeta.iconName}
                              size={16}
                            />
                          </View>
                          <View style={styles.regulationItemContent}>
                            <Text
                              style={[
                                styles.regulationItemLabel,
                                { color: mutedTextColor },
                              ]}
                            >
                              {regulationMeta.label}
                            </Text>
                            <Text
                              style={[
                                styles.regulationItemValue,
                                { color: textColor },
                              ]}
                            >
                              {formatSpeciesRegulationValue(regulation)}
                            </Text>
                            {regulationNote ? (
                              <Text
                                style={[
                                  styles.regulationDescription,
                                  { color: mutedTextColor },
                                ]}
                              >
                                {regulationNote}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                    <View style={styles.regulationSourceRow}>
                      <Ionicons
                        color={mutedTextColor}
                        name="document-text-outline"
                        size={13}
                      />
                      <Text
                        style={[
                          styles.regulationSource,
                          { color: mutedTextColor },
                        ]}
                      >
                        {speciesRegulations[0]?.sourceTitle}
                      </Text>
                    </View>
                  </>
                ) : analysisResult.speciesId ? (
                  <View style={styles.regulationStatusRow}>
                    <Ionicons
                      color={mutedTextColor}
                      name="information-circle-outline"
                      size={18}
                    />
                    <Text
                      style={[
                        styles.regulationDescription,
                        { color: mutedTextColor },
                      ]}
                    >
                      등록된 금어기·금지체장 정보가 없습니다.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.regulationStatusRow}>
                    <Ionicons
                      color={mutedTextColor}
                      name="link-outline"
                      size={18}
                    />
                    <View style={styles.regulationHeaderText}>
                      <Text
                        style={[
                          styles.regulationDescription,
                          { color: mutedTextColor },
                        ]}
                      >
                        어종 DB와 매칭되지 않아 기준 정보를 불러오지 못했습니다.
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <CustomButton
                backgroundColor={primaryButtonBackground}
                borderColor={primaryButtonBackground}
                label="조과 기록에 추가하기"
                onPress={handleAddToCatchLog}
                pressedBackgroundColor={primaryButtonPressed}
                textColor={primaryButtonText}
              />
            </View>
          ) : null}

          {analysisResult ? (
            <AdBannerSlot
              accessibilityLabel="어종분석 결과 하단 광고 배너 영역"
              containerStyle={styles.analysisResultAdSlot}
              isDark={isDark}
            />
          ) : null}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={handleCloseTipModal}
        transparent
        visible={isTipModalVisible && !selectedImage}
      >
        <View style={styles.tipModalOverlay}>
          <Pressable
            accessibilityLabel="팁 닫기"
            onPress={handleCloseTipModal}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.tipSheet,
              {
                backgroundColor: cardColor,
                borderColor,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.tipSheetHandle} />
            <View style={styles.tipHeader}>
              <View
                style={[
                  styles.tipIconWrapper,
                  {
                    backgroundColor: isDark
                      ? colors.DARK_SURFACE_MUTED
                      : colors.BLUE_100,
                  },
                ]}
              >
                <Ionicons
                  color={colors.BLUE_600}
                  name="fish-outline"
                  size={22}
                />
              </View>
              <View style={styles.tipTextWrapper}>
                <Text style={[styles.tipTitle, { color: textColor }]}>
                  정확한 분석을 위한 사진
                </Text>
                <Text
                  style={[styles.tipDescription, { color: mutedTextColor }]}
                >
                  물고기 전체가 선명하게 나오면 AI가 더 안정적으로 판별합니다.
                </Text>
              </View>
            </View>

            <View style={styles.tipList}>
              <TipListItem
                color={mutedTextColor}
                iconColor={colors.GREEN_500}
                text="물고기 머리부터 꼬리까지 한 화면에 담기"
              />
              <TipListItem
                color={mutedTextColor}
                iconColor={colors.GREEN_500}
                text="흔들림 없이 밝은 곳에서 촬영하기"
              />
              <TipListItem
                color={mutedTextColor}
                iconColor={colors.GREEN_500}
                text="물고기의 특징이 잘 나타나는 구도로 촬영하기"
              />
              <TipListItem
                color={mutedTextColor}
                iconColor={colors.RED_500}
                iconName="close-circle"
                text="어종을 위에서 찍어 체형이 잘 보이지 않는 사진 피하기"
              />
              <TipListItem
                color={mutedTextColor}
                iconColor={colors.RED_500}
                iconName="close-circle"
                text="흔들려 윤곽과 무늬가 흐릿한 사진 피하기"
              />
              <TipListItem
                color={mutedTextColor}
                iconColor={colors.RED_500}
                iconName="close-circle"
                text="바늘, 집게, 그물 등 이물질이 많이 가린 사진 피하기"
              />
            </View>

            <View style={styles.exampleContainer}>
              <View
                style={[
                  styles.exampleOuterCard,
                  {
                    backgroundColor: isDark
                      ? colors.DARK_BACKGROUND
                      : colors.GRAY_100,
                    borderColor,
                  },
                ]}
              >
                <View style={styles.examplePreview}>
                  <Image
                    resizeMode="cover"
                    source={goodExampleImage}
                    style={styles.goodExampleImage}
                  />
                  <View style={[styles.exampleMark, styles.goodMark]}>
                    <Ionicons color={colors.WHITE} name="checkmark" size={12} />
                  </View>
                </View>
                <Text
                  style={[styles.exampleCaption, { color: mutedTextColor }]}
                >
                  좋은 예시
                </Text>
              </View>
              <View
                style={[
                  styles.exampleOuterCard,
                  {
                    backgroundColor: isDark
                      ? colors.DARK_BACKGROUND
                      : colors.GRAY_100,
                    borderColor,
                  },
                ]}
              >
                <View style={styles.examplePreview}>
                  <Image
                    resizeMode="cover"
                    source={badExampleImage}
                    style={styles.badExampleFish}
                  />
                  <View style={[styles.exampleMark, styles.badMark]}>
                    <Ionicons color={colors.WHITE} name="close" size={12} />
                  </View>
                </View>
                <Text
                  style={[styles.exampleCaption, { color: mutedTextColor }]}
                >
                  나쁜 예시
                </Text>
              </View>
            </View>

            <View style={styles.tipActionRow}>
              <CustomButton
                backgroundColor="transparent"
                borderColor="transparent"
                containerStyle={styles.tipActionButton}
                label="이번만 닫기"
                onPress={handleCloseTipModal}
                pressedBackgroundColor={
                  isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100
                }
                textColor={mutedTextColor}
              />
              <CustomButton
                backgroundColor={tipPrimaryButtonBackground}
                borderColor={tipPrimaryButtonBackground}
                containerStyle={styles.tipActionButton}
                label="오늘은 숨기기"
                leftIcon={
                  <Ionicons
                    color={colors.WHITE}
                    name="moon-outline"
                    size={17}
                  />
                }
                onPress={handleHideTipToday}
                pressedBackgroundColor={tipPrimaryButtonPressed}
                textColor={colors.WHITE}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface TipListItemProps {
  color: string;
  iconColor: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
}

function TipListItem({
  color,
  iconColor,
  iconName = "checkmark-circle",
  text,
}: TipListItemProps) {
  return (
    <View style={styles.tipListItem}>
      <Ionicons color={iconColor} name={iconName} size={16} />
      <Text style={[styles.tipListText, { color }]}>{text}</Text>
    </View>
  );
}

interface SpeciesRegulationMeta {
  backgroundColor: string;
  color: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}

function getSpeciesRegulationMeta(
  regulation: SpeciesRegulation,
): SpeciesRegulationMeta {
  if (regulation.regulationKind === "closed_season") {
    return {
      backgroundColor: colors.RED_100,
      color: colors.RED_500,
      iconName: "calendar-outline",
      label: "금어기",
    };
  }

  if (
    regulation.regulationKind === "minimum_length" ||
    regulation.regulationKind === "prohibited_length_range"
  ) {
    return {
      backgroundColor: colors.BLUE_100,
      color: colors.BLUE_600,
      iconName: "resize-outline",
      label: "금지체장",
    };
  }

  return {
    backgroundColor: colors.ORANGE_100,
    color: colors.ORANGE_500,
    iconName: "scale-outline",
    label: "금지체중",
  };
}

function formatSpeciesRegulationValue(regulation: SpeciesRegulation) {
  if (regulation.regulationKind === "closed_season") {
    return formatRegulationPeriod(regulation);
  }

  if (regulation.regulationKind === "minimum_length") {
    return `${formatNumberValue(regulation.minLengthCm)}cm 이하`;
  }

  if (regulation.regulationKind === "prohibited_length_range") {
    return `${formatNumberValue(
      regulation.prohibitedLengthMinCm,
    )}cm 이상 ${formatNumberValue(regulation.prohibitedLengthMaxCm)}cm 이하`;
  }

  return `${formatNumberValue(regulation.minWeightG)}g 이하`;
}

function formatSpeciesRegulationNote(regulation: SpeciesRegulation) {
  return [
    regulation.measurementBasis
      ? `계측 기준: ${regulation.measurementBasis}`
      : null,
    regulation.regionNote,
    regulation.methodNote,
    regulation.exceptionNote,
  ]
    .filter(Boolean)
    .join(" · ");
}

function formatRegulationPeriod(regulation: SpeciesRegulation) {
  if (
    !regulation.periodStartMonth ||
    !regulation.periodStartDay ||
    !regulation.periodEndMonth ||
    !regulation.periodEndDay
  ) {
    return "기간 미입력";
  }

  return `${regulation.periodStartMonth}.${regulation.periodStartDay}~${regulation.periodEndMonth}.${regulation.periodEndDay}`;
}

function formatNumberValue(value: number | null) {
  if (typeof value !== "number") {
    return "-";
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function getTomorrowStart() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

async function getAiAnalysisTipHiddenUntil(): Promise<Date | null> {
  const value = await getStoredValue(AI_ANALYSIS_TIP_HIDDEN_UNTIL_KEY);
  const hiddenUntilTimestamp = value ? Date.parse(value) : Number.NaN;

  if (!Number.isFinite(hiddenUntilTimestamp)) {
    return null;
  }

  return new Date(hiddenUntilTimestamp);
}

function setAiAnalysisTipHiddenUntil(hiddenUntil: Date) {
  return setStoredValue(
    AI_ANALYSIS_TIP_HIDDEN_UNTIL_KEY,
    hiddenUntil.toISOString(),
  );
}

function getStoredValue(key: string) {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

function setStoredValue(key: string, value: string) {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(key, value);
    return;
  }

  return SecureStore.setItemAsync(key, value);
}

function getAiAnalysisErrorMessage(error: unknown) {
  return getUserErrorMessage(
    error,
    "어종을 분석하지 못했습니다. 사진과 네트워크 상태를 확인한 뒤 다시 시도해 주세요.",
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  tipModalOverlay: {
    flex: 1,
    backgroundColor: colors.OVERLAY_40,
    justifyContent: "flex-end",
  },
  tipSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tipSheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.GRAY_300,
    marginBottom: 18,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  tipIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTextWrapper: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  tipDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
  tipList: {
    gap: 8,
    marginBottom: 14,
  },
  tipListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipListText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  exampleContainer: {
    flexDirection: "row",
    gap: 10,
  },
  exampleOuterCard: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  examplePreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    marginBottom: 6,
  },
  goodExampleImage: {
    width: "100%",
    height: "100%",
  },
  exampleMark: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  goodMark: {
    backgroundColor: colors.GREEN_500,
  },
  badMark: {
    backgroundColor: colors.RED_500,
  },
  badExampleFish: {
    position: "absolute",
    right: -10,
    bottom: -12,
    transform: [{ rotate: "12deg" }],
  },
  exampleCaption: {
    fontSize: 11,
    fontWeight: "700",
  },
  tipActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  tipActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
  },
  uploadArea: {
    height: UPLOAD_BOX_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 20,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  emptyIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 13,
    marginBottom: 20,
  },
  emptyActionGroup: {
    gap: 10,
    width: "100%",
  },
  previewWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  analysisOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.OVERLAY_60,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  analysisTitle: {
    marginTop: 12,
    color: colors.WHITE,
    fontSize: 15,
    fontWeight: "600",
  },
  analysisSubtitle: {
    marginTop: 4,
    color: colors.GRAY_300,
    fontSize: 12,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    width: "100%",
    height: 2,
    backgroundColor: colors.BLUE_500,
    boxShadow: "0 0 8px rgba(59, 130, 246, 0.9)",
    elevation: 6,
  },
  bottomArea: {
    flex: 1,
    minHeight: 100,
  },
  analysisResultAdSlot: {
    marginTop: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  reselectButton: {
    flex: 1,
  },
  analysisButton: {
    width: "100%",
  },
  selectedActions: {
    gap: 10,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  resultTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  resultConfidenceBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  resultConfidenceText: {
    color: colors.BLUE_600,
    fontSize: 11,
    fontWeight: "700",
  },
  resultSpecies: {
    fontSize: 20,
    fontWeight: "700",
  },
  resultCloseButton: {
    padding: 4,
  },
  resultDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  regulationBox: {
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
    padding: 14,
  },
  regulationDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  regulationHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  regulationHeaderIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  regulationHeaderText: {
    flex: 1,
  },
  regulationItem: {
    alignItems: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  regulationItemContent: {
    flex: 1,
    gap: 3,
  },
  regulationItemIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  regulationItemLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  regulationItemValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  regulationSource: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  regulationSourceRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 5,
  },
  regulationStatusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  regulationTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
});

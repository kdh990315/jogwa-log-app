import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { logAnalyticsEvent } from "@/api/analytics";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import AppScreenHeader from "@/components/AppScreenHeader";
import AnalysisImagePicker, {
  ANALYSIS_UPLOAD_BOX_HEIGHT,
} from "@/components/species-analysis/AnalysisImagePicker";
import AnalysisResultCard, {
  type AnalysisResult,
} from "@/components/species-analysis/AnalysisResultCard";
import AnalysisTipModal from "@/components/species-analysis/AnalysisTipModal";
import { colors } from "@/constants";
import { analyticsEvents } from "@/constants/analytics";
import { useDetectFishSpecies } from "@/hooks/queries/use-detect-fish-species";
import { useCurrentSpeciesRegulations } from "@/hooks/queries/use-species-regulations";
import { useAiAnalysisTip } from "@/hooks/use-ai-analysis-tip";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSpeciesAnalysisImage } from "@/hooks/use-species-analysis-image";
import { getUserErrorMessage } from "@/utils/user-error-message";

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

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const detectFishSpeciesMutation = useDetectFishSpecies();
  const {
    data: speciesRegulations = [],
    isLoading: isSpeciesRegulationsLoading,
  } = useCurrentSpeciesRegulations(analysisResult?.speciesId ?? null);
  const {
    handleCloseTipModal,
    handleHideTipToday,
    isTipModalVisible,
  } = useAiAnalysisTip();
  const handleImageSelected = useCallback(() => {
    setAnalysisResult(null);
    setIsAnalyzing(false);
  }, []);
  const {
    handlePickImageFromLibrary,
    handleTakePhoto,
    selectedImage,
  } = useSpeciesAnalysisImage({
    onImageSelected: handleImageSelected,
  });

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
    outputRange: [0, ANALYSIS_UPLOAD_BOX_HEIGHT - 2],
  });

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
        <AnalysisImagePicker
          backgroundColor={isDark ? colors.DARK_BACKGROUND : colors.WHITE}
          borderColor={borderColor}
          cardColor={cardColor}
          isAnalyzing={isAnalyzing}
          isDark={isDark}
          mutedTextColor={mutedTextColor}
          onPickImageFromLibrary={handlePickImageFromLibrary}
          onRunAnalysis={runAIAnalysis}
          onTakePhoto={handleTakePhoto}
          primaryButtonBackground={primaryButtonBackground}
          primaryButtonPressed={primaryButtonPressed}
          primaryButtonText={primaryButtonText}
          scanTranslateY={scanTranslateY}
          selectedImage={selectedImage}
          showsAnalysisActions={!analysisResult}
          textColor={textColor}
        />

        <View style={styles.bottomArea}>
          {analysisResult ? (
            <AnalysisResultCard
              borderColor={borderColor}
              cardColor={cardColor}
              isDark={isDark}
              isSpeciesRegulationsLoading={isSpeciesRegulationsLoading}
              mutedTextColor={mutedTextColor}
              onAddToCatchLog={handleAddToCatchLog}
              onReset={handleResetAI}
              primaryButtonBackground={primaryButtonBackground}
              primaryButtonPressed={primaryButtonPressed}
              primaryButtonText={primaryButtonText}
              result={analysisResult}
              speciesRegulations={speciesRegulations}
              textColor={textColor}
            />
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

      <AnalysisTipModal
        borderColor={borderColor}
        cardColor={cardColor}
        isDark={isDark}
        mutedTextColor={mutedTextColor}
        onClose={handleCloseTipModal}
        onHideToday={() => {
          void handleHideTipToday();
        }}
        paddingBottom={Math.max(insets.bottom, 16)}
        textColor={textColor}
        tipPrimaryButtonBackground={tipPrimaryButtonBackground}
        tipPrimaryButtonPressed={tipPrimaryButtonPressed}
        visible={isTipModalVisible && !selectedImage}
      />
    </SafeAreaView>
  );
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
  bottomArea: {
    flex: 1,
    minHeight: 100,
  },
  analysisResultAdSlot: {
    marginTop: 18,
  },
});

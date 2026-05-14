import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import { colors } from "@/constants";
import type { SelectedAnalysisImage } from "@/hooks/use-species-analysis-image";

export const ANALYSIS_UPLOAD_BOX_HEIGHT = 320;

interface AnalysisImagePickerProps {
  backgroundColor: string;
  borderColor: string;
  cardColor: string;
  isAnalyzing: boolean;
  isDark: boolean;
  mutedTextColor: string;
  onPickImageFromLibrary: () => void;
  onRunAnalysis: () => void;
  onTakePhoto: () => void;
  primaryButtonBackground: string;
  primaryButtonPressed: string;
  primaryButtonText: string;
  scanTranslateY: Animated.AnimatedInterpolation<number>;
  selectedImage: SelectedAnalysisImage | null;
  showsAnalysisActions: boolean;
  textColor: string;
}

export default function AnalysisImagePicker({
  backgroundColor,
  borderColor,
  cardColor,
  isAnalyzing,
  isDark,
  mutedTextColor,
  onPickImageFromLibrary,
  onRunAnalysis,
  onTakePhoto,
  primaryButtonBackground,
  primaryButtonPressed,
  primaryButtonText,
  scanTranslateY,
  selectedImage,
  showsAnalysisActions,
  textColor,
}: AnalysisImagePickerProps) {
  return (
    <>
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
            <Text style={[styles.emptyDescription, { color: mutedTextColor }]}>
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
                onPress={onTakePhoto}
                pressedBackgroundColor={primaryButtonPressed}
                textColor={primaryButtonText}
              />
              <CustomButton
                backgroundColor={isDark ? colors.DARK_BACKGROUND : colors.WHITE}
                borderColor={borderColor}
                label="앨범에서 선택"
                leftIcon={
                  <Ionicons
                    color={mutedTextColor}
                    name="images-outline"
                    size={18}
                  />
                }
                onPress={onPickImageFromLibrary}
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
                    <Ionicons color={colors.WHITE} name="sparkles" size={14} />{" "}
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

      {selectedImage && !isAnalyzing && showsAnalysisActions ? (
        <View style={styles.selectedActions}>
          <View style={styles.actionRow}>
            <CustomButton
              backgroundColor={backgroundColor}
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
              onPress={onTakePhoto}
              pressedBackgroundColor={
                isDark ? colors.DARK_BORDER : colors.GRAY_200
              }
              textColor={mutedTextColor}
            />
            <CustomButton
              backgroundColor={backgroundColor}
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
              onPress={onPickImageFromLibrary}
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
            onPress={onRunAnalysis}
            pressedBackgroundColor={colors.BLUE_700}
            textColor={colors.WHITE}
          />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  uploadArea: {
    alignItems: "center",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    height: ANALYSIS_UPLOAD_BOX_HEIGHT,
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  emptyState: {
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  emptyIconWrapper: {
    alignItems: "center",
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    marginBottom: 12,
    width: 56,
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
    height: "100%",
    width: "100%",
  },
  analysisOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: colors.OVERLAY_60,
    justifyContent: "center",
    zIndex: 10,
  },
  analysisTitle: {
    color: colors.WHITE,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
  },
  analysisSubtitle: {
    color: colors.GRAY_300,
    fontSize: 12,
    marginTop: 4,
  },
  scanLine: {
    backgroundColor: colors.BLUE_500,
    boxShadow: "0 0 8px rgba(59, 130, 246, 0.9)",
    elevation: 6,
    height: 2,
    left: 0,
    position: "absolute",
    width: "100%",
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
});

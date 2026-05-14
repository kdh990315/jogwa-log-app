import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import { colors } from "@/constants";

const goodExampleImage = require("../../assets/images/good-img.png");
const badExampleImage = require("../../assets/images/bad-img.png");

interface AnalysisTipModalProps {
  borderColor: string;
  cardColor: string;
  isDark: boolean;
  mutedTextColor: string;
  onClose: () => void;
  onHideToday: () => void;
  paddingBottom: number;
  textColor: string;
  tipPrimaryButtonBackground: string;
  tipPrimaryButtonPressed: string;
  visible: boolean;
}

export default function AnalysisTipModal({
  borderColor,
  cardColor,
  isDark,
  mutedTextColor,
  onClose,
  onHideToday,
  paddingBottom,
  textColor,
  tipPrimaryButtonBackground,
  tipPrimaryButtonPressed,
  visible,
}: AnalysisTipModalProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.tipModalOverlay}>
        <Pressable
          accessibilityLabel="팁 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.tipSheet,
            {
              backgroundColor: cardColor,
              borderColor,
              paddingBottom,
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
              <Ionicons color={colors.BLUE_600} name="fish-outline" size={22} />
            </View>
            <View style={styles.tipTextWrapper}>
              <Text style={[styles.tipTitle, { color: textColor }]}>
                정확한 분석을 위한 사진
              </Text>
              <Text style={[styles.tipDescription, { color: mutedTextColor }]}>
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
              <Text style={[styles.exampleCaption, { color: mutedTextColor }]}>
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
              <Text style={[styles.exampleCaption, { color: mutedTextColor }]}>
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
              onPress={onClose}
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
                <Ionicons color={colors.WHITE} name="moon-outline" size={17} />
              }
              onPress={onHideToday}
              pressedBackgroundColor={tipPrimaryButtonPressed}
              textColor={colors.WHITE}
            />
          </View>
        </View>
      </View>
    </Modal>
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

const styles = StyleSheet.create({
  tipModalOverlay: {
    backgroundColor: colors.OVERLAY_40,
    flex: 1,
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
    backgroundColor: colors.GRAY_300,
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 44,
  },
  tipHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  tipIconWrapper: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  tipTextWrapper: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  tipDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  tipList: {
    gap: 8,
    marginBottom: 14,
  },
  tipListItem: {
    alignItems: "flex-start",
    flexDirection: "row",
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
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 8,
  },
  examplePreview: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 6,
    justifyContent: "center",
    marginBottom: 6,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  goodExampleImage: {
    height: "100%",
    width: "100%",
  },
  exampleMark: {
    alignItems: "center",
    borderRadius: 999,
    height: 16,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    top: 4,
    width: 16,
  },
  goodMark: {
    backgroundColor: colors.GREEN_500,
  },
  badMark: {
    backgroundColor: colors.RED_500,
  },
  badExampleFish: {
    bottom: -12,
    position: "absolute",
    right: -10,
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
    borderRadius: 999,
    flex: 1,
    minHeight: 46,
  },
});

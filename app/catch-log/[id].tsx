import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  formatCatchSize,
} from "@/constants/catch-log";
import { colors } from "@/constants";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import CatchLocationMap from "@/components/map/CatchLocationMap";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useCatchLog } from "@/hooks/queries/use-catch-logs";
import { useDeleteCatchLog } from "@/hooks/queries/use-delete-catch-log";
import {
  formatCatchLogDateLabel,
  getCatchLogMemoLabel,
  getCatchLogPointLabel,
  getCatchLogTideLabel,
  getCatchLogWeatherLabel,
} from "@/utils/catch-log-display";
import { getUserErrorMessage } from "@/utils/user-error-message";

const { width } = Dimensions.get("window");
const ACTION_SHEET_HIDDEN_TRANSLATE_Y = 320;
const DETAIL_AD_SLOT_HEIGHT = 90;

// REFACTOR: 상세 본문, 이미지 모달, 액션시트, invalid state가 한 파일에 함께 있어 화면 책임이 크다.
// 특히 하드코딩된 색상까지 많아서 theme 적용과 섹션 분리(ImageCarousel, DetailInfoGrid, ActionSheet)가 다음 단계로 필요하다.
export default function CatchDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { id } = useLocalSearchParams<Record<string, string | string[]>>();
  const backgroundColor = isDark ? colors.DARK_BACKGROUND : colors.WHITE;
  const borderColor = isDark ? colors.DARK_BORDER : colors.GRAY_200;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.GRAY_500;
  const subTextColor = colors.GRAY_400;
  const surfaceColor = isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100;
  const textColor = isDark ? colors.WHITE : colors.GRAY_600;

  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isActionSheetVisible, setActionSheetVisible] = useState(false);
  const [isPointMapGestureEnabled, setPointMapGestureEnabled] = useState(false);
  const actionSheetProgress = useRef(new Animated.Value(0)).current;
  const deleteCatchLogMutation = useDeleteCatchLog();

  const catchLogId = Number(normalizeParam(id));
  const isValidCatchLogId = Number.isFinite(catchLogId);
  const isDeleting = deleteCatchLogMutation.isPending;
  const {
    data: catchData,
    error: catchLogError,
    isLoading: isCatchLogLoading,
  } = useCatchLog(catchLogId, isValidCatchLogId);
  const actionSheetTranslateY = actionSheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [ACTION_SHEET_HIDDEN_TRANSLATE_Y, 0],
  });

  useEffect(() => {
    if (!isActionSheetVisible) {
      actionSheetProgress.setValue(0);
      return;
    }

    Animated.timing(actionSheetProgress, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [actionSheetProgress, isActionSheetVisible]);

  if (!isValidCatchLogId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="뒤로가기"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons color={textColor} name="chevron-back" size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            조과 상세
          </Text>
          <View style={styles.moreButtonPlaceholder} />
        </View>

        <View style={styles.invalidContainer}>
          <Text style={[styles.invalidTitle, { color: textColor }]}>
            기록을 찾을 수 없습니다
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.invalidButton,
              { backgroundColor: surfaceColor },
            ]}
          >
            <Text style={[styles.invalidButtonText, { color: textColor }]}>
              이전으로
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isCatchLogLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="뒤로가기"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons color={textColor} name="chevron-back" size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            조과 상세
          </Text>
          <View style={styles.moreButtonPlaceholder} />
        </View>

        <View style={styles.invalidContainer}>
          <ActivityIndicator color={colors.BLUE_600} />
          <Text style={[styles.invalidDescription, { color: mutedTextColor }]}>
            조과 기록을 불러오는 중입니다
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!catchData) {
    const errorMessage = getUserErrorMessage(
      catchLogError,
      "요청한 조과 기록을 찾을 수 없습니다.",
    );

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="뒤로가기"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons color={textColor} name="chevron-back" size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            조과 상세
          </Text>
          <View style={styles.moreButtonPlaceholder} />
        </View>

        <View style={styles.invalidContainer}>
          <Text style={[styles.invalidTitle, { color: textColor }]}>
            기록을 찾을 수 없습니다
          </Text>
          <Text style={[styles.invalidDescription, { color: mutedTextColor }]}>
            {errorMessage}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.invalidButton, { backgroundColor: surfaceColor }]}
          >
            <Text style={[styles.invalidButtonText, { color: textColor }]}>
              이전으로
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sizeLabel = formatCatchSize(catchData.sizeCm);
  const dateLabel = formatCatchLogDateLabel(catchData.fishingDate);
  const memoLabel = getCatchLogMemoLabel(catchData.memo);
  const pointLabel = getCatchLogPointLabel(catchData.pointName);
  const tideLabel = getCatchLogTideLabel(catchData.tide, catchData.type);
  const weatherLabel = getCatchLogWeatherLabel(catchData.weather);
  const hasImages = !catchData.isKkwang && catchData.images.length > 0;
  const selectedMapCoordinate =
    typeof catchData.latitude === "number" &&
    typeof catchData.longitude === "number"
      ? {
          latitude: catchData.latitude,
          longitude: catchData.longitude,
        }
      : null;
  const modalCloseTop = Math.max(insets.top + 12, 60);
  const bottomSheetPaddingBottom = Math.max(insets.bottom, 40);
  const fixedAdPaddingBottom = Math.max(insets.bottom, 12);
  const fixedAdContentPaddingBottom =
    DETAIL_AD_SLOT_HEIGHT + fixedAdPaddingBottom + 46;

  function handleImagePress(imageUri: string) {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  }

  function handlePressEdit() {
    setActionSheetVisible(false);
    router.push({
      params: { editId: String(catchLogId) },
      pathname: "/catch-register",
    });
  }

  function handlePressDelete() {
    setActionSheetVisible(false);
    Alert.alert(
      "조과 삭제",
      "이 조과 기록과 사진을 삭제할까요? 삭제한 기록은 되돌릴 수 없습니다.",
      [
        { style: "cancel", text: "취소" },
        {
          onPress: () => {
            void handleConfirmDelete();
          },
          style: "destructive",
          text: "삭제",
        },
      ],
    );
  }

  async function handleConfirmDelete() {
    try {
      await deleteCatchLogMutation.mutateAsync(catchLogId);
      Alert.alert("삭제 완료", "조과 기록을 삭제했습니다.", [
        {
          onPress: () => router.replace("/catch-log"),
          text: "확인",
        },
      ]);
    } catch (error) {
      Alert.alert("삭제 실패", getCatchLogDeleteErrorMessage(error));
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="뒤로가기"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons color={textColor} name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          조과 상세
        </Text>
        <TouchableOpacity
          disabled={isDeleting}
          onPress={() => setActionSheetVisible(true)}
          style={styles.moreButton}
        >
          <Text style={[styles.moreButtonText, { color: textColor }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: fixedAdContentPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text
            style={[
              styles.speciesTitle,
              { color: catchData.isKkwang ? subTextColor : textColor },
            ]}
          >
            {catchData.isKkwang ? "꽝" : catchData.speciesName}
          </Text>
          <View style={styles.badgeRow}>
            {!catchData.isKkwang && sizeLabel ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.BLUE_100 },
                ]}
              >
                <Text
                  style={[
                    styles.activeBadgeText,
                    { color: colors.BLUE_600 },
                  ]}
                >
                  {sizeLabel}
                </Text>
              </View>
            ) : null}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: catchData.isKkwang
                    ? surfaceColor
                    : colors.BLUE_100,
                },
              ]}
            >
              <Text
                style={[
                  catchData.isKkwang
                    ? styles.kkwangBadgeText
                    : styles.activeBadgeText,
                  {
                    color: catchData.isKkwang
                      ? subTextColor
                      : colors.BLUE_600,
                  },
                ]}
              >
                {catchData.isKkwang ? "0마리" : `${catchData.count}마리`}
              </Text>
            </View>
          </View>
          <Text style={[styles.dateText, { color: subTextColor }]}>
            {dateLabel}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>
              물때
            </Text>
            <Text style={[styles.infoValue, { color: textColor }]}>
              {tideLabel}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>
              날씨
            </Text>
            <Text style={[styles.infoValue, { color: textColor }]}>
              {weatherLabel}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>
              포인트
            </Text>
            <Text style={[styles.infoValue, { color: textColor }]}>
              {pointLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          포인트 위치
        </Text>
        {selectedMapCoordinate ? (
          <CatchLocationMap
            gesturePrompt="터치해서 지도 움직이기"
            gesturesEnabled={isPointMapGestureEnabled}
            onDisableGestures={() => setPointMapGestureEnabled(false)}
            onEnableGestures={() => setPointMapGestureEnabled(true)}
            selectedCoordinate={selectedMapCoordinate}
            style={styles.pointMap}
          />
        ) : (
          <View
            style={[styles.pointMapEmpty, { backgroundColor: surfaceColor }]}
          >
            <Text style={[styles.pointMapEmptyText, { color: mutedTextColor }]}>
              저장된 위치 좌표가 없습니다.
            </Text>
          </View>
        )}

        {hasImages ? (
          <>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              현장 사진
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photoScroll}
              snapToInterval={width * 0.8 + 12}
              decelerationRate="fast"
            >
              {catchData.images.map((imageUri, index) => (
                <TouchableOpacity
                  key={`${imageUri}-${index}`}
                  onPress={() => handleImagePress(imageUri)}
                >
                  <Image
                    resizeMode="contain"
                    source={{ uri: imageUri }}
                    style={styles.carouselImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          조과 메모
        </Text>
        <View style={[styles.memoBox, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.memoText, { color: mutedTextColor }]}>
            {memoLabel}
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.fixedAdContainer,
          {
            backgroundColor,
            borderTopColor: borderColor,
            paddingBottom: fixedAdPaddingBottom,
          },
        ]}
      >
        <AdBannerSlot
          accessibilityLabel="조과 상세 하단 고정 광고 배너 영역"
          isDark={isDark}
        />
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
        transparent
        visible={isImageModalVisible}
      >
        <View style={styles.modalBackground}>
          <TouchableOpacity
            accessibilityLabel="닫기"
            onPress={() => setImageModalVisible(false)}
            style={[styles.modalCloseButton, { top: modalCloseTop }]}
          >
            <Ionicons color={colors.WHITE} name="close" size={26} />
          </TouchableOpacity>
          {selectedImage ? (
            <Image
              resizeMode="contain"
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
            />
          ) : null}
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setActionSheetVisible(false)}
        transparent
        visible={isActionSheetVisible}
      >
        <View style={styles.bottomSheetBackground}>
          <TouchableOpacity
            onPress={() => setActionSheetVisible(false)}
            style={styles.bottomSheetOverlay}
          />
          <Animated.View
            style={[
              styles.bottomSheetContainer,
              {
                backgroundColor,
                paddingBottom: bottomSheetPaddingBottom,
                transform: [{ translateY: actionSheetTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              disabled={isDeleting}
              onPress={handlePressEdit}
              style={styles.actionButton}
            >
              <Text style={[styles.actionText, { color: textColor }]}>
                수정하기
              </Text>
            </TouchableOpacity>
            <View
              style={[
                styles.bottomSheetDivider,
                { backgroundColor: borderColor },
              ]}
            />
            <TouchableOpacity
              disabled={isDeleting}
              onPress={handlePressDelete}
              style={styles.actionButton}
            >
              <Text style={[styles.actionText, styles.dangerText]}>
                {isDeleting ? "삭제 중..." : "삭제하기"}
              </Text>
            </TouchableOpacity>
            <View
              style={[
                styles.bottomSheetDivider,
                { backgroundColor: borderColor },
              ]}
            />
            <TouchableOpacity
              disabled={isDeleting}
              onPress={() => setActionSheetVisible(false)}
              style={[
                styles.cancelButton,
                { backgroundColor: surfaceColor },
              ]}
            >
              <Text style={[styles.cancelText, { color: mutedTextColor }]}>
                취소
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getCatchLogDeleteErrorMessage(error: unknown) {
  return getUserErrorMessage(
    error,
    "조과 기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  moreButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  moreButtonText: { fontSize: 24, fontWeight: "700" },
  moreButtonPlaceholder: { width: 40 },
  scrollContent: { paddingHorizontal: 24 },
  fixedAdContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  titleSection: { marginVertical: 14 },
  speciesTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
  },
  kkwangText: {},
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activeBadge: {},
  activeBadgeText: { fontSize: 14, fontWeight: "700" },
  kkwangBadge: {},
  kkwangBadgeText: { fontSize: 14, fontWeight: "700" },
  dateText: { fontSize: 14 },
  divider: { height: 1, marginVertical: 14 },
  infoGrid: { flexDirection: "row", justifyContent: "space-between" },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 13, marginBottom: 6 },
  infoValue: { fontSize: 16, fontWeight: "600" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 10,
  },
  pointMap: {
    height: 250,
    marginBottom: 16,
  },
  pointMapEmpty: {
    height: 180,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  pointMapEmptyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  photoScroll: { marginBottom: 16 },
  carouselImage: {
    width: width * 0.8,
    height: 220,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: colors.GRAY_300,
  },
  memoBox: {
    padding: 20,
    borderRadius: 16,
    minHeight: 100,
  },
  memoText: { fontSize: 15, lineHeight: 24 },
  modalBackground: {
    flex: 1,
    backgroundColor: colors.OVERLAY_90,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    alignItems: "center",
    backgroundColor: colors.OVERLAY_40,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    width: 40,
    zIndex: 10,
  },
  fullScreenImage: { width: "100%", height: "80%" },
  bottomSheetBackground: {
    flex: 1,
    backgroundColor: colors.OVERLAY_40,
    justifyContent: "flex-end",
  },
  bottomSheetOverlay: { flex: 1 },
  bottomSheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
  },
  actionButton: { paddingVertical: 20, alignItems: "center" },
  actionText: { fontSize: 18, fontWeight: "500" },
  dangerText: { color: colors.RED_500 },
  bottomSheetDivider: { height: 1 },
  cancelButton: {
    paddingVertical: 20,
    alignItems: "center",
  },
  cancelText: { fontSize: 18, fontWeight: "700" },
  invalidContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  invalidTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  invalidDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  invalidButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  invalidButtonText: { fontSize: 14, fontWeight: "600" },
});

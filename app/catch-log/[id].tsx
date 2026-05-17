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
  const backgroundColor = isDark ? colors.DARK_BACKGROUND_DEEP : colors.WHITE;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const cardColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const primaryColor = colors.BRAND_PRIMARY;
  const softPrimaryColor = isDark
    ? colors.DARK_SURFACE_MUTED
    : colors.BRAND_PRIMARY_SOFT;
  const subTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const surfaceColor = isDark ? colors.DARK_SURFACE_MUTED : colors.SURFACE_SOFT;
  const textColor = isDark ? colors.WHITE : colors.INK;

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
            style={[
              styles.iconButton,
              { backgroundColor: surfaceColor, borderColor },
            ]}
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
            style={[
              styles.iconButton,
              { backgroundColor: surfaceColor, borderColor },
            ]}
          >
            <Ionicons color={textColor} name="chevron-back" size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            조과 상세
          </Text>
          <View style={styles.moreButtonPlaceholder} />
        </View>

        <View style={styles.invalidContainer}>
          <ActivityIndicator color={primaryColor} />
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
            style={[
              styles.iconButton,
              { backgroundColor: surfaceColor, borderColor },
            ]}
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
  const waterTypeLabel = catchData.type === "salt" ? "바다" : "민물";
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
          style={[
            styles.iconButton,
            { backgroundColor: surfaceColor, borderColor },
          ]}
        >
          <Ionicons color={textColor} name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          조과 상세
        </Text>
        <TouchableOpacity
          disabled={isDeleting}
          onPress={() => setActionSheetVisible(true)}
          style={[
            styles.iconButton,
            { backgroundColor: surfaceColor, borderColor },
          ]}
        >
          <Ionicons color={textColor} name="ellipsis-horizontal" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: fixedAdContentPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <View
                style={[
                  styles.waterTypePill,
                  { backgroundColor: softPrimaryColor },
                ]}
              >
                <Text style={[styles.waterTypeText, { color: primaryColor }]}>
                  {waterTypeLabel} 조과
                </Text>
              </View>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                numberOfLines={2}
                style={[
                  styles.speciesTitle,
                  { color: catchData.isKkwang ? subTextColor : textColor },
                ]}
              >
                {catchData.isKkwang ? "꽝" : catchData.speciesName}
              </Text>
              <Text style={[styles.dateText, { color: subTextColor }]}>
                {dateLabel}
              </Text>
            </View>
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: catchData.isKkwang
                    ? surfaceColor
                    : colors.BRAND_PRIMARY,
                },
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  { color: catchData.isKkwang ? subTextColor : colors.WHITE },
                ]}
              >
                {catchData.isKkwang ? "0마리" : `${catchData.count}마리`}
              </Text>
            </View>
          </View>

          {!catchData.isKkwang && sizeLabel ? (
            <View style={[styles.heroMetricRow, { borderTopColor: borderColor }]}>
              <Ionicons color={primaryColor} name="resize-outline" size={18} />
              <Text style={[styles.heroMetricText, { color: textColor }]}>
                최대 길이 {sizeLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.infoGrid}>
          <DetailInfoItem
            borderColor={borderColor}
            iconName="water-outline"
            isDark={isDark}
            label="물때"
            value={tideLabel}
          />
          <DetailInfoItem
            borderColor={borderColor}
            iconName="partly-sunny-outline"
            isDark={isDark}
            label="날씨"
            value={weatherLabel}
          />
          <DetailInfoItem
            borderColor={borderColor}
            iconName="location-outline"
            isDark={isDark}
            label="포인트"
            value={pointLabel}
          />
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <SectionHeader
            iconName="map-outline"
            isDark={isDark}
            title="포인트 위치"
          />
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
        </View>

        {hasImages ? (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <SectionHeader
              iconName="images-outline"
              isDark={isDark}
              title="현장 사진"
            />
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
          </View>
        ) : null}

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <SectionHeader
            iconName="document-text-outline"
            isDark={isDark}
            title="조과 메모"
          />
          <View style={[styles.memoBox, { backgroundColor: surfaceColor }]}>
            <Text style={[styles.memoText, { color: mutedTextColor }]}>
              {memoLabel}
            </Text>
          </View>
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
                borderColor,
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

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface DetailInfoItemProps {
  borderColor: string;
  iconName: IoniconName;
  isDark: boolean;
  label: string;
  value: string;
}

function DetailInfoItem({
  borderColor,
  iconName,
  isDark,
  label,
  value,
}: DetailInfoItemProps) {
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const surfaceColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <View
      style={[
        styles.infoItem,
        { backgroundColor: surfaceColor, borderColor },
      ]}
    >
      <View
        style={[
          styles.infoIcon,
          {
            backgroundColor: isDark
              ? colors.DARK_SURFACE_MUTED
              : colors.BRAND_PRIMARY_SOFT,
          },
        ]}
      >
        <Ionicons color={colors.BRAND_PRIMARY} name={iconName} size={17} />
      </View>
      <Text style={[styles.infoLabel, { color: mutedTextColor }]}>
        {label}
      </Text>
      <Text
        minimumFontScale={0.88}
        numberOfLines={2}
        style={[styles.infoValue, { color: textColor }]}
      >
        {value}
      </Text>
    </View>
  );
}

interface SectionHeaderProps {
  iconName: IoniconName;
  isDark: boolean;
  title: string;
}

function SectionHeader({ iconName, isDark, title }: SectionHeaderProps) {
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          {
            backgroundColor: isDark
              ? colors.DARK_SURFACE_MUTED
              : colors.BRAND_PRIMARY_SOFT,
          },
        ]}
      >
        <Ionicons color={colors.BRAND_PRIMARY} name={iconName} size={17} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.sectionTitle, { color: textColor }]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0,
  },
  moreButtonPlaceholder: { width: 34 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  fixedAdContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  waterTypePill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  waterTypeText: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  speciesTitle: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 24,
  },
  dateText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  countBadge: {
    flexShrink: 0,
    minWidth: 58,
    minHeight: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  heroMetricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopColor: colors.HAIRLINE_SOFT,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  heroMetricText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  infoItem: {
    flex: 1,
    minHeight: 78,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 13,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
  },
  pointMap: {
    height: 190,
    borderRadius: 12,
    overflow: "hidden",
  },
  pointMapEmpty: {
    height: 120,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  pointMapEmptyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  photoScroll: {
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  carouselImage: {
    width: width * 0.72,
    height: 170,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: colors.GRAY_300,
  },
  memoBox: {
    padding: 12,
    borderRadius: 12,
    minHeight: 72,
  },
  memoText: { fontSize: 12, lineHeight: 19 },
  modalBackground: {
    flex: 1,
    backgroundColor: colors.OVERLAY_90,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    alignItems: "center",
    backgroundColor: colors.OVERLAY_40,
    borderRadius: 12,
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
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    paddingTop: 10,
  },
  actionButton: { paddingVertical: 16, alignItems: "center" },
  actionText: { fontSize: 15, fontWeight: "600" },
  dangerText: { color: colors.RED_500 },
  bottomSheetDivider: { height: 1 },
  cancelButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "700" },
  invalidContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  invalidTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,
  },
  invalidDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  invalidButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  invalidButtonText: { fontSize: 12, fontWeight: "600" },
});

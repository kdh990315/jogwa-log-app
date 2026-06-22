import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AdBannerSlot from "@/components/ads/AdBannerSlot";
import CatchDetailActionSheet from "@/components/catch-log/catch-log-detail/CatchDetailActionSheet";
import CatchDetailHeroCard from "@/components/catch-log/catch-log-detail/CatchDetailHeroCard";
import CatchDetailInfoGrid from "@/components/catch-log/catch-log-detail/CatchDetailInfoGrid";
import CatchDetailLocationSection from "@/components/catch-log/catch-log-detail/CatchDetailLocationSection";
import CatchDetailMemoSection from "@/components/catch-log/catch-log-detail/CatchDetailMemoSection";
import CatchDetailPhotoGallery from "@/components/catch-log/catch-log-detail/CatchDetailPhotoGallery";
import CatchDetailStatus from "@/components/catch-log/catch-log-detail/CatchDetailStatus";
import { colors } from "@/constants";
import { useCatchLog } from "@/hooks/queries/use-catch-logs";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useCatchDetailActions } from "@/hooks/use-catch-detail-actions";
import { getUserErrorMessage } from "@/utils/user-error-message";

// 하단 고정 광고와 본문이 겹치지 않도록 확보할 광고 슬롯 높이다.
const DETAIL_AD_SLOT_HEIGHT = 90;

const CatchDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  // 동적 라우트의 조과 기록 ID를 읽는다. Expo Router 특성상 배열일 수도 있다.
  const { id } = useLocalSearchParams<Record<string, string | string[]>>();

  // 아래 색상들은 라이트/다크 모드에 맞춰 화면 각 영역에 공통으로 사용한다.
  const backgroundColor = isDark ? colors.DARK_BACKGROUND_DEEP : colors.WHITE;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const surfaceColor = isDark ? colors.DARK_SURFACE_MUTED : colors.SURFACE_SOFT;
  const textColor = isDark ? colors.WHITE : colors.INK;

  // URL 파라미터를 조회에 사용할 숫자 ID로 변환하고 유효성을 검사한다.
  const rawId = Array.isArray(id) ? id[0] : id;
  const catchLogId = Number(rawId);
  const isValidCatchLogId = Number.isFinite(catchLogId);
  const { actionSheetProps, openActionSheet } =
    useCatchDetailActions(catchLogId);
  // 유효한 ID일 때만 서버에서 조과 상세 데이터를 조회한다.
  const {
    data: catchData,
    error: catchLogError,
    isLoading: isCatchLogLoading,
  } = useCatchLog(catchLogId, isValidCatchLogId);
  // URL의 ID가 숫자가 아니면 서버 요청 없이 잘못된 접근 상태를 표시한다.
  if (!isValidCatchLogId) {
    return (
      <CatchDetailStatus
        onBack={() => router.back()}
        status="invalid"
      />
    );
  }

  // 상세 데이터를 처음 불러오는 동안 로딩 상태를 표시한다.
  if (isCatchLogLoading) {
    return <CatchDetailStatus status="loading" />;
  }

  // 조회가 끝났지만 데이터가 없으면 조회 오류 또는 존재하지 않는 기록 상태를 표시한다.
  if (!catchData) {
    const errorMessage = getUserErrorMessage(
      catchLogError,
      "요청한 조과 기록을 찾을 수 없습니다.",
    );

    return (
      <CatchDetailStatus
        message={errorMessage}
        onBack={() => router.back()}
        status="error"
      />
    );
  }

  // 기기 안전 영역을 반영해 모달, 액션 시트, 고정 광고의 여백을 계산한다.
  const fixedAdPaddingBottom = Math.max(insets.bottom, 12);
  const fixedAdContentPaddingBottom =
    DETAIL_AD_SLOT_HEIGHT + fixedAdPaddingBottom + 46;

  const renderHeaderRight = () => (
    <TouchableOpacity
      accessibilityLabel="조과 상세 메뉴 열기"
      disabled={actionSheetProps.isDeleting}
      onPress={openActionSheet}
      style={[
        styles.headerActionButton,
        { backgroundColor: surfaceColor, borderColor },
      ]}
    >
      <Ionicons color={textColor} name="ellipsis-horizontal" size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safeArea, { backgroundColor }]}>
      <Stack.Screen options={{ headerRight: renderHeaderRight }} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: fixedAdContentPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <CatchDetailHeroCard catchLog={catchData} />
        <CatchDetailInfoGrid catchLog={catchData} />

        <CatchDetailLocationSection
          latitude={catchData.latitude}
          longitude={catchData.longitude}
        />

        <CatchDetailPhotoGallery
          images={catchData.isKkwang ? [] : catchData.images}
        />

        <CatchDetailMemoSection memo={catchData.memo} />
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

      <CatchDetailActionSheet {...actionSheetProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerActionButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
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
});

export default CatchDetailScreen;

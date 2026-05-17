import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppStateView from "@/components/AppStateView";
import RecentCatchCard from "@/components/catch-log/RecentCatchCard";
import { formatCatchSize } from "@/constants/catch-log";
import { colors } from "@/constants";
import { getFishCollectionImageSource } from "@/constants/fish-collection-images";
import { useSpeciesDexCatchLogs } from "@/hooks/queries/use-catch-logs";
import { useFishSpecies } from "@/hooks/queries/use-fish-species";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { FishSpecies } from "@/types/fish-species";
import {
  buildCaughtSpeciesStats,
  getCatchLogsForFishSpecies,
  getCaughtStatsForFishSpecies,
} from "@/utils/species-dex";
import { getUserErrorMessage } from "@/utils/user-error-message";

export default function DictionaryDetailScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { id } = useLocalSearchParams<Record<string, string | string[]>>();
  const speciesId = Number(normalizeParam(id));
  const isValidSpeciesId = Number.isFinite(speciesId);
  const palette = getPalette(isDark);
  const {
    data: fishSpeciesList = [],
    error: fishSpeciesError,
    isLoading: isFishSpeciesLoading,
  } = useFishSpecies();
  const {
    data: catchLogItems = [],
    error: catchLogError,
    isLoading: isCatchLogsLoading,
  } = useSpeciesDexCatchLogs();

  const selectedSpecies = useMemo(
    () => fishSpeciesList.find((fish) => fish.id === speciesId) ?? null,
    [fishSpeciesList, speciesId],
  );
  const caughtSpeciesStats = useMemo(
    () => buildCaughtSpeciesStats(catchLogItems),
    [catchLogItems],
  );
  const selectedStats = selectedSpecies
    ? getCaughtStatsForFishSpecies(caughtSpeciesStats, selectedSpecies)
    : null;
  const recentCatchLogs = useMemo(
    () =>
      selectedSpecies
        ? getCatchLogsForFishSpecies(catchLogItems, selectedSpecies).slice(0, 5)
        : [],
    [catchLogItems, selectedSpecies],
  );
  const isLoading = isFishSpeciesLoading || isCatchLogsLoading;
  const isUnlocked = (selectedStats?.recordCount ?? 0) > 0;
  const errorMessage = fishSpeciesError
    ? getUserErrorMessage(
        fishSpeciesError,
        "어종 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      )
    : catchLogError
      ? getUserErrorMessage(
          catchLogError,
          "내 조과 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        )
      : null;

  function handlePressBack() {
    router.back();
  }

  function handlePressCatchLog(catchLogId: number) {
    router.push(`/catch-log/${catchLogId}`);
  }

  function handlePressRegister(species: FishSpecies) {
    router.push({
      params: { prefillSpeciesName: species.name },
      pathname: "/catch-register",
    });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: palette.background,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity
          accessibilityLabel="뒤로가기"
          onPress={handlePressBack}
          style={styles.headerIconButton}
        >
          <Ionicons color={palette.text} name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>도감 상세</Text>
        <View style={styles.headerIconPlaceholder} />
      </View>

      {isLoading ? (
        <AppStateView
          description="도감 정보를 불러오는 중입니다"
          isLoading
          mutedTextColor={palette.mutedText}
          style={styles.stateView}
          textColor={palette.text}
        />
      ) : !isValidSpeciesId || errorMessage || !selectedSpecies ? (
        <AppStateView
          description={errorMessage ?? "요청한 도감 항목이 없거나 삭제되었습니다."}
          mutedTextColor={palette.mutedText}
          style={styles.stateView}
          textColor={palette.text}
          title="어종을 찾을 수 없어요"
        >
          <TouchableOpacity
            onPress={handlePressBack}
            style={[styles.stateButton, { backgroundColor: palette.surface }]}
          >
            <Text style={[styles.stateButtonText, { color: palette.text }]}>
              이전으로
            </Text>
          </TouchableOpacity>
        </AppStateView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View
              style={[
                styles.imageFrame,
                {
                  backgroundColor: palette.imageSurface,
                  borderColor: palette.imageBorder,
                },
              ]}
            >
              <Image
                blurRadius={isUnlocked ? 0 : 5}
                source={getFishCollectionImageSource(selectedSpecies.id)}
                style={[
                  styles.fishImage,
                  !isUnlocked && styles.lockedFishImage,
                ]}
              />
              {!isUnlocked ? (
                <View style={styles.lockOverlay}>
                  <View
                    style={[
                      styles.lockIcon,
                      { backgroundColor: palette.overlaySurface },
                    ]}
                  >
                    <Ionicons color={colors.WHITE} name="lock-closed" size={22} />
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.titleGroup}>
              <Text style={[styles.speciesName, { color: palette.text }]}>
                {selectedSpecies.name}
              </Text>
              <Text style={[styles.speciesMeta, { color: palette.mutedText }]}>
                {getWaterTypeLabel(selectedSpecies)} · #{selectedSpecies.id}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatBox
              label="기록"
              palette={palette}
              value={`${selectedStats?.recordCount ?? 0}회`}
            />
            <StatBox
              label="마릿수"
              palette={palette}
              value={`${selectedStats?.totalCatchCount ?? 0}마리`}
            />
            <StatBox
              label="최대 사이즈"
              palette={palette}
              value={formatCatchSize(selectedStats?.maxSizeCm ?? null) ?? "-"}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              최근 조과
            </Text>
          </View>

          {recentCatchLogs.length > 0 ? (
            <View style={styles.recentList}>
              {recentCatchLogs.map((catchItem) => (
                <RecentCatchCard
                  catchItem={catchItem}
                  colors={{
                    accentText: colors.BRAND_PRIMARY,
                    badgeBackground: palette.badgeBackground,
                    badgeText: palette.mutedText,
                    cardBackground: palette.background,
                    cardBorder: palette.border,
                    chevron: palette.mutedText,
                    metaText: palette.mutedText,
                    primaryText: palette.text,
                  }}
                  key={catchItem.id}
                  onPress={() => handlePressCatchLog(catchItem.id)}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyBox, { borderColor: palette.border }]}>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>
                아직 잡은 기록이 없어요
              </Text>
              <Text style={[styles.emptyDescription, { color: palette.mutedText }]}>
                조과를 등록하면 이 어종의 도감이 해금됩니다.
              </Text>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => handlePressRegister(selectedSpecies)}
                style={styles.registerButton}
              >
                <Ionicons color={colors.WHITE} name="add" size={18} />
                <Text style={styles.registerButtonText}>조과 등록</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface StatBoxProps {
  label: string;
  palette: ReturnType<typeof getPalette>;
  value: string;
}

function StatBox({ label, palette, value }: StatBoxProps) {
  return (
    <View
      style={[
        styles.statBox,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.statValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.mutedText }]}>{label}</Text>
    </View>
  );
}

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getWaterTypeLabel(fishSpecies: FishSpecies) {
  return fishSpecies.waterType === "freshwater" ? "민물" : "바다";
}

function getPalette(isDark: boolean) {
  return {
    background: isDark ? colors.DARK_BACKGROUND : colors.WHITE,
    badgeBackground: isDark ? colors.DARK_SURFACE_MUTED : colors.BRAND_PRIMARY_SOFT,
    border: isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT,
    imageBorder: isDark ? colors.DARK_SURFACE_ELEVATED : colors.HAIRLINE_SOFT,
    imageSurface: isDark ? colors.DARK_SURFACE_MUTED : colors.SURFACE_SOFT,
    mutedText: isDark ? colors.GRAY_400 : colors.MUTED_TEXT,
    overlaySurface: colors.OVERLAY_60,
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
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  headerIconButton: {
    alignItems: "center",
    borderRadius: 10,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  headerIconPlaceholder: {
    height: 34,
    width: 34,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  stateView: {
    flex: 1,
  },
  stateButton: {
    borderRadius: 10,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stateButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 10,
  },
  imageFrame: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    maxWidth: 210,
    overflow: "hidden",
    width: "58%",
  },
  fishImage: {
    height: "100%",
    width: "100%",
  },
  lockedFishImage: {
    opacity: 0.28,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  titleGroup: {
    alignItems: "center",
    marginTop: 12,
  },
  speciesName: {
    fontSize: 19,
    fontWeight: "900",
  },
  speciesMeta: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  statBox: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  sectionHeader: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  recentList: {
    gap: 8,
    marginTop: 8,
  },
  emptyBox: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 4,
    textAlign: "center",
  },
  registerButton: {
    alignItems: "center",
    backgroundColor: colors.BRAND_PRIMARY,
    borderRadius: 10,
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  registerButtonText: {
    color: colors.WHITE,
    fontSize: 12,
    fontWeight: "900",
  },
});

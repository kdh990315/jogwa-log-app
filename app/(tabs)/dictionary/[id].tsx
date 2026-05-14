import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
        <View style={styles.stateContainer}>
          <ActivityIndicator color={colors.BLUE_600} />
          <Text style={[styles.stateDescription, { color: palette.mutedText }]}>
            도감 정보를 불러오는 중입니다
          </Text>
        </View>
      ) : !isValidSpeciesId || errorMessage || !selectedSpecies ? (
        <View style={styles.stateContainer}>
          <Text style={[styles.stateTitle, { color: palette.text }]}>
            어종을 찾을 수 없어요
          </Text>
          <Text style={[styles.stateDescription, { color: palette.mutedText }]}>
            {errorMessage ?? "요청한 도감 항목이 없거나 삭제되었습니다."}
          </Text>
          <TouchableOpacity
            onPress={handlePressBack}
            style={[styles.stateButton, { backgroundColor: palette.surface }]}
          >
            <Text style={[styles.stateButtonText, { color: palette.text }]}>
              이전으로
            </Text>
          </TouchableOpacity>
        </View>
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
                    accentText: colors.BLUE_600,
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
    badgeBackground: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100,
    border: isDark ? colors.DARK_BORDER : colors.GRAY_200,
    imageBorder: isDark ? colors.DARK_SURFACE_ELEVATED : colors.GRAY_300,
    imageSurface: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100,
    mutedText: isDark ? colors.GRAY_400 : colors.GRAY_500,
    overlaySurface: colors.OVERLAY_60,
    surface: isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100,
    text: isDark ? colors.WHITE : colors.GRAY_600,
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
    paddingVertical: 12,
  },
  headerIconButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerIconPlaceholder: {
    height: 40,
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  stateContainer: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  stateDescription: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
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
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 14,
  },
  imageFrame: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    maxWidth: 280,
    overflow: "hidden",
    width: "76%",
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
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  titleGroup: {
    alignItems: "center",
    marginTop: 18,
  },
  speciesName: {
    fontSize: 28,
    fontWeight: "900",
  },
  speciesMeta: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  statBox: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  sectionHeader: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  recentList: {
    gap: 10,
    marginTop: 12,
  },
  emptyBox: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  registerButton: {
    alignItems: "center",
    backgroundColor: colors.BLUE_600,
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  registerButtonText: {
    color: colors.WHITE,
    fontSize: 14,
    fontWeight: "900",
  },
});

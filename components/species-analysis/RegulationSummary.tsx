import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "@/constants";
import type { SpeciesRegulation } from "@/types/species-regulation";

interface RegulationSummaryProps {
  borderColor: string;
  isDark: boolean;
  isLoading: boolean;
  mutedTextColor: string;
  regulations: SpeciesRegulation[];
  speciesId: number | null;
  textColor: string;
}

interface SpeciesRegulationMeta {
  backgroundColor: string;
  color: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}

export default function RegulationSummary({
  borderColor,
  isDark,
  isLoading,
  mutedTextColor,
  regulations,
  speciesId,
  textColor,
}: RegulationSummaryProps) {
  return (
    <View
      style={[
        styles.regulationBox,
        {
          backgroundColor: isDark ? colors.DARK_BACKGROUND : colors.GRAY_100,
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
          <Text style={[styles.regulationTitle, { color: textColor }]}>
            포획 기준
          </Text>
          <Text
            style={[styles.regulationDescription, { color: mutedTextColor }]}
          >
            금어기와 금지체장·체중을 확인하세요.
          </Text>
        </View>
      </View>
      {isLoading ? (
        <View style={styles.regulationStatusRow}>
          <ActivityIndicator color={colors.BLUE_600} size="small" />
          <Text
            style={[styles.regulationDescription, { color: mutedTextColor }]}
          >
            기준 정보를 확인하는 중입니다.
          </Text>
        </View>
      ) : regulations.length > 0 ? (
        <>
          {regulations.map((regulation) => {
            const regulationMeta = getSpeciesRegulationMeta(regulation);
            const regulationNote = formatSpeciesRegulationNote(regulation);

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
            <Text style={[styles.regulationSource, { color: mutedTextColor }]}>
              {regulations[0]?.sourceTitle}
            </Text>
          </View>
        </>
      ) : speciesId ? (
        <View style={styles.regulationStatusRow}>
          <Ionicons
            color={mutedTextColor}
            name="information-circle-outline"
            size={18}
          />
          <Text
            style={[styles.regulationDescription, { color: mutedTextColor }]}
          >
            등록된 금어기·금지체장 정보가 없습니다.
          </Text>
        </View>
      ) : (
        <View style={styles.regulationStatusRow}>
          <Ionicons color={mutedTextColor} name="link-outline" size={18} />
          <View style={styles.regulationHeaderText}>
            <Text
              style={[styles.regulationDescription, { color: mutedTextColor }]}
            >
              어종 DB와 매칭되지 않아 기준 정보를 불러오지 못했습니다.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
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

const styles = StyleSheet.create({
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

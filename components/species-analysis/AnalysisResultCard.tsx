import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import RegulationSummary from "@/components/species-analysis/RegulationSummary";
import { colors } from "@/constants";
import type { SpeciesRegulation } from "@/types/species-regulation";

export interface AnalysisResult {
  confidence: number;
  description: string;
  predictionId: number | null;
  species: string;
  speciesId: number | null;
}

interface AnalysisResultCardProps {
  borderColor: string;
  cardColor: string;
  isDark: boolean;
  isSpeciesRegulationsLoading: boolean;
  mutedTextColor: string;
  onAddToCatchLog: () => void;
  onReset: () => void;
  primaryButtonBackground: string;
  primaryButtonPressed: string;
  primaryButtonText: string;
  result: AnalysisResult;
  speciesRegulations: SpeciesRegulation[];
  textColor: string;
}

export default function AnalysisResultCard({
  borderColor,
  cardColor,
  isDark,
  isSpeciesRegulationsLoading,
  mutedTextColor,
  onAddToCatchLog,
  onReset,
  primaryButtonBackground,
  primaryButtonPressed,
  primaryButtonText,
  result,
  speciesRegulations,
  textColor,
}: AnalysisResultCardProps) {
  return (
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
              일치율 {result.confidence}%
            </Text>
          </View>
          <Text style={[styles.resultSpecies, { color: textColor }]}>
            {result.species}
          </Text>
        </View>

        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            styles.resultCloseButton,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Ionicons color={mutedTextColor} name="close" size={20} />
        </Pressable>
      </View>

      <Text style={[styles.resultDescription, { color: mutedTextColor }]}>
        {result.description}
      </Text>

      <RegulationSummary
        borderColor={borderColor}
        isDark={isDark}
        isLoading={isSpeciesRegulationsLoading}
        mutedTextColor={mutedTextColor}
        regulations={speciesRegulations}
        speciesId={result.speciesId}
        textColor={textColor}
      />

      <CustomButton
        backgroundColor={primaryButtonBackground}
        borderColor={primaryButtonBackground}
        label="조과 기록에 추가하기"
        onPress={onAddToCatchLog}
        pressedBackgroundColor={primaryButtonPressed}
        textColor={primaryButtonText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  resultTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resultConfidenceBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
});

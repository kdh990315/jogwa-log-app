import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { CatchLogWaterType } from "@/types/catch-log";

interface CatchWaterTypeStepProps {
  mutedTextColor: string;
  onSelectWaterType: (waterType: CatchLogWaterType) => void;
  surfaceColor: string;
  textColor: string;
}

export default function CatchWaterTypeStep({
  mutedTextColor,
  onSelectWaterType,
  surfaceColor,
  textColor,
}: CatchWaterTypeStepProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: textColor }]}>
        오늘 어떤 낚시를{"\n"}다녀오셨나요?
      </Text>
      <View style={styles.segmentContainer}>
        <SegmentButton
          iconName="water-outline"
          label="바다 낚시"
          mutedTextColor={mutedTextColor}
          onPress={() => onSelectWaterType("saltwater")}
          surfaceColor={surfaceColor}
          textColor={textColor}
        />
        <SegmentButton
          iconName="leaf-outline"
          label="민물 낚시"
          mutedTextColor={mutedTextColor}
          onPress={() => onSelectWaterType("freshwater")}
          surfaceColor={surfaceColor}
          textColor={textColor}
        />
      </View>
    </View>
  );
}

interface SegmentButtonProps {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  mutedTextColor: string;
  onPress: () => void;
  surfaceColor: string;
  textColor: string;
}

function SegmentButton({
  iconName,
  label,
  mutedTextColor,
  onPress,
  surfaceColor,
  textColor,
}: SegmentButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        {
          backgroundColor: surfaceColor,
          borderColor: "transparent",
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.segmentContent}>
        <Ionicons color={mutedTextColor} name={iconName} size={20} />
        <Text style={[styles.segmentText, { color: textColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
    marginTop: 4,
  },
  segmentContainer: {
    flexDirection: "column",
    gap: 10,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 18,
  },
  segmentContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

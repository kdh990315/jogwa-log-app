import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type TextInput,
} from "react-native";

import type { CatchFormFieldTheme } from "@/components/catch-register/CatchFormFields";
import CatchPhotoSection from "@/components/catch-register/CatchPhotoSection";
import CatchPointSection from "@/components/catch-register/CatchPointSection";
import type { MapCoordinate } from "@/components/map/CatchLocationMap";
import type { SelectedCatchPhoto } from "@/utils/catch-register-form";

interface CatchRegisterStepThreeProps {
  isSearchingLocation: boolean;
  onAddPhoto: () => void;
  onRemovePhoto: (photoId: string) => void;
  onSearchLocation: () => void;
  onSelectCoordinate: (coordinate: MapCoordinate) => void;
  photos: SelectedCatchPhoto[];
  pointNameInputRef: React.RefObject<TextInput | null>;
  selectedCoordinate: MapCoordinate | null;
  theme: CatchFormFieldTheme;
}

export default function CatchRegisterStepThree({
  isSearchingLocation,
  onAddPhoto,
  onRemovePhoto,
  onSearchLocation,
  onSelectCoordinate,
  photos,
  pointNameInputRef,
  selectedCoordinate,
  theme,
}: CatchRegisterStepThreeProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        포인트와 사진을 남겨주세요
      </Text>

      <CatchPhotoSection
        backgroundColor={theme.surface}
        mutedTextColor={theme.mutedText}
        onAddPhoto={onAddPhoto}
        onRemovePhoto={onRemovePhoto}
        photos={photos}
        textColor={theme.text}
      />

      <CatchPointSection
        accentColor={theme.accent}
        borderColor={theme.border}
        inputRef={pointNameInputRef}
        isSearchingLocation={isSearchingLocation}
        mutedTextColor={theme.mutedText}
        onSearchLocation={onSearchLocation}
        onSelectCoordinate={onSelectCoordinate}
        selectedCoordinate={selectedCoordinate}
        subTextColor={theme.subText}
        surfaceColor={theme.surface}
        textColor={theme.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 30,
    marginTop: 10,
  },
});

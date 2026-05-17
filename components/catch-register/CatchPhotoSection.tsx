import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MAX_CATCH_PHOTO_COUNT } from "@/hooks/use-catch-register-photos";
import type { SelectedCatchPhoto } from "@/utils/catch-register-form";

interface CatchPhotoSectionProps {
  backgroundColor: string;
  mutedTextColor: string;
  onAddPhoto: () => void;
  onRemovePhoto: (photoId: string) => void;
  photos: SelectedCatchPhoto[];
  textColor: string;
}

export default function CatchPhotoSection({
  backgroundColor,
  mutedTextColor,
  onAddPhoto,
  onRemovePhoto,
  photos,
  textColor,
}: CatchPhotoSectionProps) {
  return (
    <>
      <Text style={[styles.inputLabel, { color: mutedTextColor }]}>
        현장 사진 (최대 3장)
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.photoScroll}
      >
        {photos.length < MAX_CATCH_PHOTO_COUNT ? (
          <Pressable
            accessibilityLabel="현장 사진 추가"
            accessibilityRole="button"
            onPress={onAddPhoto}
            style={({ pressed }) => [
              styles.addPhotoButton,
              {
                backgroundColor,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Ionicons color={mutedTextColor} name="add" size={28} />
          </Pressable>
        ) : null}

        {photos.map((photo) => (
          <View key={photo.id} style={styles.photoCard}>
            <Image
              resizeMode="contain"
              source={{ uri: photo.uri }}
              style={styles.photoImage}
            />
            <Pressable
              accessibilityLabel="사진 삭제"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => onRemovePhoto(photo.id)}
              style={({ pressed }) => [
                styles.removePhotoButton,
                {
                  backgroundColor,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <Ionicons color={textColor} name="close" size={14} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  photoScroll: {
    marginTop: 6,
  },
  addPhotoButton: {
    alignItems: "center",
    borderRadius: 10,
    height: 64,
    justifyContent: "center",
    marginRight: 8,
    width: 64,
  },
  photoCard: {
    borderRadius: 10,
    height: 64,
    marginRight: 8,
    overflow: "hidden",
    position: "relative",
    width: 64,
  },
  photoImage: {
    height: "100%",
    width: "100%",
  },
  removePhotoButton: {
    alignItems: "center",
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    position: "absolute",
    right: 5,
    top: 5,
    width: 18,
  },
});

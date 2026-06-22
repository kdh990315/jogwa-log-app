import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

const { width } = Dimensions.get("window");

interface CatchDetailPhotoGalleryProps {
  images: string[];
}

const CatchDetailPhotoGallery = ({ images }: CatchDetailPhotoGalleryProps) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const cardColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const textColor = isDark ? colors.WHITE : colors.INK;
  const sectionIconColor = isDark
    ? colors.DARK_SURFACE_MUTED
    : colors.BRAND_PRIMARY_SOFT;
  const modalCloseTop = Math.max(insets.top + 12, 60);

  const handleImagePress = (imageUri: string) => {
    setSelectedImage(imageUri);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: cardColor, borderColor },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: sectionIconColor },
            ]}
          >
            <Ionicons
              color={colors.BRAND_PRIMARY}
              name="images-outline"
              size={17}
            />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.sectionTitle, { color: textColor }]}
          >
            현장 사진
          </Text>
        </View>

        <ScrollView
          decelerationRate="fast"
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.8 + 12}
          style={styles.photoScroll}
        >
          {images.map((imageUri, index) => (
            <TouchableOpacity
              accessibilityLabel={`조과 사진 ${index + 1} 확대`}
              accessibilityRole="button"
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

      <Modal
        animationType="fade"
        onRequestClose={handleCloseModal}
        transparent
        visible={selectedImage !== null}
      >
        <View style={styles.modalBackground}>
          <TouchableOpacity
            accessibilityLabel="닫기"
            onPress={handleCloseModal}
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
    </>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  sectionIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
  },
  photoScroll: {
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  carouselImage: {
    backgroundColor: colors.GRAY_300,
    borderRadius: 12,
    height: 170,
    marginRight: 12,
    width: width * 0.72,
  },
  modalBackground: {
    alignItems: "center",
    backgroundColor: colors.OVERLAY_90,
    flex: 1,
    justifyContent: "center",
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
  fullScreenImage: {
    height: "80%",
    width: "100%",
  },
});

export default CatchDetailPhotoGallery;

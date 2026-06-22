import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

const ACTION_SHEET_HIDDEN_TRANSLATE_Y = 320;

interface CatchDetailActionSheetProps {
  isDeleting: boolean;
  isVisible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const CatchDetailActionSheet = ({
  isDeleting,
  isVisible,
  onClose,
  onDelete,
  onEdit,
}: CatchDetailActionSheetProps) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const actionSheetProgress = useRef(new Animated.Value(0)).current;

  const backgroundColor = isDark ? colors.DARK_BACKGROUND_DEEP : colors.WHITE;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const surfaceColor = isDark ? colors.DARK_SURFACE_MUTED : colors.SURFACE_SOFT;
  const textColor = isDark ? colors.WHITE : colors.INK;
  const bottomPadding = Math.max(insets.bottom, 40);
  const translateY = actionSheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [ACTION_SHEET_HIDDEN_TRANSLATE_Y, 0],
  });

  useEffect(() => {
    if (!isVisible) {
      actionSheetProgress.setValue(0);
      return;
    }

    Animated.timing(actionSheetProgress, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [actionSheetProgress, isVisible]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={isVisible}
    >
      <View style={styles.background}>
        <TouchableOpacity onPress={onClose} style={styles.overlay} />
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor,
              borderColor,
              paddingBottom: bottomPadding,
              transform: [{ translateY }],
            },
          ]}
        >
          <TouchableOpacity
            disabled={isDeleting}
            onPress={onEdit}
            style={styles.actionButton}
          >
            <Text style={[styles.actionText, { color: textColor }]}>수정하기</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />
          <TouchableOpacity
            disabled={isDeleting}
            onPress={onDelete}
            style={styles.actionButton}
          >
            <Text style={[styles.actionText, styles.dangerText]}>
              {isDeleting ? "삭제 중..." : "삭제하기"}
            </Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />
          <TouchableOpacity
            disabled={isDeleting}
            onPress={onClose}
            style={[styles.cancelButton, { backgroundColor: surfaceColor }]}
          >
            <Text style={[styles.cancelText, { color: mutedTextColor }]}>취소</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.OVERLAY_40,
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    flex: 1,
  },
  container: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    paddingTop: 10,
  },
  actionButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  dangerText: {
    color: colors.RED_500,
  },
  divider: {
    height: 1,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

export default CatchDetailActionSheet;

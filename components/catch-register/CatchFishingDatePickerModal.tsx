import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "@/constants";

interface CatchFishingDatePickerModalProps {
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  date: Date;
  maxDate: Date;
  mutedTextColor: string;
  onChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onClose: () => void;
  onConfirm: () => void;
  paddingBottom: number;
  textColor: string;
  themeVariant: "dark" | "light";
  visible: boolean;
}

export default function CatchFishingDatePickerModal({
  accentColor,
  backgroundColor,
  borderColor,
  date,
  maxDate,
  mutedTextColor,
  onChange,
  onClose,
  onConfirm,
  paddingBottom,
  textColor,
  themeVariant,
  visible,
}: CatchFishingDatePickerModalProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel="날짜 선택 닫기"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.modalBackdrop}
        />
        <View
          style={[
            styles.datePickerSheet,
            {
              backgroundColor,
              paddingBottom,
            },
          ]}
        >
          <View
            style={[
              styles.datePickerHandle,
              { backgroundColor: borderColor },
            ]}
          />
          <View style={styles.datePickerHeader}>
            <Pressable
              accessibilityLabel="날짜 선택 취소"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [
                styles.datePickerActionButton,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.datePickerActionText,
                  { color: mutedTextColor },
                ]}
              >
                취소
              </Text>
            </Pressable>
            <Text style={[styles.datePickerTitle, { color: textColor }]}>
              출조 날짜 선택
            </Text>
            <Pressable
              accessibilityLabel="날짜 선택 완료"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.datePickerActionButton,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.datePickerActionText,
                  { color: accentColor },
                ]}
              >
                완료
              </Text>
            </Pressable>
          </View>
          <DateTimePicker
            display="spinner"
            locale="ko-KR"
            maximumDate={maxDate}
            mode="date"
            onChange={onChange}
            style={[
              styles.datePicker,
              { backgroundColor },
            ]}
            themeVariant={themeVariant}
            value={date}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.OVERLAY_35,
  },
  datePickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  datePickerHandle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 5,
    marginBottom: 16,
    width: 44,
  },
  datePickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  datePickerActionButton: {
    minWidth: 48,
  },
  datePickerActionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  datePicker: {
    marginTop: 8,
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
});

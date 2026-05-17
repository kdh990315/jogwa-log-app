import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { resolveNextSafetyReminderTime } from "@/api/safety-reminders";
import { colors } from "@/constants";
import { safetyReminderPresets } from "@/constants/safety-reminder";
import { useSafetyReminder } from "@/hooks/use-safety-reminder";

interface SafetyReminderCardProps {
  isDark: boolean;
  variant?: "card" | "compactButton";
}

export default function SafetyReminderCard({
  isDark,
  variant = "card",
}: SafetyReminderCardProps) {
  const insets = useSafeAreaInsets();
  const {
    cancelReminder,
    isLoading,
    isPending,
    permissionState,
    refresh,
    scheduleManualReminder,
    scheduleRelativeReminder,
    scheduledReminder,
  } = useSafetyReminder();
  const [isReminderOptionsVisible, setIsReminderOptionsVisible] =
    useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [manualTimeDraft, setManualTimeDraft] = useState(() =>
    getInitialManualTime(),
  );
  const surfaceColor = isDark ? colors.DARK_SURFACE : colors.WHITE;
  const borderColor = isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT;
  const softSurfaceColor = isDark
    ? colors.DARK_SURFACE_MUTED
    : colors.BRAND_PRIMARY_SOFT;
  const textColor = isDark ? colors.WHITE : colors.INK;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const warningBackgroundColor = isDark
    ? colors.DARK_SURFACE_MUTED
    : colors.ORANGE_100;
  const targetLabel = scheduledReminder
    ? formatSafetyReminderTarget(scheduledReminder.targetAt)
    : null;
  const statusText = scheduledReminder
    ? `${targetLabel} 예정`
    : "예약된 알림 없음";
  const isUnsupported = permissionState === "unsupported";
  const isDenied = permissionState === "denied";
  const isCompactButton = variant === "compactButton";
  const isReminderBusy = isLoading || isPending;
  const isReminderActionDisabled =
    isReminderBusy || isUnsupported || isDenied;

  const selectedTargetLabel = useMemo(
    () =>
      formatSafetyReminderTarget(resolveNextSafetyReminderTime(manualTimeDraft)),
    [manualTimeDraft],
  );

  async function handleScheduleRelativeReminder(seconds: number) {
    try {
      await scheduleRelativeReminder(seconds);
      setIsReminderOptionsVisible(false);
    } catch (error) {
      await refresh();
      showSafetyReminderError(error);
    }
  }

  function handleOpenReminderOptions() {
    if (isReminderActionDisabled) {
      return;
    }

    setIsReminderOptionsVisible(true);
  }

  function handlePressReminderButton() {
    if (isReminderBusy) {
      return;
    }

    if (isUnsupported) {
      Alert.alert(
        "철수 알림",
        "철수 알림은 iOS 또는 Android 앱에서 사용할 수 있습니다.",
      );
      return;
    }

    if (isDenied) {
      Alert.alert(
        "철수 알림",
        "알림 권한이 꺼져 있어 철수 알림을 예약할 수 없습니다.",
        [
          { style: "cancel", text: "닫기" },
          { onPress: () => void handleOpenSettings(), text: "설정 열기" },
        ],
      );
      return;
    }

    setIsReminderOptionsVisible(true);
  }

  function handleOpenManualTimePicker() {
    const initialTime = getInitialManualTime();

    setIsReminderOptionsVisible(false);

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        is24Hour: true,
        mode: "time",
        onChange: (event, selectedTime) => {
          if (event.type !== "set" || !selectedTime) {
            return;
          }

          void handleScheduleManualReminder(selectedTime);
        },
        value: initialTime,
      });
      return;
    }

    if (Platform.OS === "ios") {
      setManualTimeDraft(initialTime);
      setIsTimePickerVisible(true);
      return;
    }

    Alert.alert(
      "지원되지 않는 환경",
      "철수 알림은 iOS 또는 Android 앱에서 사용할 수 있습니다.",
    );
  }

  function handleChangeManualTime(
    _event: DateTimePickerEvent,
    selectedTime?: Date,
  ) {
    if (!selectedTime) {
      return;
    }

    setManualTimeDraft(selectedTime);
  }

  async function handleScheduleManualReminder(selectedTime: Date) {
    try {
      const targetAt = resolveNextSafetyReminderTime(selectedTime);

      await scheduleManualReminder(targetAt);
      setIsTimePickerVisible(false);
      setIsReminderOptionsVisible(false);
    } catch (error) {
      await refresh();
      showSafetyReminderError(error);
    }
  }

  async function handleCancelReminder() {
    try {
      await cancelReminder();
      setIsReminderOptionsVisible(false);
    } catch (error) {
      showSafetyReminderError(error);
    }
  }

  async function handleOpenSettings() {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        "설정 열기 실패",
        "기기 설정에서 어장관리 알림 권한을 직접 확인해 주세요.",
      );
    }
  }

  return (
    <View
      style={
        isCompactButton
          ? styles.compactButtonRoot
          : [
              styles.card,
              {
                backgroundColor: surfaceColor,
                borderColor,
              },
            ]
      }
    >
      {isCompactButton ? (
        <TouchableOpacity
          accessibilityLabel={
            scheduledReminder
              ? `철수 알림 ${statusText}`
              : "철수 알림 설정"
          }
          accessibilityRole="button"
          activeOpacity={0.78}
          disabled={isReminderBusy}
          onPress={handlePressReminderButton}
          style={[
            styles.iconReminderButton,
            {
              backgroundColor: isDark
                ? colors.DARK_SURFACE_MUTED
                : colors.SURFACE_SOFT,
              borderColor,
              opacity: isReminderBusy ? 0.55 : 1,
            },
          ]}
        >
          {isReminderBusy ? (
            <ActivityIndicator color={colors.BRAND_PRIMARY} size="small" />
          ) : (
            <Ionicons
              color={scheduledReminder ? colors.BRAND_PRIMARY : mutedTextColor}
              name={scheduledReminder ? "alarm" : "alarm-outline"}
              size={16}
            />
          )}
          <Text
            style={[
              styles.compactButtonText,
              {
                color: scheduledReminder
                  ? colors.BRAND_PRIMARY
                  : mutedTextColor,
              },
            ]}
          >
            철수
          </Text>
          {scheduledReminder ? <View style={styles.reminderDot} /> : null}
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryContent}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: softSurfaceColor,
                  },
                ]}
              >
                <Ionicons
                  color={colors.BRAND_PRIMARY}
                  name="notifications-outline"
                  size={18}
                />
              </View>
              <View style={styles.titleGroup}>
                <Text style={[styles.title, { color: textColor }]}>
                  철수 알림
                </Text>
                <Text style={[styles.statusText, { color: mutedTextColor }]}>
                  {isUnsupported
                    ? "현재 환경에서는 사용할 수 없음"
                    : statusText}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.76}
              accessibilityLabel="철수 알림 시간 선택 열기"
              accessibilityRole="button"
              disabled={isReminderActionDisabled}
              onPress={handleOpenReminderOptions}
              style={[
                styles.primaryButton,
                {
                  opacity: isReminderActionDisabled ? 0.55 : 1,
                },
              ]}
            >
              {isLoading || isPending ? (
                <ActivityIndicator color={colors.WHITE} size="small" />
              ) : (
                <Ionicons color={colors.WHITE} name="alarm-outline" size={16} />
              )}
              <Text style={styles.primaryButtonText}>철수 알림</Text>
            </TouchableOpacity>
          </View>

          {isUnsupported ? (
            <Text style={[styles.statusDetail, { color: mutedTextColor }]}>
              iOS 또는 Android 앱에서 설정해 주세요.
            </Text>
          ) : null}

          {isDenied ? (
            <View
              style={[
                styles.permissionNotice,
                { backgroundColor: warningBackgroundColor },
              ]}
            >
              <Text style={[styles.permissionText, { color: textColor }]}>
                알림 권한이 꺼져 있어 철수 알림을 예약할 수 없습니다.
              </Text>
              <TouchableOpacity
                activeOpacity={0.72}
                onPress={handleOpenSettings}
                style={styles.settingsButton}
              >
                <Text style={styles.settingsButtonText}>설정 열기</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {scheduledReminder ? (
            <TouchableOpacity
              activeOpacity={0.72}
              disabled={isPending}
              onPress={handleCancelReminder}
              style={[
                styles.cancelButton,
                {
                  borderColor,
                  opacity: isPending ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons
                color={isDark ? colors.GRAY_400 : colors.MUTED_TEXT}
                name="close-circle-outline"
                size={16}
              />
              <Text style={[styles.cancelButtonText, { color: mutedTextColor }]}>
                예약 취소
              </Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}

      <Modal
        animationType="fade"
        onRequestClose={() => setIsReminderOptionsVisible(false)}
        transparent
        visible={isReminderOptionsVisible}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityLabel="철수 알림 선택 닫기"
            accessibilityRole="button"
            onPress={() => setIsReminderOptionsVisible(false)}
            style={styles.modalBackdrop}
          />
          <View
            style={[
              styles.optionSheet,
              {
                backgroundColor: surfaceColor,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View
              style={[styles.sheetHandle, { backgroundColor: borderColor }]}
            />
            <View style={styles.optionSheetHeader}>
              <Text style={[styles.sheetTitle, { color: textColor }]}>
                철수 알림
              </Text>
              <Pressable
                accessibilityLabel="철수 알림 선택 닫기"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setIsReminderOptionsVisible(false)}
                style={styles.closeIconButton}
              >
                <Ionicons
                  color={mutedTextColor}
                  name="close-outline"
                  size={22}
                />
              </Pressable>
            </View>
            <View style={styles.optionGrid}>
              {safetyReminderPresets.map((preset) => (
                <ReminderActionButton
                  disabled={isPending}
                  isDark={isDark}
                  key={preset.seconds}
                  label={preset.label}
                  onPress={() =>
                    handleScheduleRelativeReminder(preset.seconds)
                  }
                />
              ))}
              <ReminderActionButton
                disabled={isPending}
                isDark={isDark}
                label="직접 입력"
                onPress={handleOpenManualTimePicker}
              />
            </View>
            {scheduledReminder ? (
              <TouchableOpacity
                activeOpacity={0.72}
                disabled={isPending}
                onPress={handleCancelReminder}
                style={[
                  styles.sheetCancelButton,
                  {
                    borderColor,
                    opacity: isPending ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons
                  color={isDark ? colors.GRAY_400 : colors.MUTED_TEXT}
                  name="close-circle-outline"
                  size={17}
                />
                <Text
                  style={[
                    styles.sheetCancelButtonText,
                    { color: mutedTextColor },
                  ]}
                >
                  {statusText} 취소
                </Text>
              </TouchableOpacity>
            ) : null}
            <Text style={[styles.optionNotice, { color: mutedTextColor }]}>
              알림은 기기 설정과 OS 상태에 따라 지연될 수 있습니다.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsTimePickerVisible(false)}
        transparent
        visible={isTimePickerVisible}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityLabel="철수 알림 시간 선택 닫기"
            accessibilityRole="button"
            onPress={() => setIsTimePickerVisible(false)}
            style={styles.modalBackdrop}
          />
          <View
            style={[
              styles.timePickerSheet,
              {
                backgroundColor: surfaceColor,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: borderColor },
              ]}
            />
            <View style={styles.sheetHeader}>
              <Pressable
                accessibilityLabel="철수 알림 시간 선택 취소"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setIsTimePickerVisible(false)}
                style={styles.sheetActionButton}
              >
                <Text
                  style={[styles.sheetActionText, { color: mutedTextColor }]}
                >
                  취소
                </Text>
              </Pressable>
              <View style={styles.sheetTitleGroup}>
                <Text style={[styles.sheetTitle, { color: textColor }]}>
                  철수 시간 선택
                </Text>
                <Text style={[styles.sheetSubtitle, { color: mutedTextColor }]}>
                  {selectedTargetLabel} 예정
                </Text>
              </View>
              <Pressable
                accessibilityLabel="철수 알림 시간 선택 완료"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => handleScheduleManualReminder(manualTimeDraft)}
                style={styles.sheetActionButton}
              >
                <Text
                  style={[
                    styles.sheetActionText,
                    { color: colors.BRAND_PRIMARY },
                  ]}
                >
                  완료
                </Text>
              </Pressable>
            </View>
            <DateTimePicker
              display="spinner"
              locale="ko-KR"
              mode="time"
              onChange={handleChangeManualTime}
              style={[styles.timePicker, { backgroundColor: surfaceColor }]}
              themeVariant={isDark ? "dark" : "light"}
              value={manualTimeDraft}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface ReminderActionButtonProps {
  disabled: boolean;
  isDark: boolean;
  label: string;
  onPress: () => void;
}

function ReminderActionButton({
  disabled,
  isDark,
  label,
  onPress,
}: ReminderActionButtonProps) {
  const buttonColor = isDark ? colors.DARK_SURFACE_MUTED : colors.GRAY_100;
  const textColor = isDark ? colors.WHITE : colors.INK;

  return (
    <TouchableOpacity
      activeOpacity={0.76}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        {
          backgroundColor: buttonColor,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <Text style={[styles.actionButtonText, { color: textColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getInitialManualTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);

  date.setSeconds(0, 0);
  return date;
}

function formatSafetyReminderTarget(date: Date) {
  const now = new Date();
  const dayLabel =
    date.toDateString() === now.toDateString() ? "오늘" : "내일";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${dayLabel} ${hours}:${minutes}`;
}

function showSafetyReminderError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "철수 알림을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

  Alert.alert("철수 알림", message);
}

const styles = StyleSheet.create({
  compactButtonRoot: {
    position: "relative",
  },
  iconReminderButton: {
    alignItems: "center",
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    height: 36,
    justifyContent: "center",
    minWidth: 56,
    paddingHorizontal: 8,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  reminderDot: {
    backgroundColor: colors.ORANGE_500,
    borderColor: colors.WHITE,
    borderRadius: 4,
    borderWidth: 1,
    height: 8,
    position: "absolute",
    right: 7,
    top: 7,
    width: 8,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  summaryContent: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    marginRight: 10,
    width: 34,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  statusDetail: {
    fontSize: 12,
    lineHeight: 17,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.BRAND_PRIMARY,
    borderRadius: 8,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 104,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: colors.WHITE,
    fontSize: 13,
    fontWeight: "800",
  },
  permissionNotice: {
    borderRadius: 8,
    gap: 8,
    padding: 12,
  },
  permissionText: {
    fontSize: 12,
    lineHeight: 17,
  },
  settingsButton: {
    alignSelf: "flex-start",
  },
  settingsButtonText: {
    color: colors.ORANGE_500,
    fontSize: 12,
    fontWeight: "800",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionNotice: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  sheetCancelButton: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  sheetCancelButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 8,
    width: "48.7%",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.OVERLAY_35,
  },
  timePickerSheet: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  optionSheet: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  optionSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  closeIconButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  sheetHandle: {
    alignSelf: "center",
    borderRadius: 8,
    height: 4,
    marginBottom: 12,
    width: 38,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sheetActionButton: {
    minWidth: 44,
  },
  sheetActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sheetTitleGroup: {
    alignItems: "center",
    flex: 1,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  sheetSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  timePicker: {
    marginTop: 4,
  },
});

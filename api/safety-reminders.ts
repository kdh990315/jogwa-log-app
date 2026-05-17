import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  SAFETY_REMINDER_CHANNEL_ID,
  SAFETY_REMINDER_DATA_KIND,
  SAFETY_REMINDER_MIN_SECONDS,
  SAFETY_REMINDER_SOUND,
} from "@/constants/safety-reminder";
import type {
  SafetyReminderMode,
  SafetyReminderPermissionState,
  ScheduledSafetyReminder,
} from "@/types/safety-reminder";

interface ScheduleSafetyReminderParams {
  mode: Exclude<SafetyReminderMode, "tide_based">;
  targetAt: Date;
}

export function configureSafetyReminderNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      priority: Notifications.AndroidNotificationPriority.HIGH,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function getSafetyReminderPermissionState(): Promise<SafetyReminderPermissionState> {
  if (Platform.OS === "web") {
    return "unsupported";
  }

  const settings = await Notifications.getPermissionsAsync();

  if (isNotificationPermissionGranted(settings)) {
    return "granted";
  }

  return settings.status === Notifications.PermissionStatus.DENIED
    ? "denied"
    : "undetermined";
}

export async function requestSafetyReminderPermission(): Promise<SafetyReminderPermissionState> {
  if (Platform.OS === "web") {
    return "unsupported";
  }

  await ensureSafetyReminderChannel();

  const currentState = await getSafetyReminderPermissionState();

  if (currentState === "granted" || currentState === "denied") {
    return currentState;
  }

  const settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  if (isNotificationPermissionGranted(settings)) {
    return "granted";
  }

  return settings.status === Notifications.PermissionStatus.DENIED
    ? "denied"
    : "undetermined";
}

export async function getScheduledSafetyReminder(): Promise<ScheduledSafetyReminder | null> {
  if (Platform.OS === "web") {
    return null;
  }

  const requests = await Notifications.getAllScheduledNotificationsAsync();
  const now = Date.now();
  const reminders = requests
    .map((request): ScheduledSafetyReminder | null => {
      const data = request.content.data;

      if (data.kind !== SAFETY_REMINDER_DATA_KIND) {
        return null;
      }

      const targetAt =
        typeof data.targetAt === "string" ? new Date(data.targetAt) : null;
      const mode = normalizeSafetyReminderMode(data.mode);

      if (!targetAt || Number.isNaN(targetAt.getTime()) || targetAt.getTime() <= now) {
        return null;
      }

      return {
        id: request.identifier,
        mode,
        targetAt,
      };
    })
    .filter((reminder): reminder is ScheduledSafetyReminder => reminder !== null)
    .sort((left, right) => left.targetAt.getTime() - right.targetAt.getTime());

  return reminders[0] ?? null;
}

export async function scheduleSafetyReminder({
  mode,
  targetAt,
}: ScheduleSafetyReminderParams): Promise<ScheduledSafetyReminder> {
  if (Platform.OS === "web") {
    throw new Error("철수 알림은 iOS 또는 Android 앱에서 사용할 수 있습니다.");
  }

  const permissionState = await requestSafetyReminderPermission();

  if (permissionState !== "granted") {
    throw new Error("철수 알림을 사용하려면 알림 권한이 필요합니다.");
  }

  const now = Date.now();
  const seconds = Math.max(
    SAFETY_REMINDER_MIN_SECONDS,
    Math.round((targetAt.getTime() - now) / 1000),
  );
  const normalizedTargetAt = new Date(now + seconds * 1000);

  await cancelSafetyReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      body: "예정한 철수 시간입니다. 주변을 정리하고 안전하게 이동하세요.",
      data: {
        kind: SAFETY_REMINDER_DATA_KIND,
        mode,
        targetAt: normalizedTargetAt.toISOString(),
      },
      priority: Notifications.AndroidNotificationPriority.HIGH,
      sound: SAFETY_REMINDER_SOUND,
      title: "철수 알림",
    },
    trigger: {
      channelId: SAFETY_REMINDER_CHANNEL_ID,
      date: normalizedTargetAt,
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    },
  });

  return {
    id,
    mode,
    targetAt: normalizedTargetAt,
  };
}

export async function cancelSafetyReminder(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const requests = await Notifications.getAllScheduledNotificationsAsync();
  const safetyReminderIds = requests
    .filter((request) => request.content.data.kind === SAFETY_REMINDER_DATA_KIND)
    .map((request) => request.identifier);

  await Promise.all(
    safetyReminderIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id),
    ),
  );
}

export function getSafetyReminderTargetAfter(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

export function resolveNextSafetyReminderTime(selectedTime: Date) {
  const now = new Date();
  const targetAt = new Date(now);

  targetAt.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

  if (targetAt.getTime() <= now.getTime() + SAFETY_REMINDER_MIN_SECONDS * 1000) {
    targetAt.setDate(targetAt.getDate() + 1);
  }

  return targetAt;
}

async function ensureSafetyReminderChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(SAFETY_REMINDER_CHANNEL_ID, {
    audioAttributes: {
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      usage: Notifications.AndroidAudioUsage.ALARM,
    },
    importance: Notifications.AndroidImportance.HIGH,
    name: "철수 알림",
    sound: SAFETY_REMINDER_SOUND,
    vibrationPattern: [0, 250, 250, 250],
  });
}

function isNotificationPermissionGranted(
  settings: Notifications.NotificationPermissionsStatus,
) {
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

function normalizeSafetyReminderMode(value: unknown): SafetyReminderMode {
  return value === "manual" || value === "tide_based" ? value : "relative";
}

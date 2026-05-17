import type { SafetyReminderPreset } from "@/types/safety-reminder";

export const SAFETY_REMINDER_CHANNEL_ID = "safety-reminders-alarm-v1";
export const SAFETY_REMINDER_DATA_KIND = "safety-reminder";
export const SAFETY_REMINDER_MIN_SECONDS = 60;
export const SAFETY_REMINDER_SOUND = "safety_alarm.wav";

export const safetyReminderPresets: SafetyReminderPreset[] = [
  { label: "30분", seconds: 30 * 60 },
  { label: "1시간", seconds: 60 * 60 },
  { label: "2시간", seconds: 2 * 60 * 60 },
];

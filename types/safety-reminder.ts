export type SafetyReminderMode = "relative" | "manual" | "tide_based";

export interface SafetyReminderPreset {
  label: string;
  seconds: number;
}

export interface ScheduledSafetyReminder {
  id: string;
  mode: SafetyReminderMode;
  targetAt: Date;
}

export type SafetyReminderPermissionState =
  | "granted"
  | "denied"
  | "undetermined"
  | "unsupported";

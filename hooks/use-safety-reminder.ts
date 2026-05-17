import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import {
  cancelSafetyReminder,
  getScheduledSafetyReminder,
  getSafetyReminderPermissionState,
  scheduleSafetyReminder,
} from "@/api/safety-reminders";
import type {
  SafetyReminderPermissionState,
  ScheduledSafetyReminder,
} from "@/types/safety-reminder";

export function useSafetyReminder() {
  const [permissionState, setPermissionState] =
    useState<SafetyReminderPermissionState>("undetermined");
  const [scheduledReminder, setScheduledReminder] =
    useState<ScheduledSafetyReminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  const refresh = useCallback(async () => {
    const [nextPermissionState, nextReminder] = await Promise.all([
      getSafetyReminderPermissionState(),
      getScheduledSafetyReminder(),
    ]);

    setPermissionState(nextPermissionState);
    setScheduledReminder(nextReminder);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadReminder() {
      try {
        await refresh();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadReminder();

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  const scheduleRelativeReminder = useCallback(
    async (seconds: number) => {
      setIsPending(true);

      try {
        const targetAt = new Date(Date.now() + seconds * 1000);
        const reminder = await scheduleSafetyReminder({
          mode: "relative",
          targetAt,
        });

        setScheduledReminder(reminder);
        setPermissionState("granted");
        return reminder;
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  const scheduleManualReminder = useCallback(async (targetAt: Date) => {
    setIsPending(true);

    try {
      const reminder = await scheduleSafetyReminder({
        mode: "manual",
        targetAt,
      });

      setScheduledReminder(reminder);
      setPermissionState("granted");
      return reminder;
    } finally {
      setIsPending(false);
    }
  }, []);

  const cancelReminder = useCallback(async () => {
    setIsPending(true);

    try {
      await cancelSafetyReminder();
      setScheduledReminder(null);
      await refresh();
    } finally {
      setIsPending(false);
    }
  }, [refresh]);

  return {
    cancelReminder,
    isLoading,
    isPending,
    permissionState,
    refresh,
    scheduleManualReminder,
    scheduleRelativeReminder,
    scheduledReminder,
  };
}

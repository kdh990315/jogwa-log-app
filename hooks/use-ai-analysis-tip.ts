import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

const AI_ANALYSIS_TIP_HIDDEN_UNTIL_KEY =
  "jogwa-log.ai-analysis-tip-hidden-until";

export function useAiAnalysisTip() {
  const [isTipModalVisible, setIsTipModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function showTipIfAvailable() {
      const hiddenUntil = await getAiAnalysisTipHiddenUntil().catch(() => null);

      if (!isMounted) {
        return;
      }

      if (!hiddenUntil || Date.now() >= hiddenUntil.getTime()) {
        setIsTipModalVisible(true);
      }
    }

    void showTipIfAvailable();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleCloseTipModal() {
    setIsTipModalVisible(false);
  }

  async function handleHideTipToday() {
    setIsTipModalVisible(false);
    await setAiAnalysisTipHiddenUntil(getTomorrowStart());
  }

  return {
    handleCloseTipModal,
    handleHideTipToday,
    isTipModalVisible,
  };
}

function getTomorrowStart() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

async function getAiAnalysisTipHiddenUntil(): Promise<Date | null> {
  const value = await getStoredValue(AI_ANALYSIS_TIP_HIDDEN_UNTIL_KEY);
  const hiddenUntilTimestamp = value ? Date.parse(value) : Number.NaN;

  if (!Number.isFinite(hiddenUntilTimestamp)) {
    return null;
  }

  return new Date(hiddenUntilTimestamp);
}

function setAiAnalysisTipHiddenUntil(hiddenUntil: Date) {
  return setStoredValue(
    AI_ANALYSIS_TIP_HIDDEN_UNTIL_KEY,
    hiddenUntil.toISOString(),
  );
}

function getStoredValue(key: string) {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

function setStoredValue(key: string, value: string) {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(key, value);
    return;
  }

  return SecureStore.setItemAsync(key, value);
}

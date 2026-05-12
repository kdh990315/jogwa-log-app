import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useCallback, useMemo, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { Alert, Platform } from "react-native";

import type { CatchFormValues } from "@/utils/catch-register-form";
import {
  formatFishingDateValue,
  parseFishingDateValue,
} from "@/utils/tide";

interface UseCatchRegisterFishingDateParams {
  fishingDate: string;
  onSelectDateComplete: () => void;
  setValue: UseFormSetValue<CatchFormValues>;
}

export function useCatchRegisterFishingDate({
  fishingDate,
  onSelectDateComplete,
  setValue,
}: UseCatchRegisterFishingDateParams) {
  const defaultFishingDate = useMemo(() => {
    const today = new Date();

    today.setHours(12, 0, 0, 0);
    return today;
  }, []);
  const maxFishingDate = useMemo(() => {
    const today = new Date();

    today.setHours(23, 59, 59, 999);
    return today;
  }, []);
  const currentFishingDate = useMemo(
    () => parseFishingDateValue(fishingDate) ?? defaultFishingDate,
    [defaultFishingDate, fishingDate],
  );
  const [isFishingDatePickerVisible, setIsFishingDatePickerVisible] =
    useState(false);
  const [iosFishingDateDraft, setIosFishingDateDraft] =
    useState<Date>(defaultFishingDate);

  const handleSetFishingDate = useCallback(
    (selectedDate: Date) => {
      const formattedDate = formatFishingDateValue(selectedDate);

      if (!formattedDate) {
        return;
      }

      setValue("fishingDate", formattedDate, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const handleOpenFishingDatePicker = useCallback(() => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        maximumDate: maxFishingDate,
        mode: "date",
        onChange: (event, selectedDate) => {
          if (event.type !== "set" || !selectedDate) {
            return;
          }

          handleSetFishingDate(selectedDate);
          onSelectDateComplete();
        },
        value: currentFishingDate,
      });
      return;
    }

    if (Platform.OS === "ios") {
      setIosFishingDateDraft(currentFishingDate);
      setIsFishingDatePickerVisible(true);
      return;
    }

    Alert.alert(
      "지원되지 않는 환경",
      "날짜 선택은 iOS 또는 Android 앱에서 사용할 수 있습니다.",
    );
  }, [
    currentFishingDate,
    handleSetFishingDate,
    maxFishingDate,
    onSelectDateComplete,
  ]);

  const handleCloseFishingDatePicker = useCallback(() => {
    setIsFishingDatePickerVisible(false);
  }, []);

  const handleChangeFishingDatePicker = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (!selectedDate) {
        return;
      }

      setIosFishingDateDraft(selectedDate);
    },
    [],
  );

  const handleConfirmFishingDate = useCallback(() => {
    handleSetFishingDate(iosFishingDateDraft);
    setIsFishingDatePickerVisible(false);
    onSelectDateComplete();
  }, [handleSetFishingDate, iosFishingDateDraft, onSelectDateComplete]);

  return {
    handleChangeFishingDatePicker,
    handleCloseFishingDatePicker,
    handleConfirmFishingDate,
    handleOpenFishingDatePicker,
    iosFishingDateDraft,
    isFishingDatePickerVisible,
    maxFishingDate,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { Alert, type TextInput } from "react-native";

import type { CatchLogWaterType } from "@/types/catch-log";
import type { FishSpecies } from "@/types/fish-species";
import type { CatchFormValues } from "@/utils/catch-register-form";

interface UseCatchRegisterSpeciesPickerParams {
  fishSpeciesList: FishSpecies[];
  onSelectSpeciesComplete: () => void;
  selectedSpeciesName: string;
  setValue: UseFormSetValue<CatchFormValues>;
  waterType: CatchLogWaterType;
}

export function useCatchRegisterSpeciesPicker({
  fishSpeciesList,
  onSelectSpeciesComplete,
  selectedSpeciesName,
  setValue,
  waterType,
}: UseCatchRegisterSpeciesPickerParams) {
  const [isSpeciesPickerVisible, setIsSpeciesPickerVisible] = useState(false);
  const [speciesSearchKeyword, setSpeciesSearchKeyword] = useState("");
  const speciesSearchInputRef = useRef<TextInput>(null);
  const speciesOptions = useMemo(
    () =>
      [
        ...new Set(
          fishSpeciesList
            .filter((item) => item.waterType === waterType)
            .map((item) => item.name),
        ),
      ],
    [fishSpeciesList, waterType],
  );
  const normalizedSpeciesSearchKeyword = speciesSearchKeyword.trim();
  const filteredSpeciesOptions = useMemo(() => {
    if (normalizedSpeciesSearchKeyword.length === 0) {
      return speciesOptions;
    }

    return speciesOptions.filter((item) =>
      item.includes(normalizedSpeciesSearchKeyword),
    );
  }, [normalizedSpeciesSearchKeyword, speciesOptions]);

  useEffect(() => {
    if (!isSpeciesPickerVisible) {
      return;
    }

    const timer = setTimeout(() => {
      speciesSearchInputRef.current?.focus();
    }, 120);

    return () => clearTimeout(timer);
  }, [isSpeciesPickerVisible]);

  const handleOpenSpeciesPicker = useCallback(() => {
    setSpeciesSearchKeyword(selectedSpeciesName.trim());
    setIsSpeciesPickerVisible(true);
  }, [selectedSpeciesName]);

  const handleCloseSpeciesPicker = useCallback(() => {
    setIsSpeciesPickerVisible(false);
  }, []);

  const handleCommitSpeciesName = useCallback(
    (speciesName: string) => {
      const normalizedSpeciesName = speciesName.trim();

      if (normalizedSpeciesName.length === 0) {
        Alert.alert("입력 확인", "어종을 입력하거나 목록에서 선택해 주세요.");
        return;
      }

      setValue("speciesName", normalizedSpeciesName, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setSpeciesSearchKeyword(normalizedSpeciesName);
      setIsSpeciesPickerVisible(false);
      onSelectSpeciesComplete();
    },
    [onSelectSpeciesComplete, setValue],
  );

  const handleApplySpeciesSearch = useCallback(() => {
    handleCommitSpeciesName(speciesSearchKeyword);
  }, [handleCommitSpeciesName, speciesSearchKeyword]);

  const syncSpeciesSearchKeyword = useCallback((speciesName: string) => {
    setSpeciesSearchKeyword(speciesName);
  }, []);

  return {
    filteredSpeciesOptions,
    handleApplySpeciesSearch,
    handleCloseSpeciesPicker,
    handleCommitSpeciesName,
    handleOpenSpeciesPicker,
    isSpeciesPickerVisible,
    normalizedSpeciesSearchKeyword,
    setSpeciesSearchKeyword,
    speciesOptions,
    speciesSearchInputRef,
    speciesSearchKeyword,
    syncSpeciesSearchKeyword,
  };
}

import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from "react-native";

import {
  CatchFormDateField,
  CatchFormInlineSelectField,
  CatchFormPickerField,
  CatchFormTextField,
  type CatchFormFieldTheme,
} from "@/components/catch-register/CatchFormFields";
import type { CatchLogWaterType } from "@/types/catch-log";
import {
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  sanitizeSignedDecimalInput,
} from "@/utils/catch-register-form";

const WEATHER_OPTIONS = ["맑음", "흐림", "안개", "비", "눈", "바람"] as const;

interface CatchDetailsStepProps {
  countInputRef: React.RefObject<TextInput | null>;
  isSizeFieldEnabled: boolean;
  isTideFieldEnabled: boolean;
  isWeatherSelectExpanded: boolean;
  memoInputRef: React.RefObject<TextInput | null>;
  onOpenFishingDatePicker: () => void;
  onOpenSpeciesPicker: () => void;
  onOpenWeatherSelect: () => void;
  onSelectWeather: (weather: string) => void;
  onToggleWeatherSelect: () => void;
  sizeInputRef: React.RefObject<TextInput | null>;
  theme: CatchFormFieldTheme;
  waterType: CatchLogWaterType;
}

export default function CatchDetailsStep({
  countInputRef,
  isSizeFieldEnabled,
  isTideFieldEnabled,
  isWeatherSelectExpanded,
  memoInputRef,
  onOpenFishingDatePicker,
  onOpenSpeciesPicker,
  onOpenWeatherSelect,
  onSelectWeather,
  onToggleWeatherSelect,
  sizeInputRef,
  theme,
  waterType,
}: CatchDetailsStepProps) {
  const speciesPlaceholder =
    waterType === "saltwater" ? "예: 참돔, 광어" : "예: 배스, 잉어";

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        어떤 물고기를 잡으셨나요?
      </Text>

      <CatchFormDateField
        label="출조 날짜"
        name="fishingDate"
        onPress={onOpenFishingDatePicker}
        placeholder="예: 2026.04.27"
        required
        theme={theme}
      />

      <CatchFormPickerField
        label="어종"
        name="speciesName"
        onPress={onOpenSpeciesPicker}
        placeholder={speciesPlaceholder}
        required
        theme={theme}
      />

      <Text style={[styles.optionHelperText, { color: theme.mutedText }]}>
        탭해서 {waterType === "saltwater" ? "바다" : "민물"} 어종을 선택하거나
        직접 입력해 주세요.
      </Text>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <CatchFormTextField
            inputRef={countInputRef}
            keyboardType="number-pad"
            label="마릿수"
            name="count"
            onSubmitEditing={() =>
              isSizeFieldEnabled
                ? sizeInputRef.current?.focus()
                : onOpenWeatherSelect()
            }
            placeholder="예: 3"
            required
            returnKeyType="next"
            sanitizeValue={sanitizeIntegerInput}
            theme={theme}
          />
        </View>
        <View style={styles.halfField}>
          <CatchFormTextField
            editable={isSizeFieldEnabled}
            inputRef={sizeInputRef}
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
            label="사이즈 (cm)"
            name="sizeCm"
            onSubmitEditing={onOpenWeatherSelect}
            placeholder={isSizeFieldEnabled ? "예: 50" : "마릿수 입력"}
            returnKeyType="next"
            sanitizeValue={sanitizeDecimalInput}
            theme={theme}
          />
        </View>
      </View>

      <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
        환경 정보
      </Text>
      <Text style={[styles.environmentHelperText, { color: theme.mutedText }]}>
        사진으로 등록하면 자동으로 채워질 수 있어요. 직접 입력하지 않아도
        다음 단계로 넘어갈 수 있습니다.
      </Text>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <CatchFormTextField
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
            label="기온"
            name="airTempC"
            placeholder="기온 ℃"
            returnKeyType="next"
            sanitizeValue={sanitizeSignedDecimalInput}
            theme={theme}
          />
        </View>
        <View style={styles.halfField}>
          <CatchFormTextField
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
            label="수온"
            name="waterTempC"
            placeholder="수온 ℃"
            returnKeyType="next"
            sanitizeValue={sanitizeDecimalInput}
            theme={theme}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <CatchFormTextField
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
            label="풍속"
            name="windSpeedMs"
            placeholder="풍속 m/s"
            returnKeyType="next"
            sanitizeValue={sanitizeDecimalInput}
            theme={theme}
          />
        </View>
        <View style={styles.halfField}>
          <CatchFormTextField
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
            label="파고"
            name="waveHeightM"
            placeholder="파고 m"
            returnKeyType="next"
            sanitizeValue={sanitizeDecimalInput}
            theme={theme}
          />
        </View>
      </View>

      <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
        물때 / 날씨
      </Text>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <CatchFormTextField
            editable={false}
            label="물때"
            name="tide"
            placeholder={isTideFieldEnabled ? "예: 7물" : "해당 없음"}
            theme={theme}
          />
        </View>
        <View style={styles.halfField}>
          <CatchFormInlineSelectField
            isExpanded={isWeatherSelectExpanded}
            label="날씨"
            name="weather"
            onPress={onToggleWeatherSelect}
            onSelectOption={onSelectWeather}
            options={WEATHER_OPTIONS}
            placeholder="날씨 선택"
            theme={theme}
          />
        </View>
      </View>

      <CatchFormTextField
        inputRef={memoInputRef}
        label="조과 메모"
        multiline
        name="memo"
        placeholder="그 날의 짜릿한 손맛을 기록해보세요!"
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 4,
  },
  optionHelperText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 7,
  },
  environmentHelperText: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 2,
    marginTop: -1,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  halfField: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
});

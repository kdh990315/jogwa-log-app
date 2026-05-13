import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type {
  CatchFormTextFieldName,
  CatchFormValues,
} from "@/utils/catch-register-form";

export interface CatchFormFieldTheme {
  accent: string;
  border: string;
  mutedText: string;
  subText: string;
  surface: string;
  text: string;
}

interface CatchFormTextFieldProps {
  editable?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  label?: string;
  multiline?: boolean;
  name: CatchFormTextFieldName;
  onSubmitEditing?: () => void;
  placeholder: string;
  returnKeyType?: React.ComponentProps<typeof TextInput>["returnKeyType"];
  sanitizeValue?: (value: string) => string;
  theme: CatchFormFieldTheme;
}

interface CatchFormDateFieldProps {
  label: string;
  name: "fishingDate";
  onPress: () => void;
  placeholder: string;
  theme: CatchFormFieldTheme;
}

interface CatchFormPickerFieldProps {
  label: string;
  name: "speciesName";
  onPress: () => void;
  placeholder: string;
  theme: CatchFormFieldTheme;
}

interface CatchFormInlineSelectFieldProps {
  isExpanded: boolean;
  label?: string;
  name: "weather";
  onPress: () => void;
  onSelectOption: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  theme: CatchFormFieldTheme;
}

export function CatchFormDateField({
  theme,
  name,
  placeholder,
  label,
  onPress,
}: CatchFormDateFieldProps) {
  const { control } = useFormContext<CatchFormValues>();

  return (
    <>
      <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value } }) => {
          const hasValue = (value ?? "").trim().length > 0;

          return (
            <Pressable
              accessibilityHint="날짜 선택기를 엽니다"
              accessibilityLabel={label}
              accessibilityRole="button"
              onPress={onPress}
              style={({ pressed }) => [
                styles.input,
                styles.dateField,
                {
                  backgroundColor: theme.surface,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.dateFieldText,
                  {
                    color: hasValue ? theme.text : theme.subText,
                  },
                ]}
              >
                {hasValue ? value : placeholder}
              </Text>
              <Ionicons
                color={theme.mutedText}
                name="calendar-outline"
                size={20}
              />
            </Pressable>
          );
        }}
      />
    </>
  );
}

export function CatchFormPickerField({
  theme,
  name,
  placeholder,
  label,
  onPress,
}: CatchFormPickerFieldProps) {
  const { control } = useFormContext<CatchFormValues>();

  return (
    <>
      <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value } }) => {
          const hasValue = (value ?? "").trim().length > 0;

          return (
            <Pressable
              accessibilityHint="어종 선택 모달을 엽니다"
              accessibilityLabel={label}
              accessibilityRole="button"
              onPress={onPress}
              style={({ pressed }) => [
                styles.input,
                styles.pickerField,
                {
                  backgroundColor: theme.surface,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.pickerFieldText,
                  {
                    color: hasValue ? theme.text : theme.subText,
                  },
                ]}
              >
                {hasValue ? value : placeholder}
              </Text>
              <Ionicons
                color={theme.mutedText}
                name="chevron-forward"
                size={20}
              />
            </Pressable>
          );
        }}
      />
    </>
  );
}

export function CatchFormInlineSelectField({
  theme,
  name,
  options,
  label,
  placeholder,
  isExpanded,
  onPress,
  onSelectOption,
}: CatchFormInlineSelectFieldProps) {
  const { control } = useFormContext<CatchFormValues>();
  const selectedValue = useWatch({ control, name });
  const normalizedSelectedValue = (selectedValue ?? "").trim();
  const hasValue = normalizedSelectedValue.length > 0;

  return (
    <>
      {label ? (
        <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityLabel={label ?? placeholder}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.input,
          styles.inlineSelectField,
          {
            backgroundColor: theme.surface,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.inlineSelectFieldText,
            {
              color: hasValue ? theme.text : theme.subText,
            },
          ]}
        >
          {hasValue ? normalizedSelectedValue : placeholder}
        </Text>
        <Ionicons
          color={theme.mutedText}
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
        />
      </Pressable>
      {isExpanded ? (
        <View
          style={[
            styles.inlineSelectOptions,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {options.map((option, index) => {
            const isSelected = normalizedSelectedValue === option;
            const isLast = index === options.length - 1;

            return (
              <Pressable
                accessibilityRole="button"
                key={option}
                onPress={() => onSelectOption(isSelected ? "" : option)}
                style={({ pressed }) => [
                  styles.inlineSelectOption,
                  {
                    borderBottomColor: theme.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                  !isLast && styles.inlineSelectOptionDivider,
                ]}
              >
                <Text
                  style={[
                    styles.inlineSelectOptionText,
                    {
                      color: isSelected ? theme.accent : theme.text,
                    },
                  ]}
                >
                  {option}
                </Text>
                {isSelected ? (
                  <Ionicons
                    color={theme.accent}
                    name="checkmark"
                    size={18}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

export function CatchFormTextField({
  theme,
  name,
  placeholder,
  label,
  editable = true,
  inputRef,
  returnKeyType,
  onSubmitEditing,
  keyboardType,
  multiline = false,
  sanitizeValue,
}: CatchFormTextFieldProps) {
  const { control } = useFormContext<CatchFormValues>();

  return (
    <>
      {label ? (
        <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
          {label}
        </Text>
      ) : null}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            editable={editable}
            keyboardType={keyboardType}
            multiline={multiline}
            onChangeText={(text) =>
              onChange(sanitizeValue ? sanitizeValue(text) : text)
            }
            onSubmitEditing={onSubmitEditing}
            placeholder={placeholder}
            placeholderTextColor={theme.subText}
            ref={inputRef}
            returnKeyType={returnKeyType}
            style={[
              styles.input,
              multiline && styles.textArea,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                opacity: editable ? 1 : 0.55,
              },
            ]}
            textAlignVertical={multiline ? "top" : "center"}
            value={value}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateField: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateFieldText: {
    flex: 1,
    fontSize: 16,
  },
  pickerField: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerFieldText: {
    flex: 1,
    fontSize: 16,
  },
  inlineSelectField: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inlineSelectFieldText: {
    flex: 1,
    fontSize: 16,
  },
  inlineSelectOptions: {
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    overflow: "hidden",
  },
  inlineSelectOption: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineSelectOptionDivider: {
    borderBottomWidth: 1,
  },
  inlineSelectOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  textArea: {
    height: 100,
  },
});

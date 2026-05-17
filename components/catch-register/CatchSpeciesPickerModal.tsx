import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { CatchLogWaterType } from "@/types/catch-log";

interface CatchSpeciesPickerModalProps {
  accentColor: string;
  accentSoftColor: string;
  backgroundColor: string;
  borderColor: string;
  filteredSpeciesOptions: string[];
  hasSpeciesError: boolean;
  isLoading: boolean;
  mutedTextColor: string;
  normalizedSearchKeyword: string;
  onApplySearch: () => void;
  onChangeSearchKeyword: (keyword: string) => void;
  onClose: () => void;
  onSelectSpecies: (speciesName: string) => void;
  searchInputRef: React.RefObject<TextInput | null>;
  searchKeyword: string;
  selectedSpeciesName: string;
  speciesCount: number;
  subTextColor: string;
  surfaceColor: string;
  textColor: string;
  visible: boolean;
  waterType: CatchLogWaterType;
}

export default function CatchSpeciesPickerModal({
  accentColor,
  accentSoftColor,
  backgroundColor,
  borderColor,
  filteredSpeciesOptions,
  hasSpeciesError,
  isLoading,
  mutedTextColor,
  normalizedSearchKeyword,
  onApplySearch,
  onChangeSearchKeyword,
  onClose,
  onSelectSpecies,
  searchInputRef,
  searchKeyword,
  selectedSpeciesName,
  speciesCount,
  subTextColor,
  surfaceColor,
  textColor,
  visible,
  waterType,
}: CatchSpeciesPickerModalProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaView
        edges={["top", "left", "right", "bottom"]}
        style={[styles.safeArea, { backgroundColor }]}
      >
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable
            accessibilityLabel="어종 선택 닫기"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.actionButton}
          >
            <Text style={[styles.actionText, { color: mutedTextColor }]}>
              닫기
            </Text>
          </Pressable>
          <Text style={[styles.title, { color: textColor }]}>어종 선택</Text>
          <Pressable
            accessibilityLabel="입력한 어종 적용"
            accessibilityRole="button"
            disabled={normalizedSearchKeyword.length === 0}
            onPress={onApplySearch}
            style={styles.actionButton}
          >
            <Text
              style={[
                styles.actionText,
                {
                  color:
                    normalizedSearchKeyword.length > 0
                      ? accentColor
                      : subTextColor,
                },
              ]}
            >
              완료
            </Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={[styles.helperText, { color: mutedTextColor }]}>
            {waterType === "saltwater" ? "바다" : "민물"} 어종 {speciesCount}종을
            불러왔어요. 목록에서 고르거나 직접 입력할 수 있습니다.
          </Text>
          <TextInput
            onChangeText={onChangeSearchKeyword}
            onSubmitEditing={onApplySearch}
            placeholder="어종을 검색하거나 직접 입력하세요"
            placeholderTextColor={subTextColor}
            ref={searchInputRef}
            returnKeyType="done"
            style={[
              styles.input,
              {
                backgroundColor: surfaceColor,
                color: textColor,
              },
            ]}
            value={searchKeyword}
          />
          {hasSpeciesError ? (
            <Text style={[styles.helperText, { color: mutedTextColor }]}>
              어종 목록을 불러오지 못했습니다. 직접 입력 후 완료를 눌러 주세요.
            </Text>
          ) : null}
          {isLoading ? (
            <Text style={[styles.helperText, { color: mutedTextColor }]}>
              어종 목록을 불러오는 중입니다.
            </Text>
          ) : null}

          <ScrollView
            contentContainerStyle={styles.chipScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {!isLoading && filteredSpeciesOptions.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: surfaceColor }]}>
                <Text style={[styles.emptyTitle, { color: textColor }]}>
                  검색 결과가 없습니다
                </Text>
                <Text style={[styles.emptyDescription, { color: mutedTextColor }]}>
                  직접 입력한 뒤 상단의 완료를 눌러 어종을 등록해 주세요.
                </Text>
              </View>
            ) : null}

            {filteredSpeciesOptions.map((option) => {
              const isSelected = selectedSpeciesName.trim() === option;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={option}
                  onPress={() => onSelectSpecies(option)}
                  style={({ pressed }) => [
                    styles.optionChip,
                    {
                      backgroundColor: isSelected ? accentSoftColor : surfaceColor,
                      borderColor: isSelected ? accentColor : borderColor,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      {
                        color: isSelected ? accentColor : textColor,
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  actionButton: {
    minWidth: 44,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  helperText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8,
  },
  input: {
    borderRadius: 10,
    fontSize: 14,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipScroll: {
    flex: 1,
    marginTop: 10,
  },
  chipScrollContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingBottom: 20,
  },
  emptyState: {
    borderRadius: 10,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
    width: "100%",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  optionChip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

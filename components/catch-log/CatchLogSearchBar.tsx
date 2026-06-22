import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

export interface CatchLogSearchBarColors {
  background: string;
  border: string;
  placeholder: string;
  text: string;
}

interface CatchLogSearchBarProps {
  colors: CatchLogSearchBarColors;
  onChangeText: (value: string) => void;
  value: string;
}

const CatchLogSearchBar = ({
  colors,
  onChangeText,
  value,
}: CatchLogSearchBarProps) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons color={colors.placeholder} name="search" size={19} />
      <TextInput
        onChangeText={onChangeText}
        placeholder="어종, 포인트 검색"
        placeholderTextColor={colors.placeholder}
        style={[styles.input, { color: colors.text }]}
        value={value}
      />
    </View>
  );
};

export default CatchLogSearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    marginBottom: 8,
    gap: 7,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 0,
  },
});

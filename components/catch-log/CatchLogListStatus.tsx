import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export interface CatchLogListStatusColors {
  accent: string;
  background: string;
  border: string;
  primaryText: string;
  secondaryText: string;
}

interface CatchLogListStatusProps {
  colors: CatchLogListStatusColors;
  errorMessage: string | null;
  isLoading: boolean;
  isSearching: boolean;
}

const CatchLogListStatus = ({
  colors,
  errorMessage,
  isLoading,
  isSearching,
}: CatchLogListStatusProps) => {
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <ActivityIndicator color={colors.accent} />
        <Text style={[styles.description, { color: colors.secondaryText }]}>
          조과 기록을 불러오는 중입니다
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.primaryText }]}>
          기록을 불러오지 못했습니다
        </Text>
        <Text style={[styles.description, { color: colors.secondaryText }]}>
          {errorMessage}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.title, { color: colors.primaryText }]}>
        {isSearching ? "검색 결과가 없습니다" : "아직 등록한 조과가 없습니다"}
      </Text>
      <Text style={[styles.description, { color: colors.secondaryText }]}>
        {isSearching
          ? "다른 어종이나 포인트명으로 다시 검색해보세요"
          : "조과 등록에서 첫 기록을 남겨보세요"}
      </Text>
    </View>
  );
};

export default CatchLogListStatus;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 34,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});

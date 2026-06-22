import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface CatchLogHeaderProps {
  filterLabel: string;
  filterTextColor: string;
  recordCount: number;
  recordCountTextColor: string;
}

const CatchLogHeader = ({
  filterLabel,
  filterTextColor,
  recordCount,
  recordCountTextColor,
}: CatchLogHeaderProps) => {
  if (recordCount === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: recordCountTextColor }]}>
        {recordCount} 개의 기록
      </Text>
      <Text style={[styles.text, { color: filterTextColor }]}>
        {filterLabel}
      </Text>
    </View>
  );
};

export default CatchLogHeader;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
  },
});

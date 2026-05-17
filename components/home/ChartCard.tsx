import { colors } from "@/constants";
import { StyleSheet, View } from "react-native";

export default function ChartCard({
  children,
  isDark,
}: {
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.chartCard,
        {
          backgroundColor: isDark ? colors.DARK_SURFACE : colors.WHITE,
          borderColor: isDark ? colors.DARK_BORDER : colors.HAIRLINE_SOFT,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    padding: 20,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
});

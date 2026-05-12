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
          borderColor: isDark ? colors.DARK_BORDER : colors.GRAY_200,
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
    borderRadius: 24,
    marginBottom: 16,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    elevation: 1,
    borderWidth: 1,
  },
});

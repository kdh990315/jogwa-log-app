import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "@/constants";
import { useAppTheme } from "@/hooks/use-app-theme";

type CatchDetailStatusProps =
  | {
      status: "loading";
    }
  | {
      onBack: () => void;
      status: "invalid";
    }
  | {
      message: string;
      onBack: () => void;
      status: "error";
    };

const CatchDetailStatus = (props: CatchDetailStatusProps) => {
  const { isDark } = useAppTheme();
  const backgroundColor = isDark ? colors.DARK_BACKGROUND_DEEP : colors.WHITE;
  const mutedTextColor = isDark ? colors.GRAY_400 : colors.MUTED_TEXT;
  const surfaceColor = isDark
    ? colors.DARK_SURFACE_MUTED
    : colors.SURFACE_SOFT;
  const textColor = isDark ? colors.WHITE : colors.INK;

  if (props.status === "loading") {
    return (
      <View style={[styles.screen, { backgroundColor }]}>
        <ActivityIndicator color={colors.BRAND_PRIMARY} />
        <Text style={[styles.description, { color: mutedTextColor }]}>
          조과 기록을 불러오는 중입니다
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>
        기록을 찾을 수 없습니다
      </Text>
      {props.status === "error" ? (
        <Text style={[styles.description, { color: mutedTextColor }]}>
          {props.message}
        </Text>
      ) : null}
      <TouchableOpacity
        onPress={props.onBack}
        style={[styles.backButton, { backgroundColor: surfaceColor }]}
      >
        <Text style={[styles.backButtonText, { color: textColor }]}>
          이전으로
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    marginTop: 10,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  backButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default CatchDetailStatus;

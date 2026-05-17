import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/constants";

interface AppStateViewProps {
  children?: React.ReactNode;
  description?: string;
  indicatorColor?: string;
  isLoading?: boolean;
  mutedTextColor: string;
  style?: StyleProp<ViewStyle>;
  textColor: string;
  title?: string;
}

export default function AppStateView({
  children,
  description,
  indicatorColor = colors.BRAND_PRIMARY,
  isLoading = false,
  mutedTextColor,
  style,
  textColor,
  title,
}: AppStateViewProps) {
  return (
    <View style={[styles.container, style]}>
      {isLoading ? (
        <ActivityIndicator color={indicatorColor} size="small" />
      ) : null}
      {title ? (
        <Text
          style={[
            styles.title,
            isLoading && styles.titleWithLoading,
            { color: textColor },
          ]}
        >
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text style={[styles.description, { color: mutedTextColor }]}>
          {description}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  titleWithLoading: {
    marginTop: 12,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});

import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/constants";

interface CustomCTAButtonProps extends PressableProps {
  backgroundColor: string;
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
  textColor?: string;
}

export default function CustomCTAButton({
  backgroundColor,
  containerStyle,
  disabled,
  label,
  style,
  textColor = colors.WHITE,
  ...props
}: CustomCTAButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.button,
        {
          backgroundColor,
          opacity: disabled ? 0.45 : state.pressed ? 0.92 : 1,
          transform: [{ scale: state.pressed && !disabled ? 0.99 : 1 }],
        },
        containerStyle,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
  },
});

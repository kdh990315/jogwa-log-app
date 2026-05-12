import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface CustomButtonProps extends PressableProps {
  label: string;
  backgroundColor: string;
  pressedBackgroundColor?: string;
  textColor: string;
  leftIcon?: React.ReactNode;
  borderColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function CustomButton({
  label,
  backgroundColor,
  pressedBackgroundColor,
  textColor,
  leftIcon,
  borderColor,
  containerStyle,
  style,
  ...props
}: CustomButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.button,
        {
          backgroundColor:
            state.pressed && pressedBackgroundColor
              ? pressedBackgroundColor
              : backgroundColor,
          borderColor,
          transform: [{ scale: state.pressed ? 0.98 : 1 }],
        },
        containerStyle,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
  },
  leftIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});

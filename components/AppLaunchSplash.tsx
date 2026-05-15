import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

import splashMarkSource from "@/assets/images/splash-mark.png";
import { colors } from "@/constants";
import { useAuth } from "@/hooks/use-auth";

const SPLASH_EXIT_DURATION_MS = 520;

export default function AppLaunchSplash() {
  const { isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    if (isLoading) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            duration: 760,
            toValue: 1.015,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            duration: 760,
            toValue: 0.98,
            useNativeDriver: true,
          }),
        ]),
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    }

    Animated.parallel([
      Animated.timing(opacity, {
        duration: SPLASH_EXIT_DURATION_MS,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        duration: SPLASH_EXIT_DURATION_MS,
        toValue: 1.045,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsVisible(false);
      }
    });
  }, [isLoading, opacity, scale]);

  if (!isVisible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={splashMarkSource}
          style={styles.image}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: colors.BLACK,
    justifyContent: "center",
    zIndex: 1000,
  },
  image: {
    height: 320,
    width: 320,
  },
});

import type { ConfigContext, ExpoConfig } from "expo/config";

const googleMapsAndroidApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY;

export default function getExpoConfig(_context: ConfigContext): ExpoConfig {
  return {
    name: "jogwa-log",
    slug: "jogwa-log",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "jogwalog",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      bundleIdentifier: "com.kkdonghyeon.jogwalog",
      supportsTablet: true,
    },
    android: {
      package: "com.kkdonghyeon.jogwalog",
      googleServicesFile: "./firebase/google-services.json",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      config: {
        googleMaps: {
          apiKey: googleMapsAndroidApiKey,
        },
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: "pan",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "@react-native-firebase/app",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-secure-store",
      "expo-web-browser",
      "@react-native-community/datetimepicker",
      [
        "expo-image-picker",
        {
          photosPermission:
            "조과 사진을 선택하고 AI 어종 판별에 사용하기 위해 사진 접근 권한이 필요합니다.",
          cameraPermission:
            "조과 사진을 촬영하고 AI 어종 판별에 사용하기 위해 카메라 접근 권한이 필요합니다.",
          microphonePermission: false,
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "주소와 지명을 좌표로 변환하고 현재 위치 기반 조과 위치를 기록하기 위해 위치 권한이 필요합니다.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "3ed5ae21-e557-48dc-976b-2beee6e3e7f1",
      },
    },
    owner: "kkdonghyeon",
  };
}

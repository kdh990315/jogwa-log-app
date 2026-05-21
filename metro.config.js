const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    process.env.NODE_ENV !== "production" &&
    platform === "android" &&
    moduleName === "expo-keep-awake"
  ) {
    return context.resolveRequest(
      context,
      path.resolve(__dirname, "shims/expo-keep-awake-dev.js"),
      platform,
    );
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

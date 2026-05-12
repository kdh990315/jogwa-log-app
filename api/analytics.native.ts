import { getAnalytics, logEvent } from "@react-native-firebase/analytics";

type AnalyticsParamValue = boolean | number | string | null | undefined;
type AnalyticsParams = Record<string, AnalyticsParamValue>;

export async function logAnalyticsEvent(
  name: string,
  params?: AnalyticsParams,
) {
  const sanitizedParams = sanitizeAnalyticsParams(params);

  if (__DEV__) {
    console.log("[analytics]", name, sanitizedParams);
  }

  await logEvent(getAnalytics(), name, sanitizedParams);
}

function sanitizeAnalyticsParams(params?: AnalyticsParams) {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined),
  );
}

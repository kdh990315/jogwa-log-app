import type { WaterType } from "@/types/catch-log";

export function formatCatchLogDateLabel(fishingDate: string) {
  return fishingDate.replaceAll("-", ".");
}

export function formatCatchLogShortDateLabel(fishingDate: string) {
  return fishingDate.length > 5
    ? fishingDate.slice(5).replaceAll("-", ".")
    : fishingDate;
}

export function getCatchLogDateValue(fishingDate: string) {
  return Number(fishingDate.replaceAll("-", ""));
}

export function getCatchLogMemoLabel(memo: string | null) {
  return memo?.trim() || "메모가 없습니다.";
}

export function getCatchLogPointLabel(pointName: string | null) {
  return pointName?.trim() || "포인트 미입력";
}

export function getCatchLogTideLabel(tide: string | null, waterType: WaterType) {
  return tide?.trim() || (waterType === "fresh" ? "해당없음" : "물때 미입력");
}

export function getCatchLogWeatherLabel(weather: string | null) {
  return weather?.trim() || "날씨 미입력";
}

export const formatCatchSize = (sizeCm: number | null): string | null => {
  if (!sizeCm || sizeCm <= 0) {
    return null;
  }

  return `${sizeCm}cm`;
};

export const formatCatchLogDateLabel = (fishingDate: string) => {
  return fishingDate.replaceAll("-", ".");
};

export const formatCatchLogShortDateLabel = (fishingDate: string) => {
  return fishingDate.length > 5
    ? fishingDate.slice(5).replaceAll("-", ".")
    : fishingDate;
};

export const getCatchLogPointLabel = (pointName: string | null) => {
  return pointName?.trim() || "포인트 미입력";
};

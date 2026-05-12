const SEVEN_MUL_SEQUENCE = [
  "7물",
  "8물",
  "9물",
  "10물",
  "11물",
  "12물",
  "13물",
  "조금",
  "무시",
  "1물",
  "2물",
  "3물",
  "4물",
  "5물",
  "6물",
] as const;

const TIDE_CYCLE_LENGTH = SEVEN_MUL_SEQUENCE.length;
const FALLBACK_REFERENCE_DATE = {
  day: 27,
  month: 4,
  tideLabel: "2물" as SevenMulTideLabel,
  year: 2026,
};
let chineseCalendarFormatter: Intl.DateTimeFormat | null | undefined;

export type SevenMulTideLabel = (typeof SEVEN_MUL_SEQUENCE)[number];

interface ParsedFishingDate {
  day: number;
  month: number;
  year: number;
}

// 7물때식(서해식) 기준으로 음력 일자를 물때 라벨로 변환한다.
export function getSevenMulTideLabel(
  input: Date | string,
): SevenMulTideLabel | null {
  const parsedDate = parseFishingDateInput(input);

  if (!parsedDate) {
    return null;
  }

  const lunarDay = getLunarDayFromSolarDate(parsedDate);

  if (lunarDay) {
    return getSevenMulTideLabelFromLunarDay(lunarDay);
  }

  return getSevenMulTideLabelFromFallbackCycle(parsedDate);
}

export function isValidFishingDateInput(value: string) {
  return parseFishingDateInput(value) !== null;
}

export function formatFishingDateInput(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, "").slice(0, 8);

  if (digitsOnly.length <= 4) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 6) {
    return `${digitsOnly.slice(0, 4)}.${digitsOnly.slice(4)}`;
  }

  return `${digitsOnly.slice(0, 4)}.${digitsOnly.slice(4, 6)}.${digitsOnly.slice(6)}`;
}

export function formatFishingDateValue(input: Date | string) {
  const parsedDate = parseFishingDateInput(input);

  if (!parsedDate) {
    return null;
  }

  return [
    String(parsedDate.year).padStart(4, "0"),
    String(parsedDate.month).padStart(2, "0"),
    String(parsedDate.day).padStart(2, "0"),
  ].join(".");
}

export function parseFishingDateValue(input: string) {
  const parsedDate = parseFishingDateInput(input);

  if (!parsedDate) {
    return null;
  }

  return createDateAtNoon(parsedDate);
}

function getSevenMulTideLabelFromLunarDay(day: number): SevenMulTideLabel {
  return SEVEN_MUL_SEQUENCE[(day - 1) % TIDE_CYCLE_LENGTH]!;
}

function getLunarDayFromSolarDate(date: ParsedFishingDate) {
  const formatter = getChineseCalendarFormatter();

  if (!formatter) {
    return null;
  }

  try {
    const formattedParts = formatter.formatToParts(createDateAtNoon(date));
    const dayPart = formattedParts.find((part) => part.type === "day")?.value;
    const lunarDay = dayPart ? Number(dayPart) : NaN;

    return Number.isInteger(lunarDay) && lunarDay >= 1 && lunarDay <= 30
      ? lunarDay
      : null;
  } catch {
    return null;
  }
}

function getSevenMulTideLabelFromFallbackCycle(date: ParsedFishingDate) {
  const referenceDate = createDateAtNoon(FALLBACK_REFERENCE_DATE);
  const targetDate = createDateAtNoon(date);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const elapsedDays = Math.round(
    (targetDate.getTime() - referenceDate.getTime()) / millisecondsPerDay,
  );
  const referenceIndex = SEVEN_MUL_SEQUENCE.indexOf(
    FALLBACK_REFERENCE_DATE.tideLabel,
  );
  const normalizedIndex =
    (referenceIndex + elapsedDays) % TIDE_CYCLE_LENGTH;

  return SEVEN_MUL_SEQUENCE[
    normalizedIndex >= 0 ? normalizedIndex : normalizedIndex + TIDE_CYCLE_LENGTH
  ]!;
}

function parseFishingDateInput(
  input: Date | string,
): ParsedFishingDate | null {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      return null;
    }

    return {
      day: input.getDate(),
      month: input.getMonth() + 1,
      year: input.getFullYear(),
    };
  }

  const normalized = input.trim();

  if (!/^\d{4}\.\d{2}\.\d{2}$/.test(normalized)) {
    return null;
  }

  const [yearValue, monthValue, dayValue] = normalized
    .split(".")
    .map(Number);

  if (!yearValue || !monthValue || !dayValue) {
    return null;
  }

  const candidateDate = new Date(yearValue, monthValue - 1, dayValue, 12);

  if (
    candidateDate.getFullYear() !== yearValue ||
    candidateDate.getMonth() !== monthValue - 1 ||
    candidateDate.getDate() !== dayValue
  ) {
    return null;
  }

  return {
    day: dayValue,
    month: monthValue,
    year: yearValue,
  };
}

function createDateAtNoon({ year, month, day }: ParsedFishingDate) {
  return new Date(year, month - 1, day, 12);
}

function getChineseCalendarFormatter() {
  if (chineseCalendarFormatter !== undefined) {
    return chineseCalendarFormatter;
  }

  try {
    chineseCalendarFormatter = new Intl.DateTimeFormat("ko-KR-u-ca-chinese", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  } catch {
    chineseCalendarFormatter = null;
  }

  return chineseCalendarFormatter;
}

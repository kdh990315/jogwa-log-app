import {
  formatFishingDateInput,
  formatFishingDateValue,
  isValidFishingDateInput,
  parseFishingDateValue,
} from "@/utils/tide";

describe("물때 날짜 유틸", () => {
  it("숫자만 입력한 날짜가 점 구분 날짜 형식으로 변환되는지 확인", () => {
    expect(formatFishingDateInput("20260512")).toBe("2026.05.12");
    expect(formatFishingDateInput("2026-05-12")).toBe("2026.05.12");
  });

  it("완성된 출조 날짜 입력값의 유효성이 제대로 판단되는지 확인", () => {
    expect(isValidFishingDateInput("2026.05.12")).toBe(true);
    expect(isValidFishingDateInput("2026.02.30")).toBe(false);
    expect(isValidFishingDateInput("2026.5.12")).toBe(false);
  });

  it("Date 값이 출조 날짜 문자열로 변환되는지 확인", () => {
    expect(formatFishingDateValue(new Date(2026, 4, 12, 8))).toBe(
      "2026.05.12",
    );
  });

  it("유효한 출조 날짜 문자열이 정오 기준 Date 값으로 변환되는지 확인", () => {
    const parsedDate = parseFishingDateValue("2026.05.12");

    expect(parsedDate?.getFullYear()).toBe(2026);
    expect(parsedDate?.getMonth()).toBe(4);
    expect(parsedDate?.getDate()).toBe(12);
    expect(parsedDate?.getHours()).toBe(12);
  });
});

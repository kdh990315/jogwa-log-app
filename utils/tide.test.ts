import {
  formatFishingDateInput,
  formatFishingDateValue,
  isValidFishingDateInput,
  parseFishingDateValue,
} from "@/utils/tide";

describe("tide date helpers", () => {
  it("formats digit-only date input with dot separators", () => {
    expect(formatFishingDateInput("20260512")).toBe("2026.05.12");
    expect(formatFishingDateInput("2026-05-12")).toBe("2026.05.12");
  });

  it("validates complete fishing date input", () => {
    expect(isValidFishingDateInput("2026.05.12")).toBe(true);
    expect(isValidFishingDateInput("2026.02.30")).toBe(false);
    expect(isValidFishingDateInput("2026.5.12")).toBe(false);
  });

  it("formats Date values as fishing date values", () => {
    expect(formatFishingDateValue(new Date(2026, 4, 12, 8))).toBe(
      "2026.05.12",
    );
  });

  it("parses valid fishing date values at noon", () => {
    const parsedDate = parseFishingDateValue("2026.05.12");

    expect(parsedDate?.getFullYear()).toBe(2026);
    expect(parsedDate?.getMonth()).toBe(4);
    expect(parsedDate?.getDate()).toBe(12);
    expect(parsedDate?.getHours()).toBe(12);
  });
});

import { describe, expect, it } from "vitest";
import { dayNumber } from "./day";

describe("dayNumber", () => {
  it("calls the epoch day 1", () => {
    expect(dayNumber(new Date(2026, 7, 5, 12))).toBe(1);
  });

  it("counts forward a day at a time", () => {
    expect(dayNumber(new Date(2026, 7, 6, 12))).toBe(2);
    expect(dayNumber(new Date(2026, 8, 4, 12))).toBe(31);
  });

  it("holds across a whole local day and turns over at local midnight", () => {
    expect(dayNumber(new Date(2026, 7, 10, 0, 0, 0))).toBe(6);
    expect(dayNumber(new Date(2026, 7, 10, 23, 59, 59))).toBe(6);
    expect(dayNumber(new Date(2026, 7, 11, 0, 0, 0))).toBe(7);
  });

  it("does not depend on the time of day when crossing a month", () => {
    expect(dayNumber(new Date(2026, 7, 31, 23, 0, 0))).toBe(27);
    expect(dayNumber(new Date(2026, 8, 1, 1, 0, 0))).toBe(28);
  });
});

import { describe, expect, it } from "vitest";
import {
  advanceClock,
  formatClock,
  goesHomeAtNight,
  nightTint,
  phaseFor,
} from "@/lib/clock";

describe("game clock", () => {
  it("splits the day into dawn, day, dusk, and night", () => {
    expect(phaseFor(0)).toBe("night");
    expect(phaseFor(6 * 60 - 1)).toBe("night");
    expect(phaseFor(6 * 60)).toBe("dawn");
    expect(phaseFor(7 * 60)).toBe("day");
    expect(phaseFor(18 * 60 - 1)).toBe("day");
    expect(phaseFor(18 * 60)).toBe("dusk");
    expect(phaseFor(20 * 60)).toBe("night");
  });

  it("advances and wraps a full day", () => {
    expect(advanceClock(10 * 60, 30, "pause")).toBe(10 * 60);
    expect(advanceClock(10 * 60, 30, "normal")).toBe(10 * 60 + 30);
    expect(advanceClock(23 * 60 + 59, 2, "normal")).toBe(1);
    expect(advanceClock(0, 1, "fast")).toBe(20);
  });

  it("uses a flat night tint that steps by phase", () => {
    expect(nightTint(12 * 60).alpha).toBe(0);
    expect(nightTint(6 * 60 + 30).alpha).toBeGreaterThan(0);
    expect(nightTint(19 * 60).alpha).toBeGreaterThan(nightTint(6 * 60).alpha);
    expect(nightTint(22 * 60).alpha).toBeGreaterThan(nightTint(19 * 60).alpha);
  });

  it("formats hours on a 12-hour clock", () => {
    expect(formatClock(0)).toBe("12:00 AM");
    expect(formatClock(13 * 60 + 5)).toBe("1:05 PM");
  });

  it("sends a stable majority of pups home at night", () => {
    const ids = Array.from({ length: 20 }, (_, index) => `pup-${index}`);
    const home = ids.filter((id) => goesHomeAtNight(id)).length;
    expect(home).toBeGreaterThan(8);
    expect(home).toBeLessThan(20);
    expect(goesHomeAtNight("pup-3")).toBe(goesHomeAtNight("pup-3"));
  });
});
import { describe, expect, it } from "vitest";
import {
  FOUNDING_PUP_WINDOW_DAYS,
  getBadgesForDog,
  hasFoundingPup,
  LAUNCH_DATE,
} from "@/lib/badges";

describe("Founding Pup badge", () => {
  it("awards badge within first 7 days of launch", () => {
    const day3 = new Date(LAUNCH_DATE);
    day3.setUTCDate(day3.getUTCDate() + 3);
    expect(hasFoundingPup(day3.toISOString())).toBe(true);
    expect(getBadgesForDog(day3.toISOString()).map((b) => b.id)).toContain(
      "founding_pup",
    );
  });

  it("does not award on day 8", () => {
    const day8 = new Date(LAUNCH_DATE);
    day8.setUTCDate(day8.getUTCDate() + FOUNDING_PUP_WINDOW_DAYS);
    expect(hasFoundingPup(day8.toISOString())).toBe(false);
    expect(getBadgesForDog(day8.toISOString())).toHaveLength(0);
  });

  it("does not award before launch", () => {
    expect(hasFoundingPup("2026-10-12T23:59:59.000Z")).toBe(false);
  });
});

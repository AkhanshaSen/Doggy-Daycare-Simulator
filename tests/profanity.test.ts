import { describe, expect, it } from "vitest";
import { assertCleanText, containsProfanity } from "@/lib/profanity";

describe("profanity filter", () => {
  it("blocks known bad words", () => {
    expect(containsProfanity("this is shit")).toBe(true);
  });

  it("is case insensitive", () => {
    expect(containsProfanity("SHIT")).toBe(true);
  });

  it("allows clean text", () => {
    expect(containsProfanity("Biscuit loves balls")).toBe(false);
    expect(
      assertCleanText({
        ownerName: "Maya",
        name: "Biscuit",
        favoriteThing: "treats",
      }),
    ).toBeNull();
  });

  it("returns a field-specific message", () => {
    const err = assertCleanText({ name: "little shit" });
    expect(err).toEqual(expect.stringMatching(/dog's name/i));
  });
});

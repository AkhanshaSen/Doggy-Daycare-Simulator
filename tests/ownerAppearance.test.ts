import { describe, expect, it } from "vitest";
import {
  appearanceForOwner,
  displayOwnerName,
} from "@/lib/ownerAppearance";

describe("owner appearance", () => {
  it("keeps the same outfit for the same owner and dog", () => {
    const first = appearanceForOwner("Maya", "dog-1");
    const second = appearanceForOwner("Maya", "dog-1");
    expect(second).toEqual(first);
    expect(first.shirt).toMatch(/^#/);
    expect(["none", "cap", "bag"]).toContain(first.accessory);
  });

  it("can dress two owners differently", () => {
    const maya = appearanceForOwner("Maya", "dog-1");
    const sam = appearanceForOwner("Sam", "dog-2");
    const same =
      maya.shirt === sam.shirt &&
      maya.hair === sam.hair &&
      maya.accessory === sam.accessory &&
      maya.skin === sam.skin;
    expect(same).toBe(false);
  });

  it("keeps a real name and replaces a generic one", () => {
    expect(displayOwnerName("Maya", "dog-1")).toBe("Maya");
    expect(displayOwnerName("Owner", "dog-1").length).toBeGreaterThan(1);
    expect(displayOwnerName("Owner", "dog-1")).toBe(
      displayOwnerName("owner", "dog-1"),
    );
  });
});

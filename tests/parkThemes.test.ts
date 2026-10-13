import { describe, expect, it } from "vitest";
import { GB } from "@/lib/gbPalette";
import { PARK_THEME_LIST, sceneryFor } from "@/lib/parkThemes";
import { readSettings, writeSettings } from "@/lib/settings";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
  };
}

describe("park themes", () => {
  it("keeps classic scenery on the Game Boy greens", () => {
    expect(sceneryFor("classic").grass).toBe(GB.grass);
    expect(sceneryFor("classic").sky).toBe(GB.sky);
  });

  it("recolors scenery for every style and leaves a label", () => {
    expect(PARK_THEME_LIST.map((theme) => theme.id)).toEqual([
      "classic",
      "autumn",
      "blossom",
      "snow",
      "seaside",
    ]);
    for (const theme of PARK_THEME_LIST) {
      const scenery = sceneryFor(theme.id);
      expect(scenery.grass).toMatch(/^#/);
      expect(scenery.tree).toMatch(/^#/);
      expect(theme.label.length).toBeGreaterThan(0);
    }
    expect(sceneryFor("snow").grass).not.toBe(GB.grass);
    expect(sceneryFor("autumn").tree).not.toBe(sceneryFor("seaside").tree);
  });

  it("remembers the park style and clock", () => {
    const storage = memoryStorage();
    writeSettings(
      { themeId: "blossom", minutes: 18 * 60 + 30, speed: "fast" },
      storage,
    );
    expect(readSettings(storage)).toEqual({
      themeId: "blossom",
      minutes: 18 * 60 + 30,
      speed: "fast",
    });
    storage.setItem("doggy-daycare-settings", "{nope");
    expect(readSettings(storage).themeId).toBe("classic");
  });
});
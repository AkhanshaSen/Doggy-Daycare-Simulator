import { describe, expect, it } from "vitest";
import { getPersonality } from "@/lib/types";
import {
  adjustHappiness,
  DEFAULT_HAPPINESS,
  getHappiness,
  HAPPINESS_KEY,
  idleDecay,
  setHappiness,
} from "@/lib/yardRuntime";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    key: (i) => Array.from(map.keys())[i] ?? null,
  };
}

describe("happiness", () => {
  it("defaults to 72 and clamps writes", () => {
    const storage = memoryStorage();
    expect(getHappiness("a", storage)).toBe(DEFAULT_HAPPINESS);
    expect(setHappiness("a", 140, storage)).toBe(100);
    expect(setHappiness("a", -4, storage)).toBe(0);
    expect(adjustHappiness("a", 12, storage)).toBe(12);
  });

  it("falls back when storage is corrupted", () => {
    const storage = memoryStorage();
    storage.setItem(HAPPINESS_KEY, "{nope");
    expect(getHappiness("a", storage)).toBe(DEFAULT_HAPPINESS);
  });

  it("decays about half a point per minute", () => {
    expect(idleDecay(60_000)).toBeCloseTo(0.5);
    expect(idleDecay(0)).toBe(0);
  });
});

describe("getPersonality", () => {
  it("honors an explicit personality", () => {
    expect(getPersonality({ id: "seed-04", personality: "shy" })).toBe("shy");
    expect(getPersonality({ id: "seed-01", personality: "social" })).toBe(
      "social",
    );
  });

  it("is stable when personality is missing", () => {
    const first = getPersonality({ id: "user-abc" });
    expect(getPersonality({ id: "user-abc" })).toBe(first);
  });
});

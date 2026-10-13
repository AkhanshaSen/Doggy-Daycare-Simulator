import { describe, expect, it } from "vitest";
import {
  clearExpired,
  getPresence,
  PRESENCE_KEY,
  setPresence,
} from "@/lib/yardPresence";

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

describe("yard presence", () => {
  it("returns yard when nothing is stored", () => {
    expect(getPresence("a", memoryStorage()).place).toBe("yard");
  });

  it("keeps an indoor dog until the timer ends", () => {
    const storage = memoryStorage();
    const now = new Date("2026-10-13T11:00:00.000Z");
    setPresence(
      "a",
      { place: "indoor", until: "2026-10-13T11:01:00.000Z" },
      storage,
    );
    expect(getPresence("a", storage, now).place).toBe("indoor");
    expect(
      getPresence("a", storage, new Date("2026-10-13T11:02:00.000Z")).place,
    ).toBe("yard");
  });

  it("clears expired entries", () => {
    const storage = memoryStorage();
    setPresence(
      "a",
      { place: "away", until: "2026-10-13T11:00:00.000Z" },
      storage,
    );
    clearExpired(storage, new Date("2026-10-13T11:05:00.000Z"));
    expect(storage.getItem(PRESENCE_KEY)).toBe("{}");
  });

  it("falls back when storage is corrupted", () => {
    const storage = memoryStorage();
    storage.setItem(PRESENCE_KEY, "{nope");
    expect(getPresence("a", storage).place).toBe("yard");
  });
});

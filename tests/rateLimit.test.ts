import { beforeEach, describe, expect, it } from "vitest";
import {
  canAddDog,
  getDogsAddedToday,
  RATE_LIMIT_KEY,
  recordDogAdded,
  remainingDogsToday,
} from "@/lib/rateLimit";

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

describe("soft daily rate limit", () => {
  let storage: Storage;
  const now = new Date("2026-10-13T12:00:00.000Z");

  beforeEach(() => {
    storage = memoryStorage();
  });

  it("allows 3 dogs then blocks the 4th", () => {
    expect(canAddDog(storage, 3, now)).toBe(true);
    recordDogAdded(storage, now);
    recordDogAdded(storage, now);
    recordDogAdded(storage, now);
    expect(getDogsAddedToday(storage, now)).toBe(3);
    expect(canAddDog(storage, 3, now)).toBe(false);
    expect(remainingDogsToday(storage, 3, now)).toBe(0);
  });

  it("resets the next day", () => {
    recordDogAdded(storage, now);
    recordDogAdded(storage, now);
    recordDogAdded(storage, now);
    const tomorrow = new Date("2026-10-14T01:00:00.000Z");
    expect(canAddDog(storage, 3, tomorrow)).toBe(true);
    expect(getDogsAddedToday(storage, tomorrow)).toBe(0);
  });

  it("clearing storage bypasses the limit", () => {
    recordDogAdded(storage, now);
    recordDogAdded(storage, now);
    recordDogAdded(storage, now);
    storage.removeItem(RATE_LIMIT_KEY);
    expect(canAddDog(storage, 3, now)).toBe(true);
  });
});

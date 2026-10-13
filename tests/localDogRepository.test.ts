import { beforeEach, describe, expect, it } from "vitest";
import { LocalDogRepository } from "@/lib/localDogRepository";
import { RATE_LIMIT_KEY } from "@/lib/rateLimit";
import type { Dog } from "@/lib/types";
import { YARD_CAPACITY } from "@/lib/types";
import { STORAGE_KEY } from "@/lib/localDogRepository";

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

describe("LocalDogRepository", () => {
  let storage: Storage;
  let repo: LocalDogRepository;

  beforeEach(() => {
    storage = memoryStorage();
    repo = new LocalDogRepository(storage);
  });

  it("loads seed dogs into the yard", async () => {
    const yard = await repo.getYardDogs();
    expect(yard.length).toBeGreaterThanOrEqual(12);
    expect(yard.every((d) => d.status === "in_yard")).toBe(true);
  });

  it("persists an added dog across refresh", async () => {
    const dog = await repo.addDog({
      ownerName: "Alex",
      name: "Pip",
      age: 2,
      favoriteThing: "sticks",
      breedId: "corgi",
      colorId: "cream",
      accessoryId: "bow",
    });
    expect(dog.name).toBe("Pip");

    const again = new LocalDogRepository(storage);
    const yard = await again.getYardDogs();
    expect(yard.some((d) => d.id === dog.id)).toBe(true);
  });

  it("falls back safely on corrupted localStorage", async () => {
    storage.setItem(STORAGE_KEY, "{not-json");
    const yard = await repo.getYardDogs();
    expect(yard.length).toBeGreaterThanOrEqual(12);
  });

  it("graduates oldest when yard overflows", async () => {
    // Fill toward capacity by injecting many user dogs
    const extras: Dog[] = Array.from({ length: YARD_CAPACITY }, (_, i) => ({
      id: `fill-${i}`,
      ownerName: "Filler",
      name: `F${i}`,
      age: 1,
      favoriteThing: "naps",
      breedId: "corgi" as const,
      colorId: "cream",
      accessoryId: "none" as const,
      mood: "happy" as const,
      createdAt: new Date(2026, 9, 13, 9, i).toISOString(),
      status: "in_yard" as const,
    }));
    storage.setItem(STORAGE_KEY, JSON.stringify(extras));
    // Reset rate limit so we can add
    storage.removeItem(RATE_LIMIT_KEY);

    const repo2 = new LocalDogRepository(storage);
    await repo2.addDog({
      ownerName: "New",
      name: "Newbie",
      age: 1,
      favoriteThing: "toys",
      breedId: "bichon",
      colorId: "white",
      accessoryId: "none",
    });

    const yard = await repo2.getYardDogs();
    const graduated = await repo2.getGraduatedDogs(0);
    expect(yard.length).toBeLessThanOrEqual(YARD_CAPACITY);
    expect(graduated.dogs.length).toBeGreaterThan(0);
  });
});

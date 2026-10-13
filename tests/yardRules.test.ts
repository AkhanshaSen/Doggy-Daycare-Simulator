import { describe, expect, it } from "vitest";
import type { Dog } from "@/lib/types";
import {
  applyYardCapacity,
  getGraduatedDogs,
  getYardDogs,
} from "@/lib/yardRules";

function makeDog(
  overrides: Partial<Dog> & { id: string; createdAt: string },
): Dog {
  return {
    ownerName: "Owner",
    name: "Dog",
    age: 2,
    favoriteThing: "balls",
    breedId: "corgi",
    colorId: "cream",
    accessoryId: "none",
    mood: "happy",
    status: "in_yard",
    ...overrides,
  };
}

describe("applyYardCapacity", () => {
  it("keeps 30 dogs in yard without graduating", () => {
    const dogs = Array.from({ length: 30 }, (_, i) =>
      makeDog({
        id: `d${i}`,
        createdAt: new Date(2026, 0, 1, 0, i).toISOString(),
      }),
    );
    const result = applyYardCapacity(dogs, 30);
    expect(getYardDogs(result)).toHaveLength(30);
    expect(getGraduatedDogs(result)).toHaveLength(0);
  });

  it("graduates the oldest when adding a 31st", () => {
    const dogs = Array.from({ length: 31 }, (_, i) =>
      makeDog({
        id: `d${i}`,
        createdAt: new Date(2026, 0, 1, 0, i).toISOString(),
      }),
    );
    const result = applyYardCapacity(dogs, 30);
    const yard = getYardDogs(result);
    const graduated = getGraduatedDogs(result);
    expect(yard).toHaveLength(30);
    expect(graduated).toHaveLength(1);
    expect(graduated[0]?.id).toBe("d0");
    expect(yard.every((d) => d.id !== "d0")).toBe(true);
  });

  it("preserves already graduated dogs", () => {
    const dogs = [
      makeDog({
        id: "old",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "graduated",
      }),
      ...Array.from({ length: 30 }, (_, i) =>
        makeDog({
          id: `d${i}`,
          createdAt: new Date(2026, 0, 2, 0, i).toISOString(),
        }),
      ),
    ];
    const result = applyYardCapacity(dogs, 30);
    expect(getGraduatedDogs(result).some((d) => d.id === "old")).toBe(true);
    expect(getYardDogs(result)).toHaveLength(30);
  });
});

describe("getGraduatedDogs", () => {
  it("returns newest first", () => {
    const dogs = [
      makeDog({
        id: "a",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "graduated",
      }),
      makeDog({
        id: "b",
        createdAt: "2026-01-03T00:00:00.000Z",
        status: "graduated",
      }),
      makeDog({
        id: "c",
        createdAt: "2026-01-02T00:00:00.000Z",
        status: "graduated",
      }),
    ];
    expect(getGraduatedDogs(dogs).map((d) => d.id)).toEqual(["b", "c", "a"]);
  });
});

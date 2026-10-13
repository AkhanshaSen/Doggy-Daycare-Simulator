import type { Dog } from "./types";
import { YARD_CAPACITY } from "./types";

/**
 * Apply yard capacity: keep at most `capacity` dogs with status in_yard.
 * Oldest (by createdAt) graduate first when over capacity.
 * Returns a new array; does not mutate input.
 */
export function applyYardCapacity(
  dogs: Dog[],
  capacity: number = YARD_CAPACITY,
): Dog[] {
  const sorted = [...dogs].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const inYard = sorted.filter((d) => d.status === "in_yard");
  const alreadyGraduated = sorted.filter((d) => d.status === "graduated");

  if (inYard.length <= capacity) {
    return dogs.map((d) => ({ ...d }));
  }

  const overflow = inYard.length - capacity;
  const toGraduate = new Set(inYard.slice(0, overflow).map((d) => d.id));

  return [
    ...alreadyGraduated,
    ...inYard.map((d) =>
      toGraduate.has(d.id) ? { ...d, status: "graduated" as const } : { ...d },
    ),
  ];
}

/** Merge seed + user dogs, then enforce yard capacity. */
export function mergeAndCap(seedDogs: Dog[], userDogs: Dog[]): Dog[] {
  const byId = new Map<string, Dog>();
  for (const d of seedDogs) byId.set(d.id, { ...d });
  for (const d of userDogs) byId.set(d.id, { ...d });
  return applyYardCapacity(Array.from(byId.values()));
}

export function getYardDogs(dogs: Dog[]): Dog[] {
  return dogs
    .filter((d) => d.status === "in_yard")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

export function getGraduatedDogs(dogs: Dog[]): Dog[] {
  return dogs
    .filter((d) => d.status === "graduated")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

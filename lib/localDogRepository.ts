import seedDogs from "@/data/seed-dogs.json";
import type { DogRepository } from "./dogRepository";
import { assertCleanText } from "./profanity";
import {
  canAddDog,
  recordDogAdded,
} from "./rateLimit";
import { getPersonality, type Dog, type Mood, type NewDogInput } from "./types";
import { GRADUATED_PAGE_SIZE, MOODS, YARD_CAPACITY } from "./types";
import {
  applyYardCapacity,
  getGraduatedDogs,
  getYardDogs,
  mergeAndCap,
} from "./yardRules";

export const STORAGE_KEY = "doggy-daycare-dogs";

function randomMood(): Mood {
  return MOODS[Math.floor(Math.random() * MOODS.length)]!;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readUserDogs(storage: Storage | null): Dog[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDogLike) as Dog[];
  } catch {
    return [];
  }
}

function isDogLike(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.breedId === "string" &&
    typeof d.status === "string"
  );
}

function writeUserDogs(storage: Storage | null, dogs: Dog[]): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(dogs));
  } catch {
    // Quota or private mode — ignore
  }
}

function allDogs(storage: Storage | null): Dog[] {
  const seed = seedDogs as Dog[];
  const user = readUserDogs(storage);
  return mergeAndCap(seed, user);
}

export class LocalDogRepository implements DogRepository {
  private storage: Storage | null;

  constructor(storage?: Storage | null) {
    this.storage =
      storage === undefined
        ? getStorage()
        : storage;
  }

  async getYardDogs(): Promise<Dog[]> {
    return getYardDogs(allDogs(this.storage));
  }

  async getGraduatedDogs(
    page: number,
  ): Promise<{ dogs: Dog[]; hasMore: boolean }> {
    const graduated = getGraduatedDogs(allDogs(this.storage));
    const start = Math.max(0, page) * GRADUATED_PAGE_SIZE;
    const slice = graduated.slice(start, start + GRADUATED_PAGE_SIZE);
    return {
      dogs: slice,
      hasMore: start + GRADUATED_PAGE_SIZE < graduated.length,
    };
  }

  async getDogById(id: string): Promise<Dog | null> {
    return allDogs(this.storage).find((d) => d.id === id) ?? null;
  }

  async addDog(input: NewDogInput): Promise<Dog> {
    const profanityError = assertCleanText({
      ownerName: input.ownerName,
      name: input.name,
      favoriteThing: input.favoriteThing,
      introLine: input.introLine,
    });
    if (profanityError) {
      throw new Error(profanityError);
    }

    if (!canAddDog(this.storage)) {
      throw new Error(
        "You've already dropped off 3 dogs today. Come back tomorrow!",
      );
    }

    const id = crypto.randomUUID();
    const newDog: Dog = {
      id,
      ownerName: input.ownerName.trim(),
      name: input.name.trim(),
      age: input.age,
      favoriteThing: input.favoriteThing.trim(),
      introLine: input.introLine?.trim() || undefined,
      breedId: input.breedId,
      colorId: input.colorId,
      accessoryId: input.accessoryId,
      mood: input.mood ?? randomMood(),
      personality: getPersonality({ id }),
      createdAt: new Date().toISOString(),
      status: "in_yard",
    };

    const seed = seedDogs as Dog[];
    const userDogs = readUserDogs(this.storage);
    const combined = applyYardCapacity(
      [...seed, ...userDogs, newDog],
      YARD_CAPACITY,
    );

    // Persist only non-seed dogs (user dogs + graduated seed if status changed)
    const seedIds = new Set(seed.map((d) => d.id));
    const toPersist = combined.filter((d) => {
      if (!seedIds.has(d.id)) return true;
      const original = seed.find((s) => s.id === d.id);
      return original && original.status !== d.status;
    });

    writeUserDogs(this.storage, toPersist);
    recordDogAdded(this.storage);

    return combined.find((d) => d.id === newDog.id) ?? newDog;
  }
}

let singleton: LocalDogRepository | null = null;

export function getDogRepository(): DogRepository {
  if (!singleton) {
    singleton = new LocalDogRepository();
  }
  return singleton;
}

/** Reset singleton (tests / HMR). */
export function resetDogRepository(): void {
  singleton = null;
}

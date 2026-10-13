import { DAILY_DOG_LIMIT } from "./types";

export const RATE_LIMIT_KEY = "doggy-daycare-rate";

type RateState = {
  date: string; // YYYY-MM-DD
  count: number;
};

function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function readState(storage: Storage | null, now: Date = new Date()): RateState {
  if (!storage) return { date: todayKey(now), count: 0 };
  try {
    const raw = storage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { date: todayKey(now), count: 0 };
    const parsed = JSON.parse(raw) as RateState;
    if (parsed.date !== todayKey(now)) {
      return { date: todayKey(now), count: 0 };
    }
    return { date: parsed.date, count: Number(parsed.count) || 0 };
  } catch {
    return { date: todayKey(now), count: 0 };
  }
}

export function getDogsAddedToday(
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
  now: Date = new Date(),
): number {
  return readState(storage, now).count;
}

export function canAddDog(
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
  limit: number = DAILY_DOG_LIMIT,
  now: Date = new Date(),
): boolean {
  return getDogsAddedToday(storage, now) < limit;
}

export function recordDogAdded(
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
  now: Date = new Date(),
): void {
  if (!storage) return;
  const state = readState(storage, now);
  storage.setItem(
    RATE_LIMIT_KEY,
    JSON.stringify({ date: state.date, count: state.count + 1 }),
  );
}

export function remainingDogsToday(
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
  limit: number = DAILY_DOG_LIMIT,
  now: Date = new Date(),
): number {
  return Math.max(0, limit - getDogsAddedToday(storage, now));
}

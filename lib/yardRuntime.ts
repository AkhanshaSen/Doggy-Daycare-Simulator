export const HAPPINESS_KEY = "doggy-daycare-happiness";
export const DEFAULT_HAPPINESS = 72;

function clamp(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_HAPPINESS;
  return Math.max(0, Math.min(100, value));
}

function readMap(storage: Storage | null): Record<string, number> {
  if (!storage) return {};
  try {
    const raw = storage.getItem(HAPPINESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, number> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === "number") out[id] = clamp(value);
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(storage: Storage | null, map: Record<string, number>): void {
  if (!storage) return;
  try {
    storage.setItem(HAPPINESS_KEY, JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

function storageOf(
  storage?: Storage | null,
): Storage | null {
  if (storage !== undefined) return storage;
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function storedHappiness(
  id: string,
  storage?: Storage | null,
): number | null {
  const map = readMap(storageOf(storage));
  return id in map ? map[id]! : null;
}

export function getHappiness(
  id: string,
  storage?: Storage | null,
): number {
  return storedHappiness(id, storage) ?? DEFAULT_HAPPINESS;
}

export function setHappiness(
  id: string,
  value: number,
  storage?: Storage | null,
): number {
  const store = storageOf(storage);
  const map = readMap(store);
  const next = clamp(Math.round(value));
  map[id] = next;
  writeMap(store, map);
  return next;
}

export function adjustHappiness(
  id: string,
  delta: number,
  storage?: Storage | null,
): number {
  return setHappiness(id, getHappiness(id, storage) + delta, storage);
}

/** Slow idle loss: about 0.5 points per minute. */
export function idleDecay(elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return (elapsedMs / 60_000) * 0.5;
}

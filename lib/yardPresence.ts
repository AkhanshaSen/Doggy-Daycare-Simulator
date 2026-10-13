export type YardPlace = "yard" | "indoor" | "away";

export type PresenceEntry = {
  place: YardPlace;
  until?: string;
};

export const PRESENCE_KEY = "doggy-daycare-presence";

function readMap(storage: Storage | null): Record<string, PresenceEntry> {
  if (!storage) return {};
  try {
    const raw = storage.getItem(PRESENCE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, PresenceEntry> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const place = (value as PresenceEntry).place;
      if (place !== "yard" && place !== "indoor" && place !== "away") continue;
      const until = (value as PresenceEntry).until;
      out[id] = {
        place,
        until: typeof until === "string" ? until : undefined,
      };
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(
  storage: Storage | null,
  map: Record<string, PresenceEntry>,
): void {
  if (!storage) return;
  try {
    storage.setItem(PRESENCE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

function storageOf(storage?: Storage | null): Storage | null {
  if (storage !== undefined) return storage;
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function getPresence(
  dogId: string,
  storage?: Storage | null,
  now: Date = new Date(),
): PresenceEntry {
  const map = readMap(storageOf(storage));
  const entry = map[dogId];
  if (!entry || entry.place === "yard") return { place: "yard" };
  if (entry.until && new Date(entry.until).getTime() <= now.getTime()) {
    return { place: "yard" };
  }
  return entry;
}

export function setPresence(
  dogId: string,
  entry: PresenceEntry,
  storage?: Storage | null,
): void {
  const store = storageOf(storage);
  const map = readMap(store);
  if (entry.place === "yard") delete map[dogId];
  else map[dogId] = entry;
  writeMap(store, map);
}

export function clearExpired(
  storage?: Storage | null,
  now: Date = new Date(),
): void {
  const store = storageOf(storage);
  const map = readMap(store);
  let changed = false;
  for (const [id, entry] of Object.entries(map)) {
    if (entry.until && new Date(entry.until).getTime() <= now.getTime()) {
      delete map[id];
      changed = true;
    }
  }
  if (changed) writeMap(store, map);
}

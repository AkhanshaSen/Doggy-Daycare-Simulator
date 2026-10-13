export type InteractionKind =
  | "sniff"
  | "play"
  | "greet"
  | "chase"
  | "nap"
  | "ball"
  | "eat"
  | "chew"
  | "splash"
  | "agility"
  | "pickup"
  | "return";

export const BALL_ID = "__ball__";
export const FOOD_ID = "__food__";
export const CHEW_ID = "__chew__";
export const POOL_ID = "__pool__";
export const AGILITY_ID = "__agility__";
export const BED_ID = "__bed__";

export type YardInteraction = {
  id: string;
  dogAId: string;
  dogAName: string;
  dogBId: string;
  dogBName: string;
  kind: InteractionKind;
  at: string;
};

export const INTERACTION_STORAGE_KEY = "doggy-daycare-interactions";
const MAX_ENTRIES = 200;
const DEDUPE_MS = 5000;

const KIND_VERBS: Record<InteractionKind, string> = {
  sniff: "sniffed",
  play: "played with",
  greet: "said hello to",
  chase: "chased",
  nap: "napped beside",
  ball: "played with",
  eat: "ate from",
  chew: "chewed",
  splash: "splashed in",
  agility: "jumped",
  pickup: "picked up",
  return: "dropped off",
};

export function happinessForKind(kind: InteractionKind): number {
  switch (kind) {
    case "play":
      return 8;
    case "chase":
      return 6;
    case "greet":
      return 4;
    case "ball":
      return 12;
    case "eat":
      return 8;
    case "chew":
      return 6;
    case "splash":
      return 10;
    case "agility":
      return 10;
    default:
      return 3;
  }
}

export function pairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
}

export function pickInteractionKind(
  moodA: string,
  moodB: string,
  roll: number = Math.random(),
): InteractionKind {
  if (moodA === "sleepy" && moodB === "sleepy") return "nap";
  if (moodA === "playful" || moodB === "playful") {
    return roll < 0.5 ? "chase" : "play";
  }
  if (moodA === "sleepy" || moodB === "sleepy") return "sniff";
  return roll < 0.5 ? "greet" : "sniff";
}

export function interactionLine(entry: YardInteraction): string {
  if (entry.kind === "pickup") {
    return `${entry.dogBName} picked up ${entry.dogAName}`;
  }
  if (entry.kind === "return") {
    return `${entry.dogBName} dropped off ${entry.dogAName}`;
  }
  if (entry.dogBId === "__bed__") {
    return `${entry.dogAName} napped on a dog bed`;
  }
  return `${entry.dogAName} ${KIND_VERBS[entry.kind]} ${entry.dogBName}`;
}

export function personalLine(entry: YardInteraction, dogId: string): string {
  if (entry.kind === "ball") return "Played with the ball";
  if (entry.kind === "eat") return "Ate from the food bowl";
  if (entry.kind === "chew") return "Chewed a bone";
  if (entry.kind === "splash") return "Splashed in the pool";
  if (entry.kind === "agility") return "Hopped the hurdle";
  if (entry.dogBId === "__bed__") return "Napped on a dog bed";
  if (entry.kind === "pickup") return `Picked up by ${entry.dogBName}`;
  if (entry.kind === "return") return `Dropped off by ${entry.dogBName}`;
  const isA = entry.dogAId === dogId;
  const other = isA ? entry.dogBName : entry.dogAName;
  if (entry.kind === "chase" && !isA) {
    return `Was chased by ${entry.dogAName}`;
  }
  const verb = KIND_VERBS[entry.kind];
  const capitalized = verb.charAt(0).toUpperCase() + verb.slice(1);
  return `${capitalized} ${other}`;
}

export function bubbleLines(
  kind: InteractionKind,
  nameA: string,
  nameB: string,
): [string, string] {
  switch (kind) {
    case "sniff":
      return ["*sniff sniff*", `Hi, ${nameA}!`];
    case "play":
      return ["Wanna play?", "Yes!"];
    case "greet":
      return [`Hi ${nameB}!`, `Hi ${nameA}!`];
    case "chase":
      return ["Catch me!", "I'm coming!"];
    case "nap":
      return ["*yawn*", "zzz"];
    case "ball":
      return ["*boing*", "Got it!"];
    case "eat":
      return ["*munch*", "Yum!"];
    case "chew":
      return ["*gnaw*", "Good bone!"];
    case "splash":
      return ["*splash*", "Whee!"];
    case "agility":
      return ["*hop*", "Made it!"];
    case "pickup":
      return ["Time to go!", "See you soon!"];
    case "return":
      return ["Welcome back!", "Let's play!"];
  }
}

function readAll(storage: Storage | null): YardInteraction[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(INTERACTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isInteraction);
  } catch {
    return [];
  }
}

function isInteraction(value: unknown): value is YardInteraction {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.dogAId === "string" &&
    typeof e.dogBId === "string" &&
    typeof e.kind === "string" &&
    typeof e.at === "string"
  );
}

function writeAll(storage: Storage | null, entries: YardInteraction[]): void {
  if (!storage) return;
  try {
    storage.setItem(
      INTERACTION_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES)),
    );
  } catch {
    // ignore quota
  }
}

export function getAllInteractions(
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): YardInteraction[] {
  return readAll(storage).sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

export function getLogForDog(
  dogId: string,
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): YardInteraction[] {
  return getAllInteractions(storage).filter(
    (e) => e.dogAId === dogId || e.dogBId === dogId,
  );
}

export function recordInteraction(
  input: Omit<YardInteraction, "id" | "at"> & { at?: string; id?: string },
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
  now: Date = new Date(),
): YardInteraction | null {
  const existing = readAll(storage);
  const at = input.at ?? now.toISOString();
  const atMs = new Date(at).getTime();
  const key = pairKey(input.dogAId, input.dogBId);
  const duplicate = existing.find((e) => {
    if (pairKey(e.dogAId, e.dogBId) !== key) return false;
    if (e.kind !== input.kind) return false;
    return Math.abs(new Date(e.at).getTime() - atMs) < DEDUPE_MS;
  });
  if (duplicate) return null;

  const entry: YardInteraction = {
    id: input.id ?? crypto.randomUUID(),
    dogAId: input.dogAId,
    dogAName: input.dogAName,
    dogBId: input.dogBId,
    dogBName: input.dogBName,
    kind: input.kind,
    at,
  };
  writeAll(storage, [entry, ...existing]);
  return entry;
}

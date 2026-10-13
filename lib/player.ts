export type PlayerProfile = {
  ownerName: string;
  dogIds: string[];
  pendingDropoffId: string | null;
};

export const PLAYER_KEY = "doggy-daycare-player";

export const EMPTY_PLAYER: PlayerProfile = {
  ownerName: "",
  dogIds: [],
  pendingDropoffId: null,
};

function cleanName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function readPlayer(
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): PlayerProfile {
  if (!storage) return { ...EMPTY_PLAYER, dogIds: [] };
  try {
    const raw = storage.getItem(PLAYER_KEY);
    if (!raw) return { ...EMPTY_PLAYER, dogIds: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { ...EMPTY_PLAYER, dogIds: [] };
    }
    const record = parsed as Record<string, unknown>;
    const dogIds = Array.isArray(record.dogIds)
      ? record.dogIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
    const pending =
      typeof record.pendingDropoffId === "string" &&
      dogIds.includes(record.pendingDropoffId)
        ? record.pendingDropoffId
        : null;
    return {
      ownerName: cleanName(record.ownerName),
      dogIds,
      pendingDropoffId: pending,
    };
  } catch {
    return { ...EMPTY_PLAYER, dogIds: [] };
  }
}

function writePlayer(profile: PlayerProfile, storage: Storage): void {
  storage.setItem(PLAYER_KEY, JSON.stringify(profile));
}

export function rememberDropoff(
  ownerName: string,
  dogId: string,
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): PlayerProfile {
  const current = readPlayer(storage);
  const dogIds = current.dogIds.includes(dogId)
    ? current.dogIds
    : [...current.dogIds, dogId];
  const next: PlayerProfile = {
    ownerName: cleanName(ownerName) || current.ownerName,
    dogIds,
    pendingDropoffId: dogId,
  };
  if (storage) writePlayer(next, storage);
  return next;
}

export function clearPendingDropoff(
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): PlayerProfile {
  const current = readPlayer(storage);
  const next: PlayerProfile = { ...current, pendingDropoffId: null };
  if (storage) writePlayer(next, storage);
  return next;
}

export function isYourDog(
  dogId: string,
  player: PlayerProfile | null | undefined,
): boolean {
  return Boolean(player && player.dogIds.includes(dogId));
}

export function latestDogId(player: PlayerProfile | null | undefined): string | null {
  if (!player || player.dogIds.length === 0) return null;
  return player.dogIds[player.dogIds.length - 1] ?? null;
}

export type VisitorKind = "pickup" | "dropoff";

export function visitorLines(input: {
  playerName: string;
  visitorName: string;
  theirDog: string;
  theirFavorite: string;
  yourDog?: string;
  yourFavorite?: string;
  kind: VisitorKind;
}): string[] {
  const you = input.playerName.trim() || "friend";
  const them = input.visitorName.trim() || "a neighbor";
  const theirDog = input.theirDog.trim() || "my pup";
  const favorite = input.theirFavorite.trim() || "playtime";
  const yourDog = input.yourDog?.trim();
  const yourFavorite = input.yourFavorite?.trim();

  if (input.kind === "dropoff") {
    const lines = [
      `${you}, ${theirDog} had a good day.`,
      `${theirDog} spent it on ${favorite}.`,
    ];
    if (yourDog) {
      lines.push(
        yourFavorite
          ? `${yourDog} still playing? They love ${yourFavorite}.`
          : `${yourDog} still playing?`,
      );
    }
    lines.push(`I'll leave ${theirDog} with the pack.`);
    return lines;
  }

  const lines = [
    yourDog
      ? `Hi ${you}, I'm ${them}. I'm here for ${theirDog}. How's ${yourDog}?`
      : `Hi ${you}, I'm ${them}. I'm here for ${theirDog}.`,
    `${theirDog} loves ${favorite}.`,
  ];
  if (yourDog && yourFavorite) {
    lines.push(`Is ${yourDog} still into ${yourFavorite}?`);
  }
  lines.push(`We'll head out for a bit, then I'll bring ${theirDog} back.`);
  return lines;
}

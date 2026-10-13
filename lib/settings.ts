import {
  type ClockSpeed,
  wrapMinutes,
} from "./clock";
import { isParkThemeId, type ParkThemeId } from "./parkThemes";

export type YardSettings = {
  themeId: ParkThemeId;
  minutes: number;
  speed: ClockSpeed;
};

export const SETTINGS_KEY = "doggy-daycare-settings";

export const DEFAULT_SETTINGS: YardSettings = {
  themeId: "classic",
  minutes: 10 * 60,
  speed: "normal",
};

function isSpeed(value: unknown): value is ClockSpeed {
  return value === "pause" || value === "normal" || value === "fast";
}

export function readSettings(
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): YardSettings {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SETTINGS };
    const record = parsed as Record<string, unknown>;
    const themeId =
      typeof record.themeId === "string" && isParkThemeId(record.themeId)
        ? record.themeId
        : DEFAULT_SETTINGS.themeId;
    const minutes =
      typeof record.minutes === "number" && Number.isFinite(record.minutes)
        ? wrapMinutes(record.minutes)
        : DEFAULT_SETTINGS.minutes;
    const speed = isSpeed(record.speed) ? record.speed : DEFAULT_SETTINGS.speed;
    return { themeId, minutes, speed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(
  settings: YardSettings,
  storage: Storage | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): void {
  if (!storage) return;
  try {
    storage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        themeId: settings.themeId,
        minutes: wrapMinutes(settings.minutes),
        speed: settings.speed,
      }),
    );
  } catch {
    // ignore quota
  }
}

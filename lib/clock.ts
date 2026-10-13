export type ClockSpeed = "pause" | "normal" | "fast";
export type DayPhase = "night" | "dawn" | "day" | "dusk";

export type NightTint = { color: string; alpha: number };

/** Game minutes added per real second. */
const RATES: Record<ClockSpeed, number> = {
  pause: 0,
  normal: 1,
  fast: 20,
};

export function wrapMinutes(minutes: number): number {
  const span = 24 * 60;
  return ((minutes % span) + span) % span;
}

export function advanceClock(
  minutes: number,
  dtSeconds: number,
  speed: ClockSpeed,
): number {
  return wrapMinutes(minutes + dtSeconds * RATES[speed]);
}

/** Day 7:00–18:00, dusk 18:00–20:00, night 20:00–6:00, dawn 6:00–7:00. */
export function phaseFor(minutes: number): DayPhase {
  const m = wrapMinutes(minutes);
  if (m >= 20 * 60 || m < 6 * 60) return "night";
  if (m < 7 * 60) return "dawn";
  if (m < 18 * 60) return "day";
  return "dusk";
}

export function isParkClosed(phase: DayPhase): boolean {
  return phase === "dusk" || phase === "night";
}

/** Flat Game Boy tint. Alpha is stepped so the sky does not get a smooth gradient. */
export function nightTint(minutes: number): NightTint {
  const phase = phaseFor(minutes);
  if (phase === "day") return { color: "#0a1028", alpha: 0 };
  if (phase === "dawn") return { color: "#203058", alpha: 0.22 };
  if (phase === "dusk") return { color: "#201038", alpha: 0.35 };
  return { color: "#0a1028", alpha: 0.55 };
}

export function formatClock(minutes: number): string {
  const m = Math.floor(wrapMinutes(minutes));
  const h = Math.floor(m / 60);
  const min = m % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min.toString().padStart(2, "0")} ${suffix}`;
}

export function phaseLabel(phase: DayPhase): string {
  if (phase === "dawn") return "Dawn";
  if (phase === "day") return "Day";
  if (phase === "dusk") return "Dusk";
  return "Night";
}

/** Stable split: about 7 in 10 pups go home at dusk. The rest sleep at the center. */
export function goesHomeAtNight(dogId: string): boolean {
  let hash = 0;
  for (let i = 0; i < dogId.length; i++) {
    hash = (Math.imul(hash, 31) + dogId.charCodeAt(i)) >>> 0;
  }
  return hash % 10 < 7;
}

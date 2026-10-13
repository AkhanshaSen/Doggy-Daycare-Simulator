/** Launch date for Founding Pup badge (first 7 days). */
export const LAUNCH_DATE = new Date("2026-10-13T00:00:00.000Z");

export const FOUNDING_PUP_WINDOW_DAYS = 7;

export type Badge = {
  id: string;
  label: string;
  icon: string;
};

export const FOUNDING_PUP: Badge = {
  id: "founding_pup",
  label: "Founding Pup",
  icon: "★",
};

export function hasFoundingPup(
  createdAt: string,
  launchDate: Date = LAUNCH_DATE,
): boolean {
  const created = new Date(createdAt).getTime();
  const launch = launchDate.getTime();
  const windowMs = FOUNDING_PUP_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return created >= launch && created < launch + windowMs;
}

/** Compute all badges for a dog from its data (not stored). */
export function getBadgesForDog(createdAt: string): Badge[] {
  const badges: Badge[] = [];
  if (hasFoundingPup(createdAt)) {
    badges.push(FOUNDING_PUP);
  }
  return badges;
}

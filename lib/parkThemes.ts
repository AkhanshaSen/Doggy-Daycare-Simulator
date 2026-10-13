import { GB } from "./gbPalette";

/** Scenery colors a park style can recolor. Dogs and the building stay on the base palette. */
export type SceneryColors = {
  grass: string;
  grassDark: string;
  grassShade: string;
  sky: string;
  dirt: string;
  dirtDark: string;
  bark: string;
  wood: string;
  flowerPink: string;
  flowerYellow: string;
  flowerWhite: string;
  tree: string;
};

export type ParkThemeId = "classic" | "autumn" | "blossom" | "snow" | "seaside";

export type ParkTheme = {
  id: ParkThemeId;
  label: string;
  scenery: Partial<SceneryColors>;
};

const CLASSIC: SceneryColors = {
  grass: GB.grass,
  grassDark: GB.grassDark,
  grassShade: GB.grassShade,
  sky: GB.sky,
  dirt: GB.dirt,
  dirtDark: GB.dirtDark,
  bark: GB.bark,
  wood: GB.wood,
  flowerPink: GB.flowerPink,
  flowerYellow: GB.flowerYellow,
  flowerWhite: GB.flowerWhite,
  tree: GB.grassShade,
};

export const PARK_THEMES: Record<ParkThemeId, ParkTheme> = {
  classic: { id: "classic", label: "Classic Green", scenery: {} },
  autumn: {
    id: "autumn",
    label: "Golden Autumn",
    scenery: {
      grass: "#c4a040",
      grassDark: "#a08030",
      grassShade: "#705010",
      sky: "#f0d8a0",
      dirt: "#a07040",
      dirtDark: "#684020",
      bark: "#503010",
      wood: "#a86830",
      flowerPink: "#e07030",
      flowerYellow: "#f0c020",
      flowerWhite: "#f8e0b0",
      tree: "#c06020",
    },
  },
  blossom: {
    id: "blossom",
    label: "Cherry Blossom",
    scenery: {
      grass: "#88b858",
      grassDark: "#689848",
      grassShade: "#306030",
      sky: "#f8d0e0",
      dirt: "#d0b090",
      dirtDark: "#907060",
      bark: "#705040",
      wood: "#c89878",
      flowerPink: "#f878a8",
      flowerYellow: "#f8c0d0",
      flowerWhite: "#fff0f4",
      tree: "#e06090",
    },
  },
  snow: {
    id: "snow",
    label: "Snowy Day",
    scenery: {
      grass: "#e8f0e0",
      grassDark: "#d0e0d8",
      grassShade: "#88a0a8",
      sky: "#d8e8f0",
      dirt: "#c8d0d0",
      dirtDark: "#889098",
      bark: "#706050",
      wood: "#d0c8b8",
      flowerPink: "#f0c0d0",
      flowerYellow: "#f8f0c0",
      flowerWhite: "#ffffff",
      tree: "#e8f0f8",
    },
  },
  seaside: {
    id: "seaside",
    label: "Seaside",
    scenery: {
      grass: "#c8d070",
      grassDark: "#a8b858",
      grassShade: "#307060",
      sky: "#a8d8f0",
      dirt: "#e0c890",
      dirtDark: "#c0a060",
      bark: "#806040",
      wood: "#d0b070",
      flowerPink: "#f09080",
      flowerYellow: "#f8e060",
      flowerWhite: "#f8f8f0",
      tree: "#208060",
    },
  },
};

export const PARK_THEME_LIST: ParkTheme[] = [
  PARK_THEMES.classic,
  PARK_THEMES.autumn,
  PARK_THEMES.blossom,
  PARK_THEMES.snow,
  PARK_THEMES.seaside,
];

export function isParkThemeId(value: string): value is ParkThemeId {
  return value in PARK_THEMES;
}

export function sceneryFor(id: ParkThemeId): SceneryColors {
  const theme = PARK_THEMES[id] ?? PARK_THEMES.classic;
  return { ...CLASSIC, ...theme.scenery };
}

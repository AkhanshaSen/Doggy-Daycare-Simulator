import type { NightTint } from "./clock";
import { GB } from "./gbPalette";
import {
  appearanceForOwner,
  type OwnerAppearance,
} from "./ownerAppearance";
import {
  sceneryFor,
  type ParkThemeId,
  type SceneryColors,
} from "./parkThemes";
import type { AccessoryId, BreedId, Mood } from "./types";
import {
  getBuildingRect,
  getDoorPoint,
  getPlayArea,
  type Rect,
} from "./yardLayout";

export const SPRITE_SIZE = 32;

let activeScenery: SceneryColors = sceneryFor("classic");

export function setParkTheme(id: ParkThemeId): void {
  activeScenery = sceneryFor(id);
}

export function getActiveScenery(): SceneryColors {
  return activeScenery;
}

type Palette = {
  body: string;
  belly: string;
  outline: string;
  ear: string;
  snout: string;
};

const PALETTES: Record<string, Palette> = {
  cream: {
    body: "#E8C9A0",
    belly: "#F5E6D3",
    outline: "#5C3D2E",
    ear: "#C4896A",
    snout: "#F5E6D3",
  },
  red: {
    body: "#C46A3B",
    belly: "#E8B896",
    outline: "#4A2A1A",
    ear: "#8B3A1A",
    snout: "#E8B896",
  },
  brown: {
    body: "#8B5A2B",
    belly: "#C4A574",
    outline: "#3D2410",
    ear: "#6B3F1A",
    snout: "#C4A574",
  },
  grey: {
    body: "#8A8A8A",
    belly: "#C8C8C8",
    outline: "#333333",
    ear: "#666666",
    snout: "#C8C8C8",
  },
  gold: {
    body: "#D4A84B",
    belly: "#F0D9A0",
    outline: "#5C4010",
    ear: "#B8860B",
    snout: "#F0D9A0",
  },
  blackwhite: {
    body: "#2A2A2A",
    belly: "#F5F5F5",
    outline: "#111111",
    ear: "#1A1A1A",
    snout: "#F5F5F5",
  },
  white: {
    body: "#F8F8F8",
    belly: "#FFFFFF",
    outline: "#888888",
    ear: "#E0E0E0",
    snout: "#FFFFFF",
  },
  apricot: {
    body: "#F0C4A0",
    belly: "#FFE8D6",
    outline: "#8B5A3C",
    ear: "#E0A070",
    snout: "#FFE8D6",
  },
  sable: {
    body: "#C47830",
    belly: "#F0D0A0",
    outline: "#3D2410",
    ear: "#8A4018",
    snout: "#F0D0A0",
  },
  slate: {
    body: "#607888",
    belly: "#C8D8E0",
    outline: "#1A2830",
    ear: "#405868",
    snout: "#D8E8F0",
  },
  rust: {
    body: "#A04028",
    belly: "#E0A080",
    outline: "#3A140C",
    ear: "#702010",
    snout: "#F0C0A0",
  },
  tan: {
    body: "#D0A060",
    belly: "#F0E0C0",
    outline: "#5C4010",
    ear: "#A07840",
    snout: "#F8E8D0",
  },
  black: {
    body: "#2A2A2A",
    belly: "#5A5A5A",
    outline: "#0A0A0A",
    ear: "#1A1A1A",
    snout: "#3A3A3A",
  },
  blue: {
    body: "#6A88B0",
    belly: "#D0D8E8",
    outline: "#203048",
    ear: "#486080",
    snout: "#E8EEF8",
  },
};

/** Pixel coords for body frames: [x,y] filled with body color unless marked. */
type Pixel = [number, number, keyof Palette | "eye" | "nose" | "leg"] | [number, number];

function getPalette(colorId: string): Palette {
  return PALETTES[colorId] ?? PALETTES.cream!;
}

/** Breed body silhouettes — base frame (standing). Walk offsets applied later. */
function breedPixels(breed: BreedId, frame: number): Pixel[] {
  const legShift = frame % 2 === 0 ? 0 : 1;
  switch (breed) {
    case "corgi":
      return [
        // body
        [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14], [17, 14], [18, 14], [19, 14], [20, 14],
        [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15], [15, 15], [16, 15], [17, 15], [18, 15], [19, 15], [20, 15], [21, 15],
        [9, 16], [10, 16, "belly"], [11, 16, "belly"], [12, 16, "belly"], [13, 16], [14, 16], [15, 16], [16, 16], [17, 16], [18, 16], [19, 16], [20, 16], [21, 16],
        [10, 17], [11, 17, "belly"], [12, 17, "belly"], [13, 17], [14, 17], [15, 17], [16, 17], [17, 17], [18, 17], [19, 17], [20, 17],
        // head
        [18, 10], [19, 10], [20, 10], [21, 10],
        [17, 11], [18, 11], [19, 11], [20, 11], [21, 11], [22, 11],
        [17, 12], [18, 12], [19, 12, "eye"], [20, 12], [21, 12, "snout"], [22, 12, "nose"],
        [18, 13], [19, 13], [20, 13], [21, 13, "snout"],
        // ears
        [18, 8, "ear"], [19, 9, "ear"], [21, 8, "ear"], [20, 9, "ear"],
        // legs
        [11, 18 + legShift, "leg"], [12, 18 + legShift, "leg"],
        [14, 18 + (1 - legShift), "leg"], [15, 18 + (1 - legShift), "leg"],
        [17, 18 + legShift, "leg"], [18, 18 + legShift, "leg"],
        [19, 18 + (1 - legShift), "leg"], [20, 18 + (1 - legShift), "leg"],
        // tail
        [8, 14], [7, 13],
      ];
    case "dachshund":
      return [
        // long body
        [6, 15], [7, 15], [8, 15], [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15], [15, 15], [16, 15], [17, 15], [18, 15], [19, 15], [20, 15], [21, 15],
        [6, 16], [7, 16, "belly"], [8, 16, "belly"], [9, 16, "belly"], [10, 16, "belly"], [11, 16], [12, 16], [13, 16], [14, 16], [15, 16], [16, 16], [17, 16], [18, 16], [19, 16], [20, 16], [21, 16],
        [7, 17], [8, 17, "belly"], [9, 17, "belly"], [10, 17], [11, 17], [12, 17], [13, 17], [14, 17], [15, 17], [16, 17], [17, 17], [18, 17], [19, 17], [20, 17],
        // head
        [20, 11], [21, 11], [22, 11],
        [19, 12], [20, 12], [21, 12], [22, 12], [23, 12],
        [19, 13], [20, 13, "eye"], [21, 13], [22, 13, "snout"], [23, 13, "nose"], [24, 13, "snout"],
        [20, 14], [21, 14], [22, 14, "snout"], [23, 14],
        // floppy ear
        [19, 10, "ear"], [18, 11, "ear"], [18, 12, "ear"], [18, 13, "ear"],
        // short legs
        [8, 18 + legShift, "leg"], [9, 18 + legShift, "leg"],
        [12, 18 + (1 - legShift), "leg"],
        [16, 18 + legShift, "leg"],
        [19, 18 + (1 - legShift), "leg"], [20, 18 + (1 - legShift), "leg"],
        // tail
        [5, 14], [4, 13],
      ];
    case "shihtzu":
      return [
        // fluffy body
        [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13], [16, 13], [17, 13], [18, 13], [19, 13],
        [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14], [17, 14], [18, 14], [19, 14], [20, 14],
        [9, 15], [10, 15, "belly"], [11, 15, "belly"], [12, 15, "belly"], [13, 15], [14, 15], [15, 15], [16, 15], [17, 15], [18, 15], [19, 15], [20, 15],
        [10, 16], [11, 16, "belly"], [12, 16, "belly"], [13, 16], [14, 16], [15, 16], [16, 16], [17, 16], [18, 16], [19, 16],
        [11, 17], [12, 17], [13, 17], [14, 17], [15, 17], [16, 17], [17, 17], [18, 17],
        // round head + mane
        [14, 8], [15, 8], [16, 8], [17, 8], [18, 8],
        [13, 9], [14, 9], [15, 9], [16, 9], [17, 9], [18, 9], [19, 9],
        [12, 10], [13, 10], [14, 10], [15, 10], [16, 10], [17, 10], [18, 10], [19, 10], [20, 10],
        [13, 11], [14, 11], [15, 11, "eye"], [16, 11], [17, 11, "eye"], [18, 11], [19, 11],
        [14, 12], [15, 12, "snout"], [16, 12, "nose"], [17, 12, "snout"], [18, 12],
        // ears / fluff
        [12, 9, "ear"], [11, 10, "ear"], [20, 9, "ear"], [21, 10, "ear"],
        // legs
        [12, 18 + legShift, "leg"], [13, 18 + legShift, "leg"],
        [15, 18 + (1 - legShift), "leg"],
        [17, 18 + legShift, "leg"], [18, 18 + legShift, "leg"],
      ];
    case "bichon":
      return [
        // round fluffy
        [11, 13], [12, 13], [13, 13], [14, 13], [15, 13], [16, 13], [17, 13], [18, 13],
        [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14], [17, 14], [18, 14], [19, 14],
        [10, 15], [11, 15, "belly"], [12, 15, "belly"], [13, 15, "belly"], [14, 15], [15, 15], [16, 15], [17, 15], [18, 15], [19, 15],
        [11, 16], [12, 16, "belly"], [13, 16, "belly"], [14, 16], [15, 16], [16, 16], [17, 16], [18, 16],
        [12, 17], [13, 17], [14, 17], [15, 17], [16, 17], [17, 17],
        // puff head
        [13, 7], [14, 7], [15, 7], [16, 7], [17, 7],
        [12, 8], [13, 8], [14, 8], [15, 8], [16, 8], [17, 8], [18, 8],
        [11, 9], [12, 9], [13, 9], [14, 9], [15, 9], [16, 9], [17, 9], [18, 9], [19, 9],
        [12, 10], [13, 10], [14, 10, "eye"], [15, 10], [16, 10, "eye"], [17, 10], [18, 10],
        [13, 11], [14, 11, "snout"], [15, 11, "nose"], [16, 11, "snout"], [17, 11],
        [14, 12], [15, 12], [16, 12],
        // ears
        [11, 10, "ear"], [19, 10, "ear"],
        // legs
        [12, 18 + legShift, "leg"], [13, 18 + legShift, "leg"],
        [15, 18 + (1 - legShift), "leg"],
        [17, 18 + legShift, "leg"], [18, 18 + legShift, "leg"],
      ];
    case "husky":
      return [
        [8, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14], [17, 14], [18, 14],
        [7, 15], [8, 15], [9, 15, "belly"], [10, 15, "belly"], [11, 15, "belly"], [12, 15], [13, 15], [14, 15], [15, 15], [16, 15], [17, 15], [18, 15], [19, 15],
        [8, 16], [9, 16, "belly"], [10, 16, "belly"], [11, 16], [12, 16], [13, 16], [14, 16], [15, 16], [16, 16], [17, 16], [18, 16],
        [9, 17], [10, 17], [11, 17], [12, 17], [13, 17], [14, 17], [15, 17], [16, 17], [17, 17],
        [16, 8], [17, 8], [19, 8], [20, 8],
        [15, 9, "ear"], [16, 9], [17, 9], [18, 9], [19, 9], [20, 9], [21, 9, "ear"],
        [16, 10], [17, 10], [18, 10, "snout"], [19, 10], [20, 10], [21, 10],
        [16, 11], [17, 11, "eye"], [18, 11], [19, 11, "eye"], [20, 11, "snout"], [21, 11], [22, 11, "nose"],
        [17, 12], [18, 12, "snout"], [19, 12, "snout"], [20, 12, "snout"], [21, 12],
        [18, 13], [19, 13], [20, 13],
        [5, 13], [6, 12], [7, 13], [6, 14], [7, 15],
        [10, 18 + legShift, "leg"], [11, 18 + legShift, "leg"],
        [13, 18 + (1 - legShift), "leg"], [14, 18 + (1 - legShift), "leg"],
        [16, 18 + legShift, "leg"], [17, 18 + legShift, "leg"],
      ];
    case "pug":
      return [
        [11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14], [17, 14], [18, 14], [19, 14],
        [10, 15], [11, 15], [12, 15, "belly"], [13, 15, "belly"], [14, 15, "belly"], [15, 15], [16, 15], [17, 15], [18, 15], [19, 15], [20, 15],
        [10, 16], [11, 16, "belly"], [12, 16, "belly"], [13, 16], [14, 16], [15, 16], [16, 16], [17, 16], [18, 16], [19, 16], [20, 16],
        [11, 17], [12, 17], [13, 17], [14, 17], [15, 17], [16, 17], [17, 17], [18, 17], [19, 17],
        [16, 8], [17, 8], [18, 8], [19, 8], [20, 8],
        [15, 9], [16, 9], [17, 9], [18, 9, "snout"], [19, 9], [20, 9], [21, 9],
        [15, 10], [16, 10, "eye"], [17, 10], [18, 10, "snout"], [19, 10], [20, 10, "eye"], [21, 10],
        [16, 11], [17, 11, "snout"], [18, 11, "nose"], [19, 11, "snout"], [20, 11],
        [17, 12, "snout"], [18, 12, "snout"], [19, 12, "snout"],
        [15, 7, "ear"], [20, 7, "ear"],
        [9, 15], [8, 16], [8, 17],
        [12, 18 + legShift, "leg"], [13, 18 + legShift, "leg"],
        [15, 18 + (1 - legShift), "leg"],
        [17, 18 + legShift, "leg"], [18, 18 + legShift, "leg"],
      ];
    case "poodle":
      return [
        [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13], [16, 13], [17, 13], [18, 13],
        [9, 14], [10, 14], [11, 14], [12, 14], [13, 14, "belly"], [14, 14, "belly"], [15, 14], [16, 14], [17, 14], [18, 14], [19, 14],
        [9, 15], [10, 15], [11, 15, "belly"], [12, 15, "belly"], [13, 15], [14, 15], [15, 15], [16, 15], [17, 15], [18, 15], [19, 15],
        [10, 16], [11, 16], [12, 16], [13, 16], [14, 16], [15, 16], [16, 16], [17, 16], [18, 16],
        [11, 17], [12, 17], [13, 17], [14, 17], [15, 17], [16, 17], [17, 17],
        [14, 6], [15, 6], [16, 6], [17, 6],
        [13, 7], [14, 7], [15, 7], [16, 7], [17, 7], [18, 7],
        [12, 8], [13, 8], [14, 8], [15, 8], [16, 8], [17, 8], [18, 8], [19, 8],
        [13, 9], [14, 9, "eye"], [15, 9], [16, 9], [17, 9, "eye"], [18, 9],
        [14, 10], [15, 10, "snout"], [16, 10, "nose"], [17, 10, "snout"],
        [15, 11], [16, 11],
        [11, 8, "ear"], [12, 9, "ear"], [19, 9, "ear"], [20, 8, "ear"],
        [8, 14], [7, 13], [7, 15],
        [12, 18 + legShift, "leg"], [13, 18 + legShift, "leg"],
        [16, 18 + (1 - legShift), "leg"], [17, 18 + (1 - legShift), "leg"],
      ];
    case "shiba":
      return [
        [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14], [17, 14], [18, 14],
        [8, 15], [9, 15], [10, 15, "belly"], [11, 15, "belly"], [12, 15, "belly"], [13, 15], [14, 15], [15, 15], [16, 15], [17, 15], [18, 15], [19, 15],
        [9, 16], [10, 16, "belly"], [11, 16], [12, 16], [13, 16], [14, 16], [15, 16], [16, 16], [17, 16], [18, 16],
        [10, 17], [11, 17], [12, 17], [13, 17], [14, 17], [15, 17], [16, 17], [17, 17],
        [17, 7, "ear"], [18, 8, "ear"], [21, 7, "ear"], [20, 8, "ear"],
        [17, 9], [18, 9], [19, 9], [20, 9], [21, 9],
        [16, 10], [17, 10], [18, 10], [19, 10, "snout"], [20, 10], [21, 10], [22, 10],
        [17, 11], [18, 11, "eye"], [19, 11], [20, 11, "eye"], [21, 11, "snout"], [22, 11, "nose"],
        [18, 12], [19, 12, "snout"], [20, 12, "snout"], [21, 12],
        [19, 13], [20, 13],
        [7, 13], [8, 12], [8, 14], [9, 13],
        [11, 18 + legShift, "leg"], [12, 18 + legShift, "leg"],
        [14, 18 + (1 - legShift), "leg"], [15, 18 + (1 - legShift), "leg"],
        [17, 18 + legShift, "leg"], [18, 18 + legShift, "leg"],
      ];
  }
}

function accessoryPixels(accessory: AccessoryId): Pixel[] {
  if (accessory === "none") return [];
  if (accessory === "bow") {
    return [
      [15, 6], [16, 6], [17, 6],
      [14, 7], [15, 7], [16, 7], [17, 7], [18, 7],
      [15, 8], [17, 8],
    ];
  }
  // clip
  return [
    [16, 5], [17, 5],
    [16, 6], [17, 6], [18, 6],
  ];
}

function moodPixels(mood: Mood): Pixel[] {
  // small indicator above head
  if (mood === "happy") {
    return [[22, 6], [23, 5], [24, 6]]; // smile arc as dots
  }
  if (mood === "sleepy") {
    return [[22, 5], [23, 5], [24, 5], [23, 6]]; // z
  }
  // playful
  return [[22, 5], [23, 4], [24, 5], [23, 6]]; // spark
}

export type DrawDogOptions = {
  breedId: BreedId;
  colorId: string;
  accessoryId: AccessoryId;
  mood?: Mood;
  frame?: number;
  flip?: boolean;
  scale?: number;
  x?: number;
  y?: number;
};

function resolveColor(
  kind: Pixel[2] | undefined,
  palette: Palette,
  accessory: AccessoryId,
): string {
  if (!kind || kind === undefined) return palette.body;
  if (kind === "belly" || kind === "snout") return palette[kind];
  if (kind === "ear") return palette.ear;
  if (kind === "leg") return palette.body;
  if (kind === "eye") return "#1A1A1A";
  if (kind === "nose") return "#2A2A2A";
  if (kind in palette) return palette[kind as keyof Palette];
  // accessory colors
  if (accessory === "bow") return "#E85A7A";
  if (accessory === "clip") return "#5B8DEF";
  return palette.body;
}

export function drawDog(
  ctx: CanvasRenderingContext2D,
  options: DrawDogOptions,
): void {
  const {
    breedId,
    colorId,
    accessoryId,
    mood,
    frame = 0,
    flip = false,
    scale = 2,
    x = 0,
    y = 0,
  } = options;

  const palette = getPalette(colorId);
  const body = breedPixels(breedId, frame);
  const pixels = [
    ...body,
    ...accessoryPixels(accessoryId).map((p) => {
      if (accessoryId === "bow") return [p[0], p[1], "bow" as const] as const;
      if (accessoryId === "clip") return [p[0], p[1], "clip" as const] as const;
      return p;
    }),
    ...(mood ? moodPixels(mood) : []),
  ];

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);

  if (flip) {
    ctx.translate(SPRITE_SIZE * scale, 0);
    ctx.scale(-1, 1);
  }

  const occupied = new Set(pixels.map((pixel) => `${pixel[0]},${pixel[1]}`));
  ctx.fillStyle = palette.outline;
  for (const pixel of body) {
    const px = pixel[0];
    const py = pixel[1];
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const nx = px + dx;
      const ny = py + dy;
      if (occupied.has(`${nx},${ny}`)) continue;
      ctx.fillRect(nx * scale, ny * scale, scale, scale);
    }
  }

  for (const pixel of pixels) {
    const px = pixel[0];
    const py = pixel[1];
    const kind = pixel[2] as string | undefined;

    let color: string;
    if (kind === "bow") color = "#E85A7A";
    else if (kind === "clip") color = "#5B8DEF";
    else if (kind === "happy" || kind === "sleepy" || kind === "playful") {
      color = mood === "sleepy" ? "#6B8CFF" : mood === "playful" ? "#FFB347" : "#FF6B9A";
    } else {
      color = resolveColor(kind as Pixel[2], palette, accessoryId);
    }

    const isMoodPixel =
      mood &&
      px >= 22 &&
      py <= 6 &&
      !body.some((b) => b[0] === px && b[1] === py);

    if (isMoodPixel) {
      color =
        mood === "sleepy"
          ? "#6B8CFF"
          : mood === "playful"
            ? "#FFB347"
            : "#FF6B9A";
    }

    ctx.fillStyle = color;
    ctx.fillRect(px * scale, py * scale, scale, scale);
    if (kind === "eye" && scale >= 2) {
      ctx.fillStyle = "#F8F8F8";
      ctx.fillRect(px * scale, py * scale, 1, 1);
    }
  }

  ctx.restore();
}

/** Draw dog onto an offscreen canvas and return a data URL (for img tags). */
export function dogToDataUrl(options: DrawDogOptions, scale = 3): string {
  const size = SPRITE_SIZE * scale;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  drawDog(ctx, { ...options, scale, x: 0, y: 0 });
  return canvas.toDataURL();
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  variant: 0 | 1,
): void {
  const top = variant === 1 ? y - 4 : y;
  const scene = activeScenery;
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 6, y + 16, 6, 12);
  ctx.fillStyle = scene.bark;
  ctx.fillRect(x + 7, y + 17, 4, 10);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x - 1, top + 3, 20, 16);
  ctx.fillRect(x + 2, top - 1, 14, 8);
  ctx.fillStyle = scene.tree;
  ctx.fillRect(x, top + 4, 18, 14);
  ctx.fillRect(x + 3, top, 12, 8);
  ctx.fillStyle = scene.grass;
  ctx.fillRect(x + 4, top + 2, 5, 3);
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  variant: number,
): void {
  const scene = activeScenery;
  ctx.fillStyle = scene.grassShade;
  ctx.fillRect(x + 2, y + 3, 2, 5);
  const petal =
    variant === 0
      ? scene.flowerPink
      : variant === 1
        ? scene.flowerYellow
        : scene.flowerWhite;
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x - 1, y - 1, 8, 6);
  ctx.fillStyle = petal;
  ctx.fillRect(x, y + 1, 2, 2);
  ctx.fillRect(x + 4, y + 1, 2, 2);
  ctx.fillRect(x + 2, y, 2, 2);
  ctx.fillRect(x + 2, y + 2, 2, 2);
  ctx.fillStyle = variant === 2 ? scene.flowerYellow : scene.flowerWhite;
  ctx.fillRect(x + 2, y + 1, 2, 2);
}

function drawFlowerBed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
): void {
  const scene = activeScenery;
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x, y + 4, width, 12);
  ctx.fillStyle = scene.dirtDark;
  ctx.fillRect(x + 1, y + 5, width - 2, 10);
  ctx.fillStyle = scene.dirt;
  ctx.fillRect(x + 2, y + 6, width - 4, 6);
  const count = Math.max(1, Math.floor((width - 8) / 8));
  for (let i = 0; i < count; i++) {
    drawFlower(ctx, x + 4 + i * 8, y, i % 3);
  }
}

function drawFence(
  ctx: CanvasRenderingContext2D,
  area: Rect,
  gapCenterX: number,
): void {
  const scene = activeScenery;
  const rail = (x1: number, x2: number, y: number) => {
    if (x2 - x1 < 4) return;
    ctx.fillStyle = GB.ink;
    ctx.fillRect(x1, y, x2 - x1, 3);
    ctx.fillStyle = scene.wood;
    ctx.fillRect(x1, y, x2 - x1, 2);
  };
  const post = (x: number, y: number) => {
    ctx.fillStyle = GB.ink;
    ctx.fillRect(x, y, 4, 16);
    ctx.fillStyle = scene.bark;
    ctx.fillRect(x + 1, y + 1, 2, 14);
  };
  const gap = 40;
  const gapL = gapCenterX - gap / 2;
  const gapR = gapCenterX + gap / 2;
  const top = area.y;
  const bottom = area.y + area.h;
  const left = area.x;
  const right = area.x + area.w;
  rail(left, gapL, top + 4);
  rail(gapR, right, top + 4);
  rail(left, gapL, top + 10);
  rail(gapR, right, top + 10);
  rail(left, right, bottom - 8);
  rail(left, right, bottom - 2);
  for (let x = left; x <= right - 4; x += 28) {
    const inGap = x > gapL - 4 && x < gapR;
    if (!inGap) post(x, top);
    post(x, bottom - 14);
  }
  post(left, top + 2);
  post(right - 4, top + 2);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(left, top + 4, 3, bottom - top);
  ctx.fillRect(right - 3, top + 4, 3, bottom - top - 2);
  ctx.fillStyle = scene.wood;
  ctx.fillRect(left + 1, top + 6, 1, bottom - top - 8);
  ctx.fillRect(right - 2, top + 6, 1, bottom - top - 8);
}

function drawSignpost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 6, y + 10, 4, 16);
  ctx.fillStyle = activeScenery.bark;
  ctx.fillRect(x + 7, y + 11, 2, 14);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x, y, 28, 12);
  ctx.fillStyle = GB.menu;
  ctx.fillRect(x + 2, y + 2, 24, 8);
  ctx.fillStyle = GB.ink;
  ctx.font = "7px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PARK", x + 14, y + 8);
}

export function drawGrassBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  topSafe = 110,
): void {
  const scene = activeScenery;
  ctx.fillStyle = scene.sky;
  ctx.fillRect(0, 0, width, 36);
  const band = 12;
  for (let y = 28; y < height; y += band) {
    ctx.fillStyle = Math.floor((y - 28) / band) % 2 === 0 ? scene.grass : scene.grassDark;
    ctx.fillRect(0, y, width, band);
  }
  drawParkScenery(ctx, width, height, topSafe);
}

function drawParkScenery(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  topSafe: number,
): void {
  const building = getBuildingRect(width, height, topSafe);
  const area = getPlayArea(width, height, topSafe);
  const door = getDoorPoint(building);
  const trees = [
    { x: 8, y: Math.max(8, building.y - 4) },
    { x: Math.max(8, building.x - 40), y: building.y + 6 },
    { x: building.x + building.w + 14, y: building.y + 6 },
    { x: width - 36, y: Math.max(8, building.y - 4) },
  ];
  trees.forEach((tree, index) => {
    if (tree.x < 4 || tree.x > width - 28) return;
    drawTree(ctx, tree.x, tree.y, index % 2 === 0 ? 0 : 1);
  });
  const bedW = Math.min(88, Math.floor(area.w * 0.22));
  drawFlowerBed(ctx, area.x + 12, area.y + area.h - 36, bedW);
  drawFlowerBed(ctx, area.x + area.w - bedW - 12, area.y + area.h - 36, bedW);
  drawFence(ctx, area, door.x);
  drawSignpost(ctx, Math.min(width - 40, door.x + 36), area.y - 6);
}

export function drawDirtPath(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = fromX + (toX - fromX) * t;
    const y = fromY + (toY - fromY) * t;
    ctx.fillStyle = GB.ink;
    ctx.fillRect(x - 7, y - 1, 14, 8);
    ctx.fillStyle = i % 2 === 0 ? activeScenery.dirt : activeScenery.dirtDark;
    ctx.fillRect(x - 6, y, 12, 6);
  }
}

export function drawDaycareBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  doorOpen: boolean,
  night = false,
): void {
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 6, y - 2, width - 12, 14);
  ctx.fillStyle = GB.roof;
  ctx.fillRect(x + 8, y, width - 16, 10);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x - 2, y + 8, width + 4, height - 6);
  ctx.fillStyle = GB.wall;
  ctx.fillRect(x, y + 10, width, height - 10);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 8, y + 16, 20, 16);
  ctx.fillRect(x + width - 28, y + 16, 20, 16);
  ctx.fillStyle = night ? "#f8e060" : GB.window;
  ctx.fillRect(x + 10, y + 18, 16, 12);
  ctx.fillRect(x + width - 26, y + 18, 16, 12);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 16, y + 22, 4, 4);
  ctx.fillRect(x + width - 20, y + 22, 4, 4);
  const doorX = x + width / 2 - 8;
  const doorY = y + height - 22;
  ctx.fillStyle = GB.ink;
  ctx.fillRect(doorX - 2, doorY - 2, 20, 26);
  ctx.fillStyle = doorOpen ? GB.doorDark : GB.door;
  ctx.fillRect(doorX, doorY, 16, 22);
  if (doorOpen) {
    ctx.fillStyle = GB.ink;
    ctx.fillRect(doorX + 10, doorY + 2, 6, 18);
  }
  ctx.fillStyle = GB.ink;
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Daycare", x + width / 2, y + 8);
}

export function drawNightOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tint: NightTint,
): void {
  if (tint.alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = tint.alpha;
  ctx.fillStyle = tint.color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Window glow drawn after the night tint so the daycare stays lit. */
export function drawWindowLights(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
): void {
  ctx.fillStyle = "#f8e060";
  ctx.fillRect(x + 12, y + 20, 12, 8);
  ctx.fillRect(x + width - 24, y + 20, 12, 8);
  ctx.fillStyle = "#fff8c0";
  ctx.fillRect(x + 13, y + 21, 4, 3);
  ctx.fillRect(x + width - 23, y + 21, 4, 3);
}

export function drawOwner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  flip: boolean,
  scale = 2,
  appearance?: OwnerAppearance,
): void {
  const look = appearance ?? appearanceForOwner("Owner", "default");
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (flip) {
    ctx.translate(16, 0);
    ctx.scale(-1, 1);
  }
  const step = frame % 2 === 0 ? 0 : 2;
  const px = (color: string, rx: number, ry: number, rw: number, rh: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(rx, ry, rw, rh);
  };
  px(GB.ink, 3, 0, 10, 8);
  px(look.hair, 4, 1, 8, 5);
  if (look.accessory === "cap") {
    px(look.shirtShade, 2, 0, 12, 3);
    px(look.shirt, 3, 1, 10, 2);
    px(look.shirtShade, 1, 2, 5, 2);
  }
  px(GB.ink, 4, 5, 8, 7);
  px(look.skin, 5, 6, 6, 5);
  px(look.skinShade, 5, 9, 6, 2);
  px(GB.ink, 6, 7, 1, 2);
  px(GB.ink, 9, 7, 1, 2);
  px(GB.ink, 2, 11, 12, 9);
  px(look.shirt, 3, 12, 10, 7);
  px(look.shirtShade, 3, 16, 10, 3);
  if (look.accessory === "bag") {
    px(GB.ink, 12, 12, 5, 7);
    px(look.pants, 13, 13, 3, 5);
  }
  px(GB.ink, 3, 18, 5, 7 + step);
  px(GB.ink, 8, 18, 5, 7 + (2 - step));
  px(look.pants, 4, 19, 3, 5 + step);
  px(look.pantsShade, 4, 22, 3, 2);
  px(look.pants, 9, 19, 3, 5 + (2 - step));
  px(look.pantsShade, 9, 22, 3, 2);
  ctx.restore();
}

export function drawLeash(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  ctx.save();
  ctx.strokeStyle = GB.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function propShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
): void {
  ctx.fillStyle = activeScenery.grassShade;
  ctx.fillRect(x + 2, y, w, 2);
}

export function drawWaterBowl(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
): void {
  propShadow(ctx, x + 1, y + 16, 26);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 3, y + 4, 24, 12);
  ctx.fillRect(x + 1, y + 6, 28, 8);
  ctx.fillStyle = GB.metal;
  ctx.fillRect(x + 4, y + 5, 22, 10);
  ctx.fillRect(x + 2, y + 7, 26, 6);
  ctx.fillStyle = GB.metalDark;
  ctx.fillRect(x + 4, y + 12, 22, 2);
  ctx.fillStyle = GB.flowerWhite;
  ctx.fillRect(x + 5, y + 6, 8, 2);
  ctx.fillStyle = active ? GB.waterLite : GB.water;
  ctx.fillRect(x + 6, y + 8, 18, 5);
  ctx.fillStyle = GB.waterLite;
  ctx.fillRect(x + 8, y + 9, 6, 1);
  ctx.fillRect(x + 16, y + 11, 5, 1);
  if (active) {
    ctx.fillStyle = GB.flowerWhite;
    ctx.fillRect(x + 22, y + 1, 2, 2);
    ctx.fillRect(x + 26, y - 1, 2, 2);
  }
}

export function drawFoodBowl(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
): void {
  propShadow(ctx, x + 1, y + 18, 28);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 2, y + 6, 26, 12);
  ctx.fillRect(x, y + 8, 30, 8);
  ctx.fillStyle = "#e07030";
  ctx.fillRect(x + 3, y + 7, 24, 10);
  ctx.fillRect(x + 1, y + 9, 28, 6);
  ctx.fillStyle = "#a04818";
  ctx.fillRect(x + 3, y + 14, 24, 2);
  ctx.fillStyle = active ? "#f8d878" : "#c88830";
  ctx.fillRect(x + 6, y + 8, 18, 6);
  ctx.fillStyle = GB.dirtDark;
  ctx.fillRect(x + 8, y + 6, 4, 3);
  ctx.fillRect(x + 13, y + 5, 4, 4);
  ctx.fillRect(x + 18, y + 6, 3, 3);
  ctx.fillStyle = GB.flowerWhite;
  ctx.fillRect(x + 7, y + 9, 3, 1);
}

export function drawChewBone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
): void {
  propShadow(ctx, x + 2, y + 14, 22);
  const bone = active ? GB.flowerWhite : "#f0e0c0";
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 2, y + 4, 20, 8);
  ctx.fillRect(x, y + 2, 6, 6);
  ctx.fillRect(x, y + 8, 6, 6);
  ctx.fillRect(x + 18, y + 2, 6, 6);
  ctx.fillRect(x + 18, y + 8, 6, 6);
  ctx.fillStyle = bone;
  ctx.fillRect(x + 3, y + 5, 18, 6);
  ctx.fillRect(x + 1, y + 3, 4, 4);
  ctx.fillRect(x + 1, y + 9, 4, 4);
  ctx.fillRect(x + 19, y + 3, 4, 4);
  ctx.fillRect(x + 19, y + 9, 4, 4);
  ctx.fillStyle = "#c8b090";
  ctx.fillRect(x + 3, y + 9, 18, 2);
  ctx.fillStyle = GB.flowerWhite;
  ctx.fillRect(x + 6, y + 6, 4, 1);
}

export function drawKiddiePool(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
): void {
  propShadow(ctx, x + 2, y + 24, 42);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 4, y + 6, 38, 18);
  ctx.fillRect(x + 2, y + 8, 42, 14);
  ctx.fillStyle = "#f07098";
  ctx.fillRect(x + 4, y + 7, 38, 16);
  ctx.fillRect(x + 2, y + 9, 42, 12);
  ctx.fillStyle = "#c04070";
  ctx.fillRect(x + 4, y + 18, 38, 4);
  ctx.fillStyle = active ? GB.waterLite : GB.water;
  ctx.fillRect(x + 6, y + 10, 34, 8);
  ctx.fillStyle = "#3870c8";
  ctx.fillRect(x + 8, y + 14, 10, 2);
  ctx.fillRect(x + 22, y + 12, 12, 2);
  ctx.fillStyle = GB.flowerWhite;
  ctx.fillRect(x + 10, y + 11, 4, 1);
  ctx.fillRect(x + 26, y + 15, 6, 1);
  if (active) {
    ctx.fillStyle = GB.flowerWhite;
    ctx.fillRect(x + 12, y + 2, 2, 2);
    ctx.fillRect(x + 20, y, 2, 2);
    ctx.fillRect(x + 30, y + 3, 2, 2);
  }
}

export function drawAgilityHurdle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
): void {
  propShadow(ctx, x + 2, y + 24, 36);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 2, y + 2, 5, 22);
  ctx.fillRect(x + 32, y + 2, 5, 22);
  ctx.fillRect(x, y + 20, 9, 4);
  ctx.fillRect(x + 30, y + 20, 9, 4);
  ctx.fillStyle = GB.bark;
  ctx.fillRect(x + 3, y + 3, 3, 18);
  ctx.fillRect(x + 33, y + 3, 3, 18);
  ctx.fillStyle = active ? GB.flowerYellow : "#f07830";
  ctx.fillRect(x + 2, y + 8, 36, 5);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 2, y + 7, 36, 1);
  ctx.fillRect(x + 2, y + 13, 36, 1);
  ctx.fillStyle = GB.flowerWhite;
  ctx.fillRect(x + 8, y + 9, 4, 3);
  ctx.fillRect(x + 16, y + 9, 4, 3);
  ctx.fillRect(x + 24, y + 9, 4, 3);
  ctx.fillStyle = GB.flowerPink;
  ctx.fillRect(x + 2, y, 3, 4);
  ctx.fillRect(x + 34, y, 3, 4);
  ctx.fillStyle = GB.flowerWhite;
  ctx.fillRect(x + 3, y + 1, 1, 2);
  ctx.fillRect(x + 35, y + 1, 1, 2);
}

export function drawDogBed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
): void {
  propShadow(ctx, x + 2, y + 18, 32);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x, y + 4, 36, 14);
  ctx.fillStyle = active ? "#f0c0a0" : "#c08060";
  ctx.fillRect(x + 2, y + 6, 32, 10);
  ctx.fillStyle = "#a06040";
  ctx.fillRect(x + 2, y + 13, 32, 3);
  ctx.fillStyle = GB.flowerWhite;
  ctx.fillRect(x + 4, y + 7, 12, 7);
  ctx.fillStyle = "#f8e8d8";
  ctx.fillRect(x + 5, y + 8, 6, 3);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 18, y + 9, 2, 1);
  ctx.fillRect(x + 22, y + 9, 2, 1);
  ctx.fillRect(x + 26, y + 9, 2, 1);
  ctx.fillRect(x + 18, y + 12, 2, 1);
  ctx.fillRect(x + 22, y + 12, 2, 1);
}

const BALL_COLORS = ["#E24B32", "#5B8DEF", "#E8B423", "#3E9A45", "#C46AD4"];

export function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bounce: number,
  active: boolean,
  ballIndex = 0,
): void {
  const by = y - (active ? bounce : 0);
  const color = BALL_COLORS[ballIndex % BALL_COLORS.length] ?? "#E24B32";
  propShadow(ctx, x + 1, by + 12, 12);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 3, by, 8, 14);
  ctx.fillRect(x + 1, by + 2, 12, 10);
  ctx.fillStyle = active ? GB.flowerWhite : color;
  ctx.fillRect(x + 3, by + 1, 8, 12);
  ctx.fillRect(x + 2, by + 3, 10, 8);
  ctx.fillStyle = active ? color : GB.flowerWhite;
  ctx.fillRect(x + 4, by + 3, 3, 3);
  ctx.fillRect(x + 6, by + 5, 2, 5);
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x + 7, by + 2, 1, 10);
}

export function drawHappinessBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  ratio: number,
): void {
  const clamped = Math.max(0, Math.min(1, ratio));
  ctx.fillStyle = GB.ink;
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = GB.menu;
  ctx.fillRect(x + 1, y + 1, width - 2, 3);
  const fill = Math.max(0, Math.round((width - 2) * clamped));
  ctx.fillStyle = clamped > 0.6 ? GB.good : clamped > 0.35 ? GB.mid : GB.low;
  if (fill > 0) ctx.fillRect(x + 1, y + 1, fill, 3);
}

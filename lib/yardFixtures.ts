import {
  getBuildingRect,
  layoutBallPoints,
  overlapsRect,
  type Rect,
} from "./yardLayout";

export type FixtureKind =
  | "water"
  | "ball"
  | "food"
  | "chew"
  | "pool"
  | "agility"
  | "bed";

export type Fixture = {
  id: string;
  kind: FixtureKind;
  x: number;
  y: number;
  hitW: number;
  hitH: number;
  ballIndex?: number;
};

function place(
  id: string,
  kind: FixtureKind,
  x: number,
  y: number,
  hitW: number,
  hitH: number,
  width: number,
  height: number,
  floor: number,
): Fixture {
  return {
    id,
    kind,
    x: Math.max(8, Math.min(width - hitW - 8, x)),
    y: Math.max(floor, Math.min(height - hitH - 12, y)),
    hitW,
    hitH,
  };
}

export function layoutFixtures(
  width: number,
  height: number,
  topSafe: number,
  ballCount = 5,
): Fixture[] {
  const building = getBuildingRect(width, height, topSafe);
  const floor = building.y + building.h + 16;
  const bottom = height - 40;

  const fixtures: Fixture[] = [
    place("water", "water", 14, floor + 6, 30, 22, width, height, floor),
    place("food", "food", 56, floor + 40, 30, 22, width, height, floor),
    place(
      "bed",
      "bed",
      Math.max(8, building.x - 48),
      floor + 4,
      36,
      20,
      width,
      height,
      floor,
    ),
    place("chew", "chew", width * 0.3, floor + 96, 26, 16, width, height, floor),
    place(
      "pool",
      "pool",
      Math.max(building.x + building.w + 16, width * 0.62),
      Math.min(bottom, floor + 52),
      46,
      28,
      width,
      height,
      floor,
    ),
    place(
      "agility",
      "agility",
      width * 0.46,
      Math.min(bottom, floor + 130),
      40,
      28,
      width,
      height,
      floor,
    ),
  ];

  for (const fixture of fixtures) {
    if (
      overlapsRect(fixture.x, fixture.y, fixture.hitW, fixture.hitH, building, 8)
    ) {
      fixture.y = Math.min(height - fixture.hitH - 12, floor + 24);
      fixture.x = Math.max(8, Math.min(width - fixture.hitW - 8, 12));
    }
  }

  const avoid: Rect[] = fixtures.map((fixture) => ({
    x: fixture.x,
    y: fixture.y,
    w: fixture.hitW,
    h: fixture.hitH,
  }));
  const balls = layoutBallPoints(width, height, topSafe, ballCount, avoid).map(
    (point, index): Fixture => ({
      id: `ball-${index}`,
      kind: "ball",
      x: point.x,
      y: point.y,
      hitW: 18,
      hitH: 18,
      ballIndex: index,
    }),
  );
  return [...fixtures, ...balls];
}

export function livelyFixture(kind: FixtureKind): boolean {
  return kind === "ball" || kind === "pool" || kind === "agility";
}

export function hitFixture(
  fixtures: Fixture[],
  x: number,
  y: number,
): Fixture | null {
  for (const fixture of [...fixtures].reverse()) {
    if (
      x >= fixture.x - 6 &&
      x <= fixture.x + fixture.hitW + 6 &&
      y >= fixture.y - 6 &&
      y <= fixture.y + fixture.hitH + 8
    ) {
      return fixture;
    }
  }
  return null;
}

export function buildingContains(
  building: Rect,
  x: number,
  y: number,
): boolean {
  return (
    x >= building.x &&
    x <= building.x + building.w &&
    y >= building.y &&
    y <= building.y + building.h
  );
}

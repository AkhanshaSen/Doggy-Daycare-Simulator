export type Rect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };

export function getBuildingRect(
  width: number,
  height: number,
  topSafe: number,
): Rect {
  const w = Math.min(168, Math.max(128, Math.floor(width * 0.3)));
  const h = 78;
  return {
    x: Math.max(12, Math.floor((width - w) / 2)),
    y: topSafe + 6,
    w,
    h,
  };
}

export function getDoorPoint(building: Rect): Point {
  return {
    x: building.x + building.w / 2,
    y: building.y + building.h - 6,
  };
}

/** Fenced lawn below the daycare building. */
export function getPlayArea(
  width: number,
  height: number,
  topSafe: number,
): Rect {
  const building = getBuildingRect(width, height, topSafe);
  const y = building.y + building.h + 16;
  return {
    x: 16,
    y,
    w: Math.max(80, width - 32),
    h: Math.max(72, height - y - 14),
  };
}

/** Even slots so new pups do not stack on top of each other. */
export function looseSpawnPoint(
  index: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): Point {
  const spanX = Math.max(48, maxX - minX);
  const spanY = Math.max(48, maxY - minY);
  const cols = Math.max(3, Math.floor(spanX / 96));
  const col = index % cols;
  const row = Math.floor(index / cols) % 3;
  const cellW = spanX / cols;
  const cellH = spanY / 3;
  return {
    x: minX + col * cellW + (index % 2) * 10,
    y: Math.min(maxY, minY + row * cellH * 0.85 + (index % 3) * 6),
  };
}

export function overlapsRect(
  x: number,
  y: number,
  width: number,
  height: number,
  rect: Rect,
  pad = 8,
): boolean {
  return !(
    x + width < rect.x - pad ||
    x > rect.x + rect.w + pad ||
    y + height < rect.y - pad ||
    y > rect.y + rect.h + pad
  );
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function layoutBallPoints(
  width: number,
  height: number,
  topSafe: number,
  count = 5,
  avoid: Rect[] = [],
): Point[] {
  const building = getBuildingRect(width, height, topSafe);
  const rand = mulberry32(width * 17 + height * 3 + count);
  const points: Point[] = [];
  let guard = 0;
  while (points.length < count && guard < 160) {
    guard += 1;
    const x = 20 + rand() * Math.max(20, width - 50);
    const y =
      building.y +
      building.h +
      28 +
      rand() * Math.max(20, height - building.y - building.h - 70);
    if (overlapsRect(x, y, 16, 16, building, 16)) continue;
    if (avoid.some((rect) => overlapsRect(x, y, 16, 16, rect, 12))) continue;
    if (points.some((point) => Math.hypot(point.x - x, point.y - y) < 48)) continue;
    points.push({ x, y });
  }
  return points;
}

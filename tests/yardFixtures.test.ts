import { describe, expect, it } from "vitest";
import { hitFixture, layoutFixtures } from "@/lib/yardFixtures";
import { getBuildingRect, overlapsRect } from "@/lib/yardLayout";

describe("yard fixtures", () => {
  it("places at least five balls away from the building", () => {
    const fixtures = layoutFixtures(900, 700, 8, 5);
    const balls = fixtures.filter((fixture) => fixture.kind === "ball");
    const building = getBuildingRect(900, 700, 8);
    expect(balls.length).toBeGreaterThanOrEqual(5);
    for (const ball of balls) {
      expect(
        overlapsRect(ball.x, ball.y, ball.hitW, ball.hitH, building, 4),
      ).toBe(false);
    }
  });

  it("places daycare items that stay off the building", () => {
    const fixtures = layoutFixtures(900, 700, 8, 5);
    const building = getBuildingRect(900, 700, 8);
    const kinds = ["water", "food", "chew", "pool", "agility", "bed"];
    for (const kind of kinds) {
      const fixture = fixtures.find((item) => item.kind === kind);
      expect(fixture, kind).toBeTruthy();
      expect(
        overlapsRect(
          fixture!.x,
          fixture!.y,
          fixture!.hitW,
          fixture!.hitH,
          building,
          2,
        ),
      ).toBe(false);
    }
    const pool = fixtures.find((item) => item.kind === "pool")!;
    expect(hitFixture(fixtures, pool.x + 8, pool.y + 10)?.kind).toBe("pool");
  });
});

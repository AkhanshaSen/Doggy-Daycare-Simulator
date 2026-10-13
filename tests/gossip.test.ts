import { describe, expect, it } from "vitest";
import { gossipBetween, type GossipDog } from "@/lib/gossip";
import { personalLine, recordInteraction } from "@/lib/interactions";

function dog(partial: Partial<GossipDog> & Pick<GossipDog, "id" | "name" | "owner">): GossipDog {
  return {
    mood: "happy",
    personality: "social",
    favoriteThing: "treats",
    age: 3,
    ...partial,
  };
}

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
  };
}

describe("owner gossip", () => {
  const pepper = dog({
    id: "pepper",
    name: "Pepper",
    owner: "Ava",
    personality: "social",
    mood: "playful",
    favoriteThing: "chasing leaves",
    age: 6,
  });
  const cloud = dog({
    id: "cloud",
    name: "Cloud",
    owner: "Sam",
    personality: "shy",
    mood: "sleepy",
    favoriteThing: "fluffy blankets",
    age: 4,
  });

  it("mentions the owner or a favorite thing", () => {
    const script = gossipBetween(pepper, cloud, 0.2);
    const blob = `${script.detail} ${script.lineA} ${script.lineB}`;
    expect(blob).toMatch(/Ava|chasing leaves|Sam|fluffy blankets/);
    expect(script.bubbles).toHaveLength(2);
  });

  it("gives shy and social dogs different lines about the same human", () => {
    const social = gossipBetween(pepper, cloud, 0);
    const shy = gossipBetween({ ...pepper, personality: "shy" }, cloud, 0);
    expect(social.lineA).not.toBe(shy.lineA);
    expect(shy.lineA.length).toBeGreaterThan(8);
  });

  it("stores each dog's own words in the log", () => {
    const script = gossipBetween(pepper, cloud, 0.4);
    const storage = memoryStorage();
    const entry = recordInteraction(
      {
        dogAId: pepper.id,
        dogAName: pepper.name,
        dogBId: cloud.id,
        dogBName: cloud.name,
        kind: "gossip",
        detail: script.detail,
        lineA: script.lineA,
        lineB: script.lineB,
      },
      storage,
    );
    expect(personalLine(entry!, pepper.id)).toBe(script.lineA);
    expect(personalLine(entry!, cloud.id)).toBe(script.lineB);
    expect(script.detail).toMatch(/Pepper|Cloud/);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import {
  filterLog,
  getAllInteractions,
  getLogForDog,
  gossipExchange,
  INTERACTION_STORAGE_KEY,
  interactionLine,
  pairKey,
  personalLine,
  pickInteractionKind,
  recordInteraction,
} from "@/lib/interactions";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    key: (i) => Array.from(map.keys())[i] ?? null,
  };
}

describe("dog interactions", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it("logs a meeting for both dogs", () => {
    const entry = recordInteraction(
      {
        dogAId: "a",
        dogAName: "Biscuit",
        dogBId: "b",
        dogBName: "Noodle",
        kind: "sniff",
      },
      storage,
      new Date("2026-10-13T10:00:00.000Z"),
    );
    expect(entry).not.toBeNull();
    expect(getLogForDog("a", storage)).toHaveLength(1);
    expect(getLogForDog("b", storage)).toHaveLength(1);
    expect(personalLine(entry!, "a")).toBe("Sniffed Noodle");
    expect(personalLine(entry!, "b")).toBe("Sniffed Biscuit");
    expect(interactionLine(entry!)).toBe("Biscuit sniffed Noodle");
  });

  it("ignores a duplicate meeting within a few seconds", () => {
    const input = {
      dogAId: "a",
      dogAName: "Biscuit",
      dogBId: "b",
      dogBName: "Noodle",
      kind: "play" as const,
    };
    recordInteraction(input, storage, new Date("2026-10-13T10:00:00.000Z"));
    const second = recordInteraction(
      input,
      storage,
      new Date("2026-10-13T10:00:02.000Z"),
    );
    expect(second).toBeNull();
    expect(getAllInteractions(storage)).toHaveLength(1);
  });

  it("keeps a later meeting of the same pair", () => {
    const input = {
      dogAId: "a",
      dogAName: "Biscuit",
      dogBId: "b",
      dogBName: "Noodle",
      kind: "greet" as const,
    };
    recordInteraction(input, storage, new Date("2026-10-13T10:00:00.000Z"));
    recordInteraction(input, storage, new Date("2026-10-13T10:01:00.000Z"));
    expect(getLogForDog("a", storage)).toHaveLength(2);
  });

  it("falls back when storage is corrupted", () => {
    storage.setItem(INTERACTION_STORAGE_KEY, "{nope");
    expect(getAllInteractions(storage)).toEqual([]);
  });

  it("picks a nap when both dogs are sleepy", () => {
    expect(pickInteractionKind("sleepy", "sleepy", 0.9)).toBe("nap");
  });

  it("uses a stable pair key", () => {
    expect(pairKey("b", "a")).toBe(pairKey("a", "b"));
  });

  it("describes ball play as a solo activity", () => {
    const entry = recordInteraction(
      {
        dogAId: "a",
        dogAName: "Biscuit",
        dogBId: "__ball__",
        dogBName: "the ball",
        kind: "ball",
      },
      storage,
      new Date("2026-10-13T11:00:00.000Z"),
    );
    expect(personalLine(entry!, "a")).toBe("Played with the ball");
    expect(interactionLine(entry!)).toBe("Biscuit played with the ball");
  });

  it("describes daycare fixture play", () => {
    const entry = recordInteraction(
      {
        dogAId: "a",
        dogAName: "Biscuit",
        dogBId: "__food__",
        dogBName: "the food bowl",
        kind: "eat",
      },
      storage,
      new Date("2026-10-13T12:00:00.000Z"),
    );
    expect(personalLine(entry!, "a")).toBe("Ate from the food bowl");
    expect(interactionLine(entry!)).toBe("Biscuit ate from the food bowl");
  });

  it("describes owner pickup and return", () => {
    const pickup = recordInteraction(
      {
        dogAId: "a",
        dogAName: "Biscuit",
        dogBId: "__owner__",
        dogBName: "Maya",
        kind: "pickup",
      },
      storage,
    );
    expect(personalLine(pickup!, "a")).toBe("Picked up by Maya");
    expect(interactionLine(pickup!)).toBe("Maya picked up Biscuit");
    const returned = recordInteraction(
      {
        dogAId: "a",
        dogAName: "Biscuit",
        dogBId: "__owner__",
        dogBName: "Maya",
        kind: "return",
      },
      storage,
    );
    expect(personalLine(returned!, "a")).toBe("Dropped off by Maya");
  });

  it("logs gossip about a human from each dog's perspective", () => {
    const script = gossipExchange("Pepper", "Ava", "Snowball", "Elle", 0);
    const entry = recordInteraction(
      {
        dogAId: "a",
        dogAName: "Pepper",
        dogBId: "b",
        dogBName: "Snowball",
        kind: "gossip",
        detail: script.detail,
        lineA: script.lineA,
        lineB: script.lineB,
      },
      storage,
      new Date("2026-10-13T16:00:00.000Z"),
    );
    expect(script.detail).toContain("Ava");
    expect(interactionLine(entry!)).toBe(script.detail);
    expect(personalLine(entry!, "a")).toBe(script.lineA);
    expect(personalLine(entry!, "b")).toBe(script.lineB);
  });

  it("filters the log by playdates, owners, and fixtures", () => {
    const samples = [
      { dogBId: "b", dogBName: "Noodle", kind: "sniff" as const },
      { dogBId: "c", dogBName: "Snowball", kind: "gossip" as const, detail: "talked" },
      { dogBId: "__ball__", dogBName: "the ball", kind: "ball" as const },
      { dogBId: "__owner__", dogBName: "Ava", kind: "pickup" as const },
    ];
    for (const sample of samples) {
      recordInteraction(
        { dogAId: "a", dogAName: "Pepper", ...sample },
        storage,
        new Date("2026-10-13T16:10:00.000Z"),
      );
    }
    const all = getAllInteractions(storage);
    expect(filterLog(all, "playdates").map((entry) => entry.kind)).toEqual(["sniff"]);
    expect(filterLog(all, "owners").map((entry) => entry.kind).sort()).toEqual([
      "gossip",
      "pickup",
    ]);
    expect(filterLog(all, "fixtures").map((entry) => entry.kind)).toEqual(["ball"]);
  });
});

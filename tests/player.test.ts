import { describe, expect, it } from "vitest";
import {
  clearPendingDropoff,
  isYourDog,
  latestDogId,
  readPlayer,
  rememberDropoff,
  visitorLines,
} from "@/lib/player";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => {
      data.delete(key);
    },
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("player profile", () => {
  it("saves the owner name, dog id, and a one-shot drop-off", () => {
    const storage = memoryStorage();
    const saved = rememberDropoff("Akhansha", "pup-1", storage);
    expect(saved.ownerName).toBe("Akhansha");
    expect(saved.dogIds).toEqual(["pup-1"]);
    expect(saved.pendingDropoffId).toBe("pup-1");
    expect(readPlayer(storage)).toEqual(saved);

    const again = rememberDropoff("Akhansha", "pup-2", storage);
    expect(again.dogIds).toEqual(["pup-1", "pup-2"]);
    expect(again.pendingDropoffId).toBe("pup-2");
    expect(latestDogId(again)).toBe("pup-2");
  });

  it("clears the pending drop-off without forgetting the dogs", () => {
    const storage = memoryStorage();
    rememberDropoff("Akhansha", "pup-1", storage);
    const cleared = clearPendingDropoff(storage);
    expect(cleared.pendingDropoffId).toBeNull();
    expect(cleared.dogIds).toEqual(["pup-1"]);
    expect(readPlayer(storage).pendingDropoffId).toBeNull();
  });

  it("marks only saved dog ids as yours", () => {
    const player = rememberDropoff("Akhansha", "pup-1", memoryStorage());
    expect(isYourDog("pup-1", player)).toBe(true);
    expect(isYourDog("seed-01", player)).toBe(false);
    expect(isYourDog("pup-1", null)).toBe(false);
  });
});

describe("visitor lines", () => {
  it("has a pickup owner greet you about both dogs", () => {
    const lines = visitorLines({
      playerName: "Akhansha",
      visitorName: "Mina",
      theirDog: "Mochi",
      theirFavorite: "tennis balls",
      yourDog: "Spud",
      yourFavorite: "belly rubs",
      kind: "pickup",
    });
    const text = lines.join(" ");
    expect(text).toContain("Hi Akhansha, I'm Mina.");
    expect(text).toContain("I'm here for Mochi.");
    expect(text).toContain("How's Spud?");
    expect(text).toContain("tennis balls");
    expect(text).toContain("belly rubs");
  });

  it("has a drop-off owner mention the day and your pup", () => {
    const lines = visitorLines({
      playerName: "Akhansha",
      visitorName: "Mina",
      theirDog: "Mochi",
      theirFavorite: "walks",
      yourDog: "Spud",
      kind: "dropoff",
    });
    const text = lines.join(" ");
    expect(text).toContain("Akhansha, Mochi had a good day.");
    expect(text).toContain("walks");
    expect(text).toContain("Spud still playing?");
    expect(text).not.toContain("I'm here for");
  });
});

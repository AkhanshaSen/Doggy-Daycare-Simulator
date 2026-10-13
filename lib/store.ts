"use client";

import { create } from "zustand";
import type { AccessoryId, BreedId, Dog, NewDogInput } from "./types";
import { COLORS_BY_BREED } from "./types";

type AddDraft = {
  step: 1 | 2;
  breedId: BreedId;
  colorId: string;
  accessoryId: AccessoryId;
  ownerName: string;
  name: string;
  age: string;
  favoriteThing: string;
  introLine: string;
};

type DogStore = {
  yardDogs: Dog[];
  lastAddedId: string | null;
  muted: boolean;
  draft: AddDraft;
  setYardDogs: (dogs: Dog[]) => void;
  setLastAddedId: (id: string | null) => void;
  setMuted: (muted: boolean) => void;
  setDraft: (partial: Partial<AddDraft>) => void;
  resetDraft: () => void;
  draftToInput: () => NewDogInput | null;
};

const defaultDraft = (): AddDraft => ({
  step: 1,
  breedId: "corgi",
  colorId: "cream",
  accessoryId: "none",
  ownerName: "",
  name: "",
  age: "",
  favoriteThing: "",
  introLine: "",
});

export const useDogStore = create<DogStore>((set, get) => ({
  yardDogs: [],
  lastAddedId: null,
  muted: true,
  draft: defaultDraft(),

  setYardDogs: (dogs) => set({ yardDogs: dogs }),
  setLastAddedId: (id) => set({ lastAddedId: id }),
  setMuted: (muted) => set({ muted }),
  setDraft: (partial) =>
    set((state) => {
      const next = { ...state.draft, ...partial };
      // When breed changes, reset color to first option for that breed
      if (partial.breedId && partial.breedId !== state.draft.breedId) {
        const colors = COLORS_BY_BREED[partial.breedId];
        next.colorId = colors[0]?.id ?? "cream";
      }
      return { draft: next };
    }),
  resetDraft: () => set({ draft: defaultDraft() }),
  draftToInput: () => {
    const d = get().draft;
    const age = Number(d.age);
    if (!d.ownerName.trim() || !d.name.trim() || !d.favoriteThing.trim()) {
      return null;
    }
    if (!Number.isFinite(age) || age < 0 || age > 30) return null;
    return {
      ownerName: d.ownerName.trim(),
      name: d.name.trim(),
      age,
      favoriteThing: d.favoriteThing.trim(),
      introLine: d.introLine.trim() || undefined,
      breedId: d.breedId,
      colorId: d.colorId,
      accessoryId: d.accessoryId,
    };
  },
}));

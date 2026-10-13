export type BreedId = "corgi" | "dachshund" | "shihtzu" | "bichon";
export type AccessoryId = "none" | "bow" | "clip";
export type Mood = "happy" | "sleepy" | "playful";
export type DogStatus = "in_yard" | "graduated";
export type Personality = "social" | "shy";

export type Dog = {
  id: string;
  ownerName: string;
  name: string;
  age: number;
  favoriteThing: string;
  introLine?: string;
  breedId: BreedId;
  colorId: string;
  accessoryId: AccessoryId;
  mood: Mood;
  createdAt: string;
  status: DogStatus;
  personality?: Personality;
};

/** Use a stored personality, otherwise a stable ~25% shy split from the id. */
export function getPersonality(dog: {
  id: string;
  personality?: Personality;
}): Personality {
  if (dog.personality === "shy" || dog.personality === "social") {
    return dog.personality;
  }
  let hash = 0;
  for (let i = 0; i < dog.id.length; i++) {
    hash = (Math.imul(hash, 31) + dog.id.charCodeAt(i)) >>> 0;
  }
  return hash % 4 === 0 ? "shy" : "social";
}

export type NewDogInput = {
  ownerName: string;
  name: string;
  age: number;
  favoriteThing: string;
  introLine?: string;
  breedId: BreedId;
  colorId: string;
  accessoryId: AccessoryId;
  mood?: Mood;
};

export const BREEDS: { id: BreedId; label: string }[] = [
  { id: "corgi", label: "Corgi" },
  { id: "dachshund", label: "Dachshund" },
  { id: "shihtzu", label: "Shih Tzu" },
  { id: "bichon", label: "Bichon Frise" },
];

export const COLORS_BY_BREED: Record<BreedId, { id: string; label: string }[]> =
  {
    corgi: [
      { id: "cream", label: "Cream" },
      { id: "red", label: "Red" },
    ],
    dachshund: [
      { id: "brown", label: "Brown" },
      { id: "grey", label: "Grey" },
    ],
    shihtzu: [
      { id: "gold", label: "Gold" },
      { id: "blackwhite", label: "Black & White" },
    ],
    bichon: [
      { id: "white", label: "White" },
      { id: "apricot", label: "Apricot" },
    ],
  };

export const ACCESSORIES: { id: AccessoryId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "bow", label: "Bow" },
  { id: "clip", label: "Clip" },
];

export const MOODS: Mood[] = ["happy", "sleepy", "playful"];

export const FIELD_LIMITS = {
  ownerName: 20,
  name: 20,
  favoriteThing: 40,
  introLine: 80,
} as const;

export const YARD_CAPACITY = 30;
export const DAILY_DOG_LIMIT = 3;
export const GRADUATED_PAGE_SIZE = 12;

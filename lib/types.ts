export type BreedId =
  | "corgi"
  | "dachshund"
  | "shihtzu"
  | "bichon"
  | "husky"
  | "pug"
  | "poodle"
  | "shiba";
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
  { id: "husky", label: "Husky" },
  { id: "pug", label: "Pug" },
  { id: "poodle", label: "Poodle" },
  { id: "shiba", label: "Shiba" },
];

export const COLORS_BY_BREED: Record<BreedId, { id: string; label: string }[]> =
  {
    corgi: [
      { id: "cream", label: "Cream" },
      { id: "red", label: "Red" },
      { id: "sable", label: "Sable" },
    ],
    dachshund: [
      { id: "brown", label: "Brown" },
      { id: "grey", label: "Grey" },
      { id: "tan", label: "Tan" },
    ],
    shihtzu: [
      { id: "gold", label: "Gold" },
      { id: "blackwhite", label: "Black & White" },
      { id: "white", label: "White" },
    ],
    bichon: [
      { id: "white", label: "White" },
      { id: "apricot", label: "Apricot" },
      { id: "cream", label: "Cream" },
    ],
    husky: [
      { id: "grey", label: "Grey" },
      { id: "blackwhite", label: "Black & White" },
      { id: "slate", label: "Slate" },
      { id: "sable", label: "Sable" },
    ],
    pug: [
      { id: "brown", label: "Fawn" },
      { id: "gold", label: "Gold" },
      { id: "apricot", label: "Apricot" },
      { id: "tan", label: "Tan" },
    ],
    poodle: [
      { id: "white", label: "White" },
      { id: "apricot", label: "Apricot" },
      { id: "black", label: "Black" },
      { id: "cream", label: "Cream" },
    ],
    shiba: [
      { id: "red", label: "Red" },
      { id: "cream", label: "Cream" },
      { id: "gold", label: "Gold" },
      { id: "rust", label: "Rust" },
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

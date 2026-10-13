export type OwnerAccessory = "none" | "cap" | "bag";

export type OwnerAppearance = {
  shirt: string;
  shirtShade: string;
  pants: string;
  pantsShade: string;
  hair: string;
  skin: string;
  skinShade: string;
  accessory: OwnerAccessory;
};

const SHIRTS = [
  { shirt: "#3860c8", shirtShade: "#2040a0" },
  { shirt: "#c84040", shirtShade: "#882020" },
  { shirt: "#e8c040", shirtShade: "#a08020" },
  { shirt: "#40a848", shirtShade: "#206028" },
  { shirt: "#c060c0", shirtShade: "#802880" },
  { shirt: "#f0f0f0", shirtShade: "#b0b0b0" },
  { shirt: "#f07830", shirtShade: "#a04818" },
];

const PANTS = [
  { pants: "#2a3a68", pantsShade: "#182040" },
  { pants: "#5a3820", pantsShade: "#301808" },
  { pants: "#306230", pantsShade: "#0f380f" },
  { pants: "#404040", pantsShade: "#202020" },
];

const HAIR = ["#3d2410", "#1a1a1a", "#c4a060", "#8b4513", "#e8dcc0", "#6b3a20"];

const SKINS = [
  { skin: "#f2c7a0", skinShade: "#d4a070" },
  { skin: "#e0a878", skinShade: "#c08050" },
  { skin: "#8d5524", skinShade: "#5c3414" },
  { skin: "#c68642", skinShade: "#8a5828" },
  { skin: "#ffdbac", skinShade: "#e0b890" },
];

const ACCESSORIES: OwnerAccessory[] = ["none", "cap", "bag", "none", "cap"];

const NAME_POOL = [
  "Sam",
  "Alex",
  "Jordan",
  "Riley",
  "Casey",
  "Morgan",
  "Quinn",
  "Avery",
  "Taylor",
  "Jamie",
  "Robin",
  "Drew",
];

const GENERIC_NAMES = new Set(["", "owner", "human", "person", "someone"]);

export function hashOwnerKey(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function appearanceForOwner(
  ownerName: string,
  dogId: string,
): OwnerAppearance {
  const hash = hashOwnerKey(`${ownerName}|${dogId}`);
  const shirt = SHIRTS[hash % SHIRTS.length]!;
  const pants = PANTS[(hash >>> 3) % PANTS.length]!;
  const hair = HAIR[(hash >>> 6) % HAIR.length]!;
  const skin = SKINS[(hash >>> 9) % SKINS.length]!;
  const accessory = ACCESSORIES[(hash >>> 12) % ACCESSORIES.length]!;
  return {
    shirt: shirt.shirt,
    shirtShade: shirt.shirtShade,
    pants: pants.pants,
    pantsShade: pants.pantsShade,
    hair,
    skin: skin.skin,
    skinShade: skin.skinShade,
    accessory,
  };
}

/** Keep a real owner name. Only generic placeholders get a stable stand-in. */
export function displayOwnerName(ownerName: string, dogId: string): string {
  const trimmed = ownerName.trim();
  if (!GENERIC_NAMES.has(trimmed.toLowerCase())) return trimmed;
  return NAME_POOL[hashOwnerKey(dogId) % NAME_POOL.length]!;
}

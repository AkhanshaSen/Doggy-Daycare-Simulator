import leo from "leo-profanity";

const filter = leo;

filter.loadDictionary("en");

export function containsProfanity(text: string): boolean {
  if (!text || !text.trim()) return false;
  if (filter.check(text)) return true;
  // Also check individual tokens (helps with glued words)
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);
  return tokens.some((t) => filter.check(t));
}

export function assertCleanText(
  fields: Record<string, string | undefined>,
): string | null {
  for (const [key, value] of Object.entries(fields)) {
    if (value && containsProfanity(value)) {
      return `Please keep "${labelFor(key)}" friendly — that word isn't allowed.`;
    }
  }
  return null;
}

function labelFor(key: string): string {
  const labels: Record<string, string> = {
    ownerName: "owner name",
    name: "dog's name",
    favoriteThing: "favourite thing",
    introLine: "intro line",
  };
  return labels[key] ?? key;
}

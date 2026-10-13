import { getPersonality, type Dog, type Mood, type Personality } from "./types";

export type GossipDog = {
  id: string;
  name: string;
  owner: string;
  mood: Mood;
  personality: Personality;
  favoriteThing: string;
  age: number;
  introLine?: string;
};

export type GossipScript = {
  detail: string;
  lineA: string;
  lineB: string;
  bubbles: [string, string];
};

function hashKey(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function ageBit(dog: GossipDog): string {
  if (dog.age <= 1) return "only a pup";
  if (dog.age >= 8) return `${dog.age} and still zooming`;
  return `${dog.age} years of practice`;
}

type Template = (a: GossipDog, b: GossipDog) => GossipScript;

const TEMPLATES: Template[] = [
  (a, b) =>
    a.personality === "shy"
      ? {
          detail: `${a.name} whispered to ${b.name} that ${a.owner} quietly saves ${a.favoriteThing}`,
          lineA: `…${a.owner} hides ${a.favoriteThing} just for me`,
          lineB: `${b.owner} does that in secret too`,
          bubbles: [`…${a.favoriteThing}, shh`, "I won't tell"],
        }
      : {
          detail: `${a.name} bragged to ${b.name} that ${a.owner} sneaks extra ${a.favoriteThing}`,
          lineA: `${a.owner} sneaks me extra ${a.favoriteThing}!`,
          lineB: `${b.owner} pretends not to notice my crumbs`,
          bubbles: [`Extra ${a.favoriteThing}!`, "Lucky!"],
        },
  (a, b) =>
    a.mood === "sleepy"
      ? {
          detail: `${a.name} told ${b.name} that ${a.owner} naps on the couch with them`,
          lineA: `*yawn* ${a.owner} and I nap all afternoon`,
          lineB: `${b.owner} steals the blanket. Rude.`,
          bubbles: [`zzz… ${a.owner}`, "Save me a spot"],
        }
      : {
          detail: `${a.name} told ${b.name} that ${a.owner} sings on the way home`,
          lineA: `${a.owner} sings the whole car ride home`,
          lineB: `${b.owner} drums on the steering wheel`,
          bubbles: [`${a.owner} sings off-key`, "Mine drums!"],
        },
  (a, b) =>
    a.mood === "playful"
      ? {
          detail: `${a.name} told ${b.name} that ${a.owner} starts games of ${a.favoriteThing} unprompted`,
          lineA: `${a.owner} yells "go!" and we do ${a.favoriteThing}`,
          lineB: `${b.owner} can't keep up with me`,
          bubbles: [`Race for ${a.favoriteThing}!`, "I'm faster"],
        }
      : {
          detail: `${a.name} told ${b.name} that ${a.owner} always packs ${a.favoriteThing}`,
          lineA: `${a.owner} never forgets ${a.favoriteThing}`,
          lineB: `${b.owner} forgets, then feels bad`,
          bubbles: [`${a.favoriteThing}, always`, "Mine forgets"],
        },
  (a, b) =>
    a.personality === "shy"
      ? {
          detail: `${a.name} admitted to ${b.name} that ${a.owner} is quiet at home`,
          lineA: `…${a.owner} is kinda quiet. I like that`,
          lineB: `${b.owner} talks to the plants`,
          bubbles: ["…they're quiet", "Mine talks a lot"],
        }
      : {
          detail: `${a.name} told ${b.name} that ${a.owner} narrates every walk`,
          lineA: `${a.owner} commentates my whole walk`,
          lineB: `${b.owner} just says "good dog" a hundred times`,
          bubbles: ["Play-by-play walks!", "Good dog x100"],
        },
  (a, b) => ({
    detail: `${a.name} and ${b.name} compared ${a.owner} and ${b.owner}`,
    lineA:
      a.personality === "shy"
        ? `…${a.owner} shares snacks if I stare`
        : `${a.owner} shares snacks. ${b.owner} hoards them!`,
    lineB:
      b.personality === "shy"
        ? `…${b.owner} drops crumbs on purpose`
        : `${b.owner} shares too. Don't start rumors`,
    bubbles: [`${a.owner} vs ${b.owner}`, "Snacks decide it"],
  }),
  (a, b) => ({
    detail: `${a.name} told ${b.name} they are ${ageBit(a)} under ${a.owner}`,
    lineA:
      a.mood === "playful"
        ? `I'm ${ageBit(a)} and ${a.owner} still can't catch me`
        : `${a.owner} says I'm ${ageBit(a)}`,
    lineB: `${b.owner} thinks I'm still a puppy. I'm ${b.age}.`,
    bubbles: [ageBit(a), `I'm ${b.age}!`],
  }),
  (a, b) => {
    const hook = a.introLine?.replace(/[.!]+$/, "") ?? `${a.favoriteThing} forever`;
    return {
      detail: `${a.name} told ${b.name} their human story: "${hook}"`,
      lineA:
        a.personality === "shy"
          ? `…${a.owner} knows. ${hook}`
          : `${a.owner} tells everyone: ${hook}`,
      lineB: `${b.owner}'s version of me is way less cool`,
      bubbles: [hook.slice(0, 28), "Tell me more"],
    };
  },
  (a, b) => ({
    detail: `${a.name} told ${b.name} that ${a.owner} is coming back soon`,
    lineA:
      a.mood === "sleepy"
        ? `*yawn* ${a.owner} said they'd be right back`
        : `I miss ${a.owner}. They promised ${a.favoriteThing}`,
    lineB: `${b.owner} is probably already at the gate`,
    bubbles: [`Miss ${a.owner}`, "They'll be here"],
  }),
  (a, b) =>
    b.mood === "playful"
      ? {
          detail: `${b.name} one-upped ${a.name}: ${b.owner} turns ${b.favoriteThing} into a sport`,
          lineA: `${a.owner} is gentle about ${a.favoriteThing}`,
          lineB: `${b.owner} makes ${b.favoriteThing} a tournament!`,
          bubbles: [`Gentle ${a.favoriteThing}`, "Tournament!"],
        }
      : {
          detail: `${b.name} told ${a.name} that ${b.owner} saves the best ${b.favoriteThing} for evenings`,
          lineA: `${a.owner} gives ${a.favoriteThing} anytime`,
          lineB: `${b.owner} waits until dark for ${b.favoriteThing}`,
          bubbles: ["Anytime treats", "Night treats"],
        },
  (a, b) => ({
    detail: `${a.name} told ${b.name} how ${a.owner} reacts when they get muddy`,
    lineA:
      a.personality === "social"
        ? `${a.owner} laughs, then we both need a bath`
        : `…${a.owner} sighs. Then towels.`,
    lineB: `${b.owner} pretends to be mad. They're not.`,
    bubbles: ["Mud bath!", "Fake mad"],
  }),
  (a, b) => ({
    detail: `${a.name} and ${b.name} gossiped about morning routines with ${a.owner} and ${b.owner}`,
    lineA:
      a.mood === "sleepy"
        ? `${a.owner} lets me sleep in. Hero.`
        : `${a.owner} is up before the sun for ${a.favoriteThing}`,
    lineB:
      b.mood === "playful"
        ? `${b.owner} chases me around the kitchen`
        : `${b.owner} makes coffee, I supervise`,
    bubbles: ["Mornings!", "I supervise"],
  }),
  (a, b) => ({
    detail: `${a.name} told ${b.name} that ${a.owner} talks about them to other humans`,
    lineA:
      a.personality === "shy"
        ? `…${a.owner} shows photos. It's embarrassing`
        : `${a.owner} shows everyone photos of me`,
    lineB: `${b.owner} has a whole album. I checked.`,
    bubbles: ["Photo evidence", "Whole album"],
  }),
  (a, b) => ({
    detail: `${b.name} told ${a.name} a secret about ${b.owner} and ${b.favoriteThing}`,
    lineA: `So what does ${b.owner} actually do?`,
    lineB:
      b.personality === "shy"
        ? `…${b.owner} cries at movies. And shares ${b.favoriteThing}`
        : `${b.owner} dances when they think I'm asleep. Then ${b.favoriteThing}!`,
    bubbles: ["Spill it", `${b.favoriteThing} after`],
  }),
  (a, b) => ({
    detail: `${a.name} told ${b.name} that ${a.owner} has a silly voice just for them`,
    lineA:
      a.mood === "happy"
        ? `${a.owner} uses a tiny voice. I melt`
        : `${a.owner}'s tiny voice still works on me`,
    lineB: `${b.owner} does baby talk. I allow it.`,
    bubbles: ["Tiny voice!", "I allow it"],
  }),
  (a, b) => ({
    detail: `${a.name} told ${b.name} what ${a.owner} says at pickup`,
    lineA:
      a.personality === "social"
        ? `${a.owner} yells my name from the gate`
        : `…${a.owner} just waves. I know`,
    lineB: `${b.owner} brings ${b.favoriteThing} as a bribe`,
    bubbles: ["Name from the gate", "Bribe accepted"],
  }),
  (a, b) => ({
    detail: `${a.name} and ${b.name} ranked ${a.owner} and ${b.owner} on ${a.favoriteThing} versus ${b.favoriteThing}`,
    lineA: `${a.owner} wins at ${a.favoriteThing}`,
    lineB:
      b.personality === "shy"
        ? `…${b.owner} wins at ${b.favoriteThing}. Quietly.`
        : `${b.owner} wins at ${b.favoriteThing}. Obviously!`,
    bubbles: [a.favoriteThing.slice(0, 22), b.favoriteThing.slice(0, 22)],
  }),
];

export function gossipBetween(
  a: GossipDog,
  b: GossipDog,
  roll: number = Math.random(),
): GossipScript {
  const index =
    hashKey(`${a.id}|${b.id}|${Math.floor(roll * 1000)}`) % TEMPLATES.length;
  const script = TEMPLATES[index]!(a, b);
  if (a.personality === "shy" && !script.lineA.startsWith("…")) {
    const rest = script.lineA.charAt(0).toLowerCase() + script.lineA.slice(1);
    script.lineA = `…${rest}`;
  }
  if (b.personality === "shy" && !script.lineB.startsWith("…")) {
    const rest = script.lineB.charAt(0).toLowerCase() + script.lineB.slice(1);
    script.lineB = `…${rest}`;
  }
  return script;
}

export function gossipDogFrom(
  dog: Pick<
    Dog,
    "id" | "name" | "ownerName" | "mood" | "favoriteThing" | "age" | "introLine" | "personality"
  >,
  owner: string,
): GossipDog {
  return {
    id: dog.id,
    name: dog.name,
    owner,
    mood: dog.mood,
    personality: getPersonality(dog),
    favoriteThing: dog.favoriteThing,
    age: dog.age,
    introLine: dog.introLine,
  };
}

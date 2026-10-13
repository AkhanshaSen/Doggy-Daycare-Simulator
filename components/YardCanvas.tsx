"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudio } from "@/lib/audio";
import {
  advanceClock,
  goesHomeAtNight,
  isParkClosed,
  nightTint,
  phaseFor,
  type ClockSpeed,
  type DayPhase,
} from "@/lib/clock";
import { GB } from "@/lib/gbPalette";
import { gossipBetween, gossipDogFrom } from "@/lib/gossip";
import {
  AGILITY_ID,
  BALL_ID,
  BED_ID,
  CHEW_ID,
  FOOD_ID,
  POOL_ID,
  bubbleLines,
  getLogForDog,
  happinessForKind,
  pairKey,
  personalLine,
  pickInteractionKind,
  recordInteraction,
  type InteractionKind,
  type YardInteraction,
} from "@/lib/interactions";
import type { ParkThemeId } from "@/lib/parkThemes";
import {
  appearanceForOwner,
  displayOwnerName,
  type OwnerAppearance,
} from "@/lib/ownerAppearance";
import {
  drawAgilityHurdle,
  drawBall,
  drawChewBone,
  drawDaycareBuilding,
  drawDirtPath,
  drawDog,
  drawDogBed,
  drawFoodBowl,
  drawGrassBackground,
  drawHappinessBar,
  drawKiddiePool,
  drawLeash,
  drawNightOverlay,
  drawOwner,
  drawWaterBowl,
  drawWindowLights,
  setParkTheme,
  SPRITE_SIZE,
} from "@/lib/sprites";
import { getPersonality, type Dog } from "@/lib/types";
import {
  buildingContains,
  hitFixture,
  layoutFixtures,
  livelyFixture,
  type Fixture,
  type FixtureKind,
} from "@/lib/yardFixtures";
import {
  getDoorPoint,
  getBuildingRect,
  getPlayArea,
  looseSpawnPoint,
} from "@/lib/yardLayout";
import { getPresence, setPresence, type YardPlace } from "@/lib/yardPresence";
import { idleDecay, getHappiness, setHappiness } from "@/lib/yardRuntime";

type Actor = {
  dog: Dog;
  x: number;
  y: number;
  vx: number;
  vy: number;
  flip: boolean;
  frame: number;
  frameTimer: number;
  retargetTimer: number;
  targetId: string | null;
  targetTimer: number;
  partnerId: string | null;
  interactUntil: number;
  socialCooldown: number;
  happiness: number;
  fixtureTarget: Fixture | null;
  busyUntil: number;
  place: YardPlace;
  placeUntil: number;
  buildingTarget: boolean;
  nextEnterAt: number;
  partnerWalk: "exit" | "return" | null;
  nightRole: "home" | "overnight" | null;
};

type Bubble = {
  id: string;
  dogId: string;
  text: string;
  until: number;
};

type Props = {
  dogs: Dog[];
  className?: string;
  onSelectDog?: (dog: Dog) => void;
  onOpenProfile?: (dog: Dog) => void;
  onInteraction?: (entry: YardInteraction) => void;
  onVisibleCountChange?: (count: number) => void;
  themeId?: ParkThemeId;
  clockMinutes?: number;
  clockSpeed?: ClockSpeed;
  clockSeek?: number;
  onClockMinutes?: (minutes: number) => void;
};

const SCALE = 2;
const SPRITE_W = SPRITE_SIZE * SCALE;
const SPRITE_H = SPRITE_SIZE * SCALE;
const LAYOUT_TOP = 8;
const BOTTOM_SAFE = 24;
const SIDE_SAFE = 8;
const INTERACT_DIST = 78;
const MAX_LOOSE = 8;
const SEPARATION = 52;
const MAX_PAIRS = 1;
const INTERACT_MS = 3200;
const PAIR_COOLDOWN_MS = 45000;
const GLOBAL_COOLDOWN_MS = 6000;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type OwnerPhase =
  | "approach"
  | "greeting"
  | "talking"
  | "depart"
  | "dropoff"
  | "collecting"
  | "leavingTogether"
  | "returningTogether";

type OwnerVisit = {
  dogId: string;
  ownerName: string;
  appearance: OwnerAppearance;
  phase: OwnerPhase;
  x: number;
  y: number;
  frame: number;
  frameTimer: number;
  flip: boolean;
  until: number;
  awayMs: number;
  rush: boolean;
};

function makeOwnerVisit(
  dog: Dog,
  phase: OwnerPhase,
  x: number,
  y: number,
  until = 0,
): OwnerVisit {
  return {
    dogId: dog.id,
    ownerName: displayOwnerName(dog.ownerName, dog.id),
    appearance: appearanceForOwner(dog.ownerName, dog.id),
    phase,
    x,
    y,
    frame: 0,
    frameTimer: 0,
    flip: false,
    until,
    awayMs: 0,
    rush: false,
  };
}

type Dialogue = {
  name: string;
  lines: string[];
  index: number;
};

function ownerDialogue(ownerName: string, dog: Dog): string[] {
  const lines = [
    `Hi! I'm ${ownerName}.`,
    `I came by to pick up ${dog.name}.`,
    `${dog.name} is ${dog.age} and loves ${dog.favoriteThing}.`,
  ];
  if (dog.introLine) lines.push(`"${dog.introLine}"`);
  lines.push(`We'll head out for a bit, then I'll bring ${dog.name} back.`);
  return lines;
}

function playBounds(width: number, height: number) {
  const building = getBuildingRect(width, height, LAYOUT_TOP);
  const area = getPlayArea(width, height, LAYOUT_TOP);
  return {
    building,
    door: getDoorPoint(building),
    minY: area.y + 20,
    maxY: Math.max(area.y + 48, area.y + area.h - SPRITE_H - 16),
    minX: area.x + 10,
    maxX: Math.max(area.x + 48, area.x + area.w - SPRITE_W - 10),
  };
}

function centerOf(actor: Actor): { x: number; y: number } {
  return { x: actor.x + SPRITE_W / 2, y: actor.y + SPRITE_H / 2 };
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  width: number,
): void {
  const lines = text.split("\n");
  ctx.font = "12px sans-serif";
  const widths = lines.map((line) => ctx.measureText(line).width);
  const bw = Math.min(width - 16, Math.max(...widths, 36) + 16);
  const bh = lines.length * 16 + 12;
  const bx = Math.min(Math.max(8, x - bw / 2), width - bw - 8);
  const by = Math.max(8, y - bh - 6);
  ctx.fillStyle = GB.menu;
  ctx.strokeStyle = GB.ink;
  ctx.lineWidth = 2;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = GB.ink;
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    ctx.fillText(line, bx + 8, by + 18 + i * 16);
  });
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#E85A7A";
  ctx.fillRect(x + 2, y, 4, 2);
  ctx.fillRect(x + 8, y, 4, 2);
  ctx.fillRect(x, y + 2, 14, 4);
  ctx.fillRect(x + 2, y + 6, 10, 2);
  ctx.fillRect(x + 4, y + 8, 6, 2);
  ctx.fillRect(x + 6, y + 10, 2, 2);
}

export function YardCanvas({
  dogs,
  className = "",
  onSelectDog,
  onOpenProfile,
  onInteraction,
  onVisibleCountChange,
  themeId = "classic",
  clockMinutes = 10 * 60,
  clockSpeed = "normal",
  clockSeek = 0,
  onClockMinutes,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actorsRef = useRef<Actor[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const pairCooldownRef = useRef<Map<string, number>>(new Map());
  const nextMeetingRef = useRef(0);
  const dogsRef = useRef(dogs);
  const onSelectRef = useRef(onSelectDog);
  const onOpenProfileRef = useRef(onOpenProfile);
  const onInteractionRef = useRef(onInteraction);
  const fixtureActiveRef = useRef<Map<string, number>>(new Map());
  const pendingFixtureRef = useRef<Fixture | null>(null);
  const ownerRef = useRef<OwnerVisit | null>(null);
  const nextOwnerAtRef = useRef(0);
  const countAtRef = useRef(0);
  const onVisibleRef = useRef(onVisibleCountChange);
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);
  const labelRef = useRef<{ id: string; until: number } | null>(null);
  const [liveText, setLiveText] = useState("");
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const talkingRef = useRef(false);
  const minutesRef = useRef(clockMinutes);
  const speedRef = useRef(clockSpeed);
  const seekSeenRef = useRef(clockSeek);
  const clockPropRef = useRef({ minutes: clockMinutes, seek: clockSeek });
  const themeRef = useRef(themeId);
  const onClockRef = useRef(onClockMinutes);
  const phaseRef = useRef<DayPhase>(phaseFor(clockMinutes));
  const homeQueueRef = useRef<string[]>([]);
  const morningQueueRef = useRef<string[]>([]);
  const lastClockReportRef = useRef(0);
  const nightShiftRef = useRef(false);
  const [ownerTalkOffer, setOwnerTalkOffer] = useState<{
    ownerName: string;
  } | null>(null);
  const ownerTalkOfferActiveRef = useRef(false);

  speedRef.current = clockSpeed;
  themeRef.current = themeId;
  onClockRef.current = onClockMinutes;
  clockPropRef.current = { minutes: clockMinutes, seek: clockSeek };

  dogsRef.current = dogs;
  onSelectRef.current = onSelectDog;
  onOpenProfileRef.current = onOpenProfile;
  onInteractionRef.current = onInteraction;
  onVisibleRef.current = onVisibleCountChange;

  const beginOwnerTalk = useCallback(() => {
    const visiting = ownerRef.current;
    if (
      !visiting ||
      visiting.rush ||
      (visiting.phase !== "approach" &&
        visiting.phase !== "greeting" &&
        visiting.phase !== "talking")
    ) {
      return;
    }
    const dog = actorsRef.current.find((actor) => actor.dog.id === visiting.dogId);
    if (!dog) return;
    getAudio().unlock();
    getAudio().play("click");
    visiting.phase = "talking";
    talkingRef.current = true;
    ownerTalkOfferActiveRef.current = false;
    setOwnerTalkOffer(null);
    setDialogue({
      name: visiting.ownerName,
      lines: ownerDialogue(visiting.ownerName, dog.dog),
      index: 0,
    });
    setLiveText(`${visiting.ownerName} says hello`);
  }, []);

  const syncActors = useCallback((width: number, height: number) => {
    const current = dogsRef.current;
    const byId = new Map(actorsRef.current.map((a) => [a.dog.id, a]));
    const next: Actor[] = [];
    const bounds = playBounds(width, height);
    const { minY, maxY, minX, maxX } = bounds;
    let spawnIndex = 0;

    for (const dog of current) {
      const existing = byId.get(dog.id);
      if (existing) {
        existing.dog = dog;
        if (!existing.nextEnterAt) {
          existing.nextEnterAt = performance.now() + Math.random() * 5000;
        }
        if (existing.partnerWalk === undefined) existing.partnerWalk = null;
        if (existing.nightRole === undefined) existing.nightRole = null;
        next.push(existing);
      } else {
        const presence = getPresence(dog.id);
        const remaining = presence.until
          ? new Date(presence.until).getTime() - Date.now()
          : 0;
        const slot = looseSpawnPoint(spawnIndex, minX, maxX, minY, maxY);
        spawnIndex += 1;
        next.push({
          dog,
          x: presence.place === "yard" ? slot.x : bounds.door.x - SPRITE_W / 2,
          y: presence.place === "yard" ? slot.y : bounds.door.y,
          vx: (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.5),
          vy: (Math.random() > 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.35),
          flip: false,
          frame: 0,
          frameTimer: 0,
          retargetTimer: 0.4 + Math.random() * 1.6,
          targetId: null,
          targetTimer: 0,
          partnerId: null,
          interactUntil: 0,
          socialCooldown: Math.random() * 3,
          happiness: getHappiness(dog.id),
          fixtureTarget: null,
          busyUntil: 0,
          place: presence.place,
          placeUntil: remaining > 0 ? performance.now() + remaining : 0,
          buildingTarget: false,
          nextEnterAt: performance.now() + 12000 + Math.random() * 8000,
          partnerWalk: null,
          nightRole: null,
        });
      }
    }
    actorsRef.current = next;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let last = performance.now();
    let reduced = prefersReducedMotion();
    let hidden = document.hidden;
    let lastBark = 0;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => {
      reduced = mq.matches;
    };
    mq.addEventListener("change", onMq);

    const onVis = () => {
      hidden = document.hidden;
      if (!hidden) last = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth ?? window.innerWidth;
      const h = parent?.clientHeight ?? Math.max(420, window.innerHeight - 80);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      syncActors(w, h);
    };

    const clamp = (
      actor: Actor,
      minX: number,
      maxX: number,
      minY: number,
      maxY: number,
    ) => {
      if (actor.x < minX) {
        actor.x = minX;
        actor.vx = Math.abs(actor.vx);
      }
      if (actor.x > maxX) {
        actor.x = maxX;
        actor.vx = -Math.abs(actor.vx);
      }
      if (actor.y < minY) {
        actor.y = minY;
        actor.vy = Math.abs(actor.vy);
      }
      if (actor.y > maxY) {
        actor.y = maxY;
        actor.vy = -Math.abs(actor.vy);
      }
    };

    const changeHappiness = (actor: Actor, delta: number) => {
      actor.happiness = Math.max(0, Math.min(100, actor.happiness + delta));
      setHappiness(actor.dog.id, actor.happiness);
    };

    const arriveAtFixture = (actor: Actor, fixture: Fixture, now: number) => {
      const kind = fixture.kind;
      actor.fixtureTarget = null;
      actor.busyUntil = now + 2200;
      actor.vx = 0;
      actor.vy = 0;
      fixtureActiveRef.current.set(fixture.id, now + 2200);
      const say = (text: string, sound: "slurp" | "bark") => {
        bubblesRef.current = [
          ...bubblesRef.current.filter((bubble) => bubble.until > now),
          {
            id: `${kind}-${actor.dog.id}-${now}`,
            dogId: actor.dog.id,
            text,
            until: now + 2200,
          },
        ].slice(-8);
        getAudio().play(sound);
      };
      const logFixture = (
        interaction: InteractionKind,
        partnerId: string,
        partnerName: string,
        text: string,
        sound: "slurp" | "bark",
      ) => {
        changeHappiness(actor, happinessForKind(interaction));
        const entry = recordInteraction({
          dogAId: actor.dog.id,
          dogAName: actor.dog.name,
          dogBId: partnerId,
          dogBName: partnerName,
          kind: interaction,
        });
        if (entry) onInteractionRef.current?.(entry);
        say(text, sound);
        setLiveText(`${actor.dog.name} ${text.toLowerCase()}`);
      };
      if (kind === "water") {
        changeHappiness(actor, 10);
        say("ahh, fresh water!", "slurp");
        setLiveText(`${actor.dog.name} drank from the bowl`);
        return;
      }
      if (kind === "ball") {
        logFixture("ball", BALL_ID, "the ball", "Playing with the ball!", "bark");
        return;
      }
      if (kind === "food") {
        logFixture("eat", FOOD_ID, "the food bowl", "*munch* yum!", "slurp");
        return;
      }
      if (kind === "chew") {
        logFixture("chew", CHEW_ID, "the bone", "*gnaw* good bone!", "bark");
        return;
      }
      if (kind === "pool") {
        logFixture("splash", POOL_ID, "the pool", "*splash* whee!", "bark");
        return;
      }
      if (kind === "agility") {
        logFixture("agility", AGILITY_ID, "the hurdle", "*hop* made it!", "bark");
        return;
      }
      logFixture("nap", BED_ID, "the dog bed", "zzz… cozy bed", "slurp");
    };

    const beginMeeting = (a: Actor, b: Actor, now: number) => {
      const gossipRoll = Math.random();
      const kind: InteractionKind =
        gossipRoll < 0.34 ? "gossip" : pickInteractionKind(a.dog.mood, b.dog.mood);
      const script =
        kind === "gossip"
          ? gossipBetween(
              gossipDogFrom(a.dog, displayOwnerName(a.dog.ownerName, a.dog.id)),
              gossipDogFrom(b.dog, displayOwnerName(b.dog.ownerName, b.dog.id)),
              gossipRoll / 0.34,
            )
          : null;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      a.x = midX - 34;
      b.x = midX + 34;
      a.y = midY;
      b.y = midY;
      a.flip = false;
      b.flip = true;
      a.partnerId = b.dog.id;
      b.partnerId = a.dog.id;
      a.interactUntil = now + INTERACT_MS;
      b.interactUntil = now + INTERACT_MS;
      a.targetId = null;
      b.targetId = null;
      a.vx = 0;
      b.vx = 0;
      a.socialCooldown = 10 + Math.random() * 6;
      b.socialCooldown = 10 + Math.random() * 6;
      pairCooldownRef.current.set(
        pairKey(a.dog.id, b.dog.id),
        now + PAIR_COOLDOWN_MS,
      );
      nextMeetingRef.current = now + GLOBAL_COOLDOWN_MS;

      const [lineA, lineB] = script
        ? script.bubbles
        : bubbleLines(kind, a.dog.name, b.dog.name);
      const until = now + INTERACT_MS;
      bubblesRef.current = [
        ...bubblesRef.current.filter((bubble) => bubble.until > now),
        { id: `${a.dog.id}-${now}`, dogId: a.dog.id, text: lineA, until },
        { id: `${b.dog.id}-${now}`, dogId: b.dog.id, text: lineB, until },
      ].slice(-8);
      setLiveText(`${a.dog.name}: ${lineA}. ${b.dog.name}: ${lineB}`);

      const entry = recordInteraction({
        dogAId: a.dog.id,
        dogAName: a.dog.name,
        dogBId: b.dog.id,
        dogBName: b.dog.name,
        kind,
        detail: script?.detail,
        lineA: script?.lineA,
        lineB: script?.lineB,
      });
      if (entry) {
        changeHappiness(a, happinessForKind(kind));
        changeHappiness(b, happinessForKind(kind));
        onInteractionRef.current?.(entry);
      }

      if (now - lastBark > 2200) {
        getAudio().play("bark");
        lastBark = now;
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const step = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(step);
      if (hidden) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      setParkTheme(themeRef.current);
      if (seekSeenRef.current !== clockPropRef.current.seek) {
        seekSeenRef.current = clockPropRef.current.seek;
        minutesRef.current = clockPropRef.current.minutes;
      }
      minutesRef.current = advanceClock(minutesRef.current, dt, speedRef.current);
      const phase = phaseFor(minutesRef.current);
      if (now - lastClockReportRef.current > 250) {
        lastClockReportRef.current = now;
        onClockRef.current?.(minutesRef.current);
      }

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const bounds = playBounds(w, h);
      const { minY, maxY, minX, maxX, door } = bounds;
      const actors = actorsRef.current;

      syncActors(w, h);
      if (phase !== phaseRef.current || (isParkClosed(phase) && !nightShiftRef.current)) {
        const previous = phaseRef.current;
        phaseRef.current = phase;
        if (isParkClosed(phase) && (!isParkClosed(previous) || !nightShiftRef.current)) {
          nightShiftRef.current = true;
          homeQueueRef.current = [];
          morningQueueRef.current = [];
          for (const actor of actorsRef.current) {
            if (actor.place === "away" || actor.partnerWalk === "exit") {
              actor.nightRole = "home";
              continue;
            }
            if (goesHomeAtNight(actor.dog.id)) {
              actor.nightRole = "home";
              if (!actor.partnerWalk) homeQueueRef.current.push(actor.dog.id);
            } else {
              actor.nightRole = "overnight";
              actor.fixtureTarget = null;
              actor.targetId = null;
              actor.partnerId = null;
              actor.interactUntil = 0;
              if (actor.place !== "indoor") actor.buildingTarget = true;
            }
          }
        }
        if (isParkClosed(previous) && !isParkClosed(phase)) {
          nightShiftRef.current = false;
          homeQueueRef.current = [];
          const returning: string[] = [];
          for (const actor of actorsRef.current) {
            if (actor.nightRole === "home" && actor.place === "away") {
              returning.push(actor.dog.id);
            } else if (actor.place === "yard") {
              actor.nightRole = null;
              actor.buildingTarget = false;
            }
          }
          morningQueueRef.current = returning;
        }
      }
      const fixtures = layoutFixtures(w, h, LAYOUT_TOP);
      const pending = pendingFixtureRef.current;
      if (pending) {
        pendingFixtureRef.current = null;
        const idle = actors.filter(
          (actor) =>
            actor.place === "yard" &&
            actor.interactUntil <= now &&
            actor.busyUntil <= now &&
            !actor.fixtureTarget &&
            !actor.buildingTarget &&
        !actor.partnerWalk &&
        ( !livelyFixture(pending.kind) ||
          getPersonality(actor.dog) === "social" ||
          actor.dog.mood === "playful"),
        );
        const pool =
          idle.length > 0
            ? idle
            : actors.filter(
                (actor) =>
                  actor.place === "yard" &&
                  !actor.partnerWalk &&
                  actor.interactUntil <= now &&
                  actor.busyUntil <= now &&
                  !actor.fixtureTarget,
              );
        if (pending && pool.length > 0) {
          let nearest = pool[0]!;
          let best = Infinity;
          for (const actor of pool) {
            const dist = Math.hypot(pending.x - actor.x, pending.y - actor.y);
            if (dist < best) {
              best = dist;
              nearest = actor;
            }
          }
          nearest.fixtureTarget = pending;
          nearest.buildingTarget = false;
          nearest.targetId = null;
        }
      }

      const looseCount = () =>
        actors.filter(
          (actor) =>
            actor.place === "yard" && !actor.partnerWalk && !actor.buildingTarget,
        ).length;

      const emerge = (actor: Actor) => {
        actor.place = "yard";
        actor.placeUntil = 0;
        actor.x = door.x - SPRITE_W / 2;
        actor.y = door.y;
        actor.buildingTarget = false;
        actor.nextEnterAt = now + 8000 + Math.random() * 6000;
        setPresence(actor.dog.id, { place: "yard" });
        changeHappiness(actor, 4);
        bubblesRef.current = [
          ...bubblesRef.current.filter((bubble) => bubble.until > now),
          {
            id: `out-${actor.dog.id}-${now}`,
            dogId: actor.dog.id,
            text: "ready to play!",
            until: now + 2200,
          },
        ].slice(-8);
      };

      const exitPoint = { x: -150, y: Math.max(minY, h * 0.62) };
      const releasePoint = {
        x: Math.min(maxX, door.x - 10),
        y: Math.min(maxY, door.y + 28),
      };

      for (const actor of actors) {
        if (actor.partnerWalk) continue;
        if (actor.place === "indoor" && actor.placeUntil > 0 && now >= actor.placeUntil) {
          if (isParkClosed(phaseRef.current)) {
            actor.placeUntil = now + 60000;
          } else if (looseCount() >= MAX_LOOSE) {
            actor.placeUntil = now + 5000;
          } else {
            emerge(actor);
            actor.nightRole = null;
          }
        }
        if (
          actor.place === "away" &&
          actor.nightRole !== "home" &&
          actor.placeUntil > 0 &&
          now >= actor.placeUntil &&
          !ownerRef.current
        ) {
          const visit = makeOwnerVisit(
            actor.dog,
            "returningTogether",
            -18,
            exitPoint.y,
          );
          ownerRef.current = visit;
          actor.partnerWalk = "return";
          actor.place = "yard";
          actor.placeUntil = 0;
          actor.buildingTarget = false;
          actor.fixtureTarget = null;
          actor.x = visit.x + 18;
          actor.y = visit.y + 8;
          setPresence(actor.dog.id, { place: "yard" });
        }
      }

      if (isParkClosed(phaseRef.current)) {
        for (const actor of actors) {
          if (
            actor.nightRole === "home" &&
            actor.place === "yard" &&
            !actor.partnerWalk &&
            ownerRef.current?.dogId !== actor.dog.id &&
            !homeQueueRef.current.includes(actor.dog.id)
          ) {
            homeQueueRef.current.push(actor.dog.id);
          }
        }
      }

      if (
        !ownerRef.current &&
        isParkClosed(phaseRef.current) &&
        homeQueueRef.current.length > 0
      ) {
        const id = homeQueueRef.current[0]!;
        const queued = actors.find((actor) => actor.dog.id === id);
        if (!queued || queued.place === "away") {
          homeQueueRef.current.shift();
        } else if (!queued.partnerWalk) {
          homeQueueRef.current.shift();
          const visit = makeOwnerVisit(
            queued.dog,
            queued.place === "indoor" ? "collecting" : "approach",
            queued.place === "indoor" ? door.x - 8 : Math.max(8, queued.x - 20),
            queued.place === "indoor" ? door.y : queued.y,
          );
          visit.rush = true;
          visit.awayMs = 18 * 60 * 60 * 1000;
          ownerRef.current = visit;
        }
      }

      if (
        !ownerRef.current &&
        !isParkClosed(phaseRef.current) &&
        morningQueueRef.current.length > 0
      ) {
        const id = morningQueueRef.current.shift()!;
        const returning = actors.find(
          (actor) => actor.dog.id === id && actor.place === "away",
        );
        if (returning) {
          returning.nightRole = null;
          const visit = makeOwnerVisit(
            returning.dog,
            "returningTogether",
            -18,
            exitPoint.y,
          );
          ownerRef.current = visit;
          returning.partnerWalk = "return";
          returning.place = "yard";
          returning.placeUntil = 0;
          returning.buildingTarget = false;
          returning.fixtureTarget = null;
          returning.x = visit.x + 18;
          returning.y = visit.y + 8;
          setPresence(returning.dog.id, { place: "yard" });
        }
      }

      if (!isParkClosed(phaseRef.current)) {
        for (const actor of actors) {
          if (
            actor.place === "away" &&
            actor.placeUntil - now > 120_000
          ) {
            actor.nightRole = "home";
          }
          if (
            actor.nightRole === "home" &&
            actor.place === "away" &&
            ownerRef.current?.dogId !== actor.dog.id &&
            !morningQueueRef.current.includes(actor.dog.id)
          ) {
            morningQueueRef.current.push(actor.dog.id);
          }
        }
        for (const actor of actors) {
          if (actor.nightRole !== "overnight" || actor.place !== "indoor") continue;
          if (looseCount() < MAX_LOOSE) {
            emerge(actor);
          } else {
            actor.placeUntil = now + 4000 + Math.random() * 4000;
          }
          actor.nightRole = null;
        }
      }

      if (
        !ownerRef.current &&
        !isParkClosed(phaseRef.current) &&
        homeQueueRef.current.length === 0 &&
        morningQueueRef.current.length === 0 &&
        now >= nextOwnerAtRef.current
      ) {
        const candidates = actors.filter(
          (actor) => actor.place === "yard" && !actor.partnerWalk,
        );
        if (candidates.length > 0 && nextOwnerAtRef.current !== 0) {
          const dog = candidates[Math.floor(Math.random() * candidates.length)]!;
          ownerRef.current = makeOwnerVisit(
            dog.dog,
            "approach",
            16,
            Math.max(minY, h * 0.62),
          );
        }
        if (nextOwnerAtRef.current === 0) nextOwnerAtRef.current = now + 2500;
      }

      const owner = ownerRef.current;
      if (owner) {
        owner.frameTimer += dt;
        if (owner.frameTimer > 0.22) {
          owner.frame = (owner.frame + 1) % 2;
          owner.frameTimer = 0;
        }
        const dog = actors.find((actor) => actor.dog.id === owner.dogId);
        const moveOwner = (goal: { x: number; y: number }, speed: number, arrive: number) => {
          const dx = goal.x - owner.x;
          const dy = goal.y - owner.y;
          const len = Math.hypot(dx, dy) || 1;
          if (len > arrive) {
            owner.x += (dx / len) * speed * dt;
            owner.y += (dy / len) * speed * dt;
            owner.flip = dx < 0;
            return false;
          }
          return true;
        };
        const followBeside = (walker: Actor) => {
          const side = owner.flip ? 18 : -12;
          const slotX = owner.x + side;
          const slotY = owner.y + 8;
          const dx = slotX - walker.x;
          const dy = slotY - walker.y;
          const len = Math.hypot(dx, dy) || 1;
          if (len > 4) {
            const speed = len > 40 ? 240 : 120;
            const stepDist = Math.min(len, speed * dt);
            walker.x += (dx / len) * stepDist;
            walker.y += (dy / len) * stepDist;
          }
          walker.flip = owner.flip;
          walker.frame = owner.frame;
          walker.vx = 0;
          walker.vy = 0;
          return len;
        };
        const beginExit = (walker: Actor, fromDoor: boolean) => {
          walker.place = "yard";
          walker.placeUntil = 0;
          walker.buildingTarget = false;
          walker.fixtureTarget = null;
          walker.partnerId = null;
          walker.interactUntil = 0;
          walker.targetId = null;
          walker.busyUntil = 0;
          walker.partnerWalk = "exit";
          if (fromDoor) {
            walker.x = door.x - SPRITE_W / 2;
            walker.y = door.y;
          }
          setPresence(walker.dog.id, { place: "yard" });
          owner.phase = "leavingTogether";
          if (!owner.awayMs) owner.awayMs = 25_000 + Math.random() * 20_000;
        };
        const finishPickup = (walker: Actor) => {
          const awayMs = owner.awayMs || 30_000;
          walker.place = "away";
          walker.placeUntil = now + awayMs;
          if (owner.rush) walker.nightRole = "home";
          walker.partnerWalk = null;
          walker.buildingTarget = false;
          walker.fixtureTarget = null;
          setPresence(walker.dog.id, {
            place: "away",
            until: new Date(Date.now() + awayMs).toISOString(),
          });
          const entry = recordInteraction({
            dogAId: walker.dog.id,
            dogAName: walker.dog.name,
            dogBId: "__owner__",
            dogBName: owner.ownerName,
            kind: "pickup",
          });
          if (entry) onInteractionRef.current?.(entry);
          ownerRef.current = null;
          nextOwnerAtRef.current = now + 20_000 + Math.random() * 15_000;
        };
        const finishReturn = (walker: Actor) => {
          walker.partnerWalk = null;
          walker.place = "yard";
          walker.placeUntil = 0;
          walker.x = releasePoint.x;
          walker.y = releasePoint.y;
          setPresence(walker.dog.id, { place: "yard" });
          changeHappiness(walker, 4);
          const entry = recordInteraction({
            dogAId: walker.dog.id,
            dogAName: walker.dog.name,
            dogBId: "__owner__",
            dogBName: owner.ownerName,
            kind: "return",
          });
          if (entry) onInteractionRef.current?.(entry);
          bubblesRef.current = [
            ...bubblesRef.current.filter((bubble) => bubble.until > now),
            {
              id: `back-${walker.dog.id}-${now}`,
              dogId: walker.dog.id,
              text: "i'm back!",
              until: now + 2200,
            },
          ].slice(-8);
          owner.phase = "depart";
        };
        const takeDog = () => {
          if (!dog || dog.place === "away") {
            owner.phase = "depart";
            return;
          }
          if (!owner.rush) owner.awayMs = 25_000 + Math.random() * 20_000;
          if (dog.place === "indoor") {
            owner.phase = "collecting";
            return;
          }
          beginExit(dog, false);
        };
        if (
          isParkClosed(phaseRef.current) &&
          !owner.rush &&
          owner.phase !== "leavingTogether" &&
          owner.phase !== "returningTogether" &&
          owner.phase !== "collecting" &&
          owner.phase !== "depart"
        ) {
          owner.rush = true;
          talkingRef.current = false;
          setDialogue(null);
          takeDog();
        }
        if (owner.phase === "dropoff") {
          if (now >= owner.until) ownerRef.current = null;
        } else if (owner.phase === "talking" || talkingRef.current) {
          owner.phase = "talking";
        } else if (owner.phase === "greeting") {
          if (now >= owner.until) takeDog();
        } else if (owner.phase === "collecting") {
          if (!dog || dog.place === "away") owner.phase = "depart";
          else if (dog.place === "yard") beginExit(dog, false);
          else if (moveOwner(door, owner.rush ? 140 : 78, 22)) beginExit(dog, true);
        } else if (owner.phase === "leavingTogether" && dog) {
          const gap = followBeside(dog);
          if (gap < 40) moveOwner(exitPoint, owner.rush ? 130 : 72, 6);
          if (owner.x < -36 && dog.x < -SPRITE_W) finishPickup(dog);
        } else if (owner.phase === "returningTogether" && dog) {
          followBeside(dog);
          const arrived = moveOwner(releasePoint, owner.rush ? 130 : 72, 18);
          if (arrived) finishReturn(dog);
        } else if (owner.phase === "depart" || !dog || dog.place === "away") {
          const left = moveOwner(exitPoint, owner.rush ? 140 : 78, 8);
          if (left || owner.x < -40) ownerRef.current = null;
        } else if (owner.phase === "approach" && dog) {
          const goal =
            dog.place === "indoor"
              ? door
              : { x: dog.x + SPRITE_W / 2, y: dog.y + 8 };
          const arrived = moveOwner(goal, owner.rush ? 140 : 78, 28);
          if (arrived) {
            if (owner.rush) {
              takeDog();
            } else {
              owner.phase = "greeting";
              owner.until = now + 8000;
            }
          }
        }
      }

      const visitingOffer = ownerRef.current;
      const showOwnerTalkOffer =
        visitingOffer &&
        !visitingOffer.rush &&
        !talkingRef.current &&
        (visitingOffer.phase === "approach" ||
          visitingOffer.phase === "greeting");
      if (showOwnerTalkOffer && !ownerTalkOfferActiveRef.current) {
        ownerTalkOfferActiveRef.current = true;
        setOwnerTalkOffer({ ownerName: visitingOffer.ownerName });
      } else if (!showOwnerTalkOffer && ownerTalkOfferActiveRef.current) {
        ownerTalkOfferActiveRef.current = false;
        setOwnerTalkOffer(null);
      }

      if (!reduced) {
        const looseNow = actors.filter(
          (actor) =>
            actor.place === "yard" && !actor.partnerWalk && !actor.buildingTarget,
        );
        if (looseNow.length > MAX_LOOSE && !isParkClosed(phaseRef.current)) {
          const calm = looseNow
            .filter(
              (actor) =>
                actor.interactUntil <= now &&
                actor.busyUntil <= now &&
                !actor.fixtureTarget &&
                !actor.partnerId &&
                ownerRef.current?.dogId !== actor.dog.id,
            )
            .sort((a, b) => a.happiness - b.happiness);
          for (const actor of calm.slice(0, looseNow.length - MAX_LOOSE)) {
            actor.buildingTarget = true;
            actor.targetId = null;
            actor.fixtureTarget = null;
            actor.nextEnterAt = now + 14000 + Math.random() * 8000;
          }
        }

        for (const actor of actors) {
          if (actor.place !== "yard") continue;
          if (actor.partnerWalk) {
            actor.frame = ownerRef.current?.frame ?? actor.frame;
            continue;
          }
          const roundedBefore = Math.round(actor.happiness);
          actor.happiness = Math.max(0, actor.happiness - idleDecay(dt * 1000));
          const roundedAfter = Math.round(actor.happiness);
          if (roundedAfter !== roundedBefore) {
            setHappiness(actor.dog.id, roundedAfter);
          }

          if (actor.interactUntil && now >= actor.interactUntil) {
            actor.interactUntil = 0;
            actor.partnerId = null;
            actor.vx = (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.4);
            actor.vy = (Math.random() > 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.3);
          }

          if (actor.interactUntil > now) {
            const partner = actors.find((other) => other.dog.id === actor.partnerId);
            if (partner) actor.flip = partner.x + SPRITE_W / 2 < actor.x + SPRITE_W / 2;
            actor.frameTimer += dt;
            if (actor.frameTimer > 0.18) {
              actor.frame = (actor.frame + 1) % 2;
              actor.frameTimer = 0;
            }
            continue;
          }

          if (actor.busyUntil > now) {
            actor.frameTimer += dt;
            if (actor.frameTimer > 0.18) {
              actor.frame = (actor.frame + 1) % 2;
              actor.frameTimer = 0;
            }
            continue;
          }

          if (actor.buildingTarget && !actor.fixtureTarget) {
            const dx = door.x - (actor.x + SPRITE_W / 2);
            const dy = door.y - (actor.y + SPRITE_H / 2);
            const len = Math.hypot(dx, dy) || 1;
            const atDoor =
              Math.abs(dx) < 36 && actor.y <= minY + 8;
            if (atDoor || len < 48) {
              const restMs = 3000 + Math.random() * 2000;
              actor.place = "indoor";
              actor.placeUntil = now + restMs;
              actor.buildingTarget = false;
              actor.vx = 0;
              actor.vy = 0;
              setPresence(actor.dog.id, {
                place: "indoor",
                until: new Date(Date.now() + restMs).toISOString(),
              });
              changeHappiness(actor, 6);
            } else {
              actor.vx = (dx / len) * 0.85;
              actor.vy = (dy / len) * 0.7;
              actor.flip = actor.vx < 0;
              actor.x += actor.vx * 46 * dt;
              actor.y += actor.vy * 46 * dt;
              clamp(actor, minX, maxX, Math.min(minY, door.y), maxY);
              actor.frameTimer += dt;
              if (actor.frameTimer > 0.22) {
                actor.frame = (actor.frame + 1) % 2;
                actor.frameTimer = 0;
              }
            }
            continue;
          }

          if (actor.fixtureTarget) {
            const fixture =
              fixtures.find((item) => item.id === actor.fixtureTarget?.id) ??
              actor.fixtureTarget;
            if (!fixture) {
              actor.fixtureTarget = null;
            } else {
              const dx = fixture.x - (actor.x + SPRITE_W / 2);
              const dy = fixture.y - (actor.y + SPRITE_H / 2);
              const len = Math.hypot(dx, dy) || 1;
              if (len < 26) {
                arriveAtFixture(actor, fixture, now);
              } else {
                actor.vx = (dx / len) * 0.95;
                actor.vy = (dy / len) * 0.7;
                actor.flip = actor.vx < 0;
                actor.x += actor.vx * 46 * dt;
                actor.y += actor.vy * 46 * dt;
                clamp(actor, minX, maxX, minY, maxY);
                actor.frameTimer += dt;
                if (actor.frameTimer > 0.22) {
                  actor.frame = (actor.frame + 1) % 2;
                  actor.frameTimer = 0;
                }
              }
              continue;
            }
          }

          actor.socialCooldown = Math.max(0, actor.socialCooldown - dt);
          if (
            now >= actor.nextEnterAt &&
            looseCount() > MAX_LOOSE &&
            !isParkClosed(phaseRef.current) &&
            !actor.fixtureTarget &&
            actor.interactUntil <= now &&
            ownerRef.current?.dogId !== actor.dog.id &&
            !actor.partnerWalk
          ) {
            actor.buildingTarget = true;
            actor.targetId = null;
          }
          actor.retargetTimer -= dt;
          if (actor.retargetTimer <= 0) {
            actor.retargetTimer = 2.6 + Math.random() * 3.4;
            const shy = getPersonality(actor.dog) === "shy";
            const calmKinds: FixtureKind[] = ["water", "food", "chew", "bed"];
            const livelyKinds: FixtureKind[] = ["ball", "pool", "agility", "chew", "food"];
            const wantsFixture = Math.random() < (shy ? 0.12 : 0.26);
            if (wantsFixture) {
              const choices = fixtures.filter((fixture) =>
                (shy ? calmKinds : livelyKinds).includes(fixture.kind),
              );
              if (choices.length > 0) {
                actor.fixtureTarget = choices[Math.floor(Math.random() * choices.length)]!;
                actor.buildingTarget = false;
                actor.targetId = null;
                continue;
              }
            }
            const others = shy
              ? []
              : actors.filter(
                  (other) =>
                    other.dog.id !== actor.dog.id &&
                    other.interactUntil <= now &&
                    getPersonality(other.dog) === "social",
                );
            if (!shy && actor.socialCooldown <= 0 && others.length > 0 && Math.random() < 0.45) {
              const pick = others[Math.floor(Math.random() * others.length)]!;
              actor.targetId = pick.dog.id;
              actor.targetTimer = 3.5 + Math.random() * 2.5;
            } else {
              actor.targetId = null;
              actor.vx = (Math.random() > 0.5 ? 1 : -1) * (0.25 + Math.random() * 0.55);
              actor.vy = (Math.random() > 0.5 ? 1 : -1) * (0.12 + Math.random() * 0.4);
            }
          }

          if (actor.targetId && actor.targetTimer > 0) {
            actor.targetTimer -= dt;
            const target = actors.find((other) => other.dog.id === actor.targetId);
            if (!target || target.interactUntil > now) {
              actor.targetId = null;
            } else {
              const dx = target.x - actor.x;
              const dy = target.y - actor.y;
              const len = Math.hypot(dx, dy) || 1;
              actor.vx = (dx / len) * 0.9;
              actor.vy = (dy / len) * 0.6;
              actor.flip = actor.vx < 0;
            }
          }

          actor.x += actor.vx * 46 * dt;
          actor.y += actor.vy * 46 * dt;
          clamp(actor, minX, maxX, minY, maxY);
          if (!actor.targetId) actor.flip = actor.vx < 0;
          actor.frameTimer += dt;
          if (actor.frameTimer > 0.22 && Math.hypot(actor.vx, actor.vy) > 0.05) {
            actor.frame = (actor.frame + 1) % 2;
            actor.frameTimer = 0;
          }
        }

        for (let i = 0; i < actors.length; i++) {
          for (let j = i + 1; j < actors.length; j++) {
            const a = actors[i]!;
            const b = actors[j]!;
            if (a.place !== "yard" || b.place !== "yard") continue;
            if (a.partnerWalk || b.partnerWalk) continue;
            if (a.buildingTarget || b.buildingTarget) continue;
            if (a.interactUntil > now || b.interactUntil > now) continue;
            const ca = centerOf(a);
            const cb = centerOf(b);
            const dx = cb.x - ca.x;
            const dy = cb.y - ca.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < SEPARATION) {
              const push = (SEPARATION - dist) * 0.5;
              a.x -= (dx / dist) * push;
              b.x += (dx / dist) * push;
              a.y -= (dy / dist) * push * 0.4;
              b.y += (dy / dist) * push * 0.4;
              clamp(a, minX, maxX, minY, maxY);
              clamp(b, minX, maxX, minY, maxY);
            }
          }
        }

        let activePairs = 0;
        const seen = new Set<string>();
        for (const actor of actors) {
          if (!actor.partnerId || actor.interactUntil <= now) continue;
          const key = pairKey(actor.dog.id, actor.partnerId);
          if (!seen.has(key)) {
            seen.add(key);
            activePairs += 1;
          }
        }

        if (activePairs < MAX_PAIRS && now >= nextMeetingRef.current) {
          for (let i = 0; i < actors.length && activePairs < MAX_PAIRS; i++) {
            for (let j = i + 1; j < actors.length && activePairs < MAX_PAIRS; j++) {
              const a = actors[i]!;
              const b = actors[j]!;
              if (a.place !== "yard" || b.place !== "yard") continue;
              if (a.partnerWalk || b.partnerWalk) continue;
              if (a.buildingTarget || b.buildingTarget) continue;
              if (a.interactUntil > now || b.interactUntil > now) continue;
              if (a.busyUntil > now || b.busyUntil > now) continue;
              if (a.fixtureTarget || b.fixtureTarget) continue;
              if (a.socialCooldown > 0 || b.socialCooldown > 0) continue;
              const ca = centerOf(a);
              const cb = centerOf(b);
              const dist = Math.hypot(cb.x - ca.x, cb.y - ca.y);
              if (dist > INTERACT_DIST) continue;
              const key = pairKey(a.dog.id, b.dog.id);
              if ((pairCooldownRef.current.get(key) ?? 0) > now) continue;
              const shy =
                getPersonality(a.dog) === "shy" || getPersonality(b.dog) === "shy";
              if (shy) {
                const quiet = getPersonality(a.dog) === "shy" ? a : b;
                changeHappiness(quiet, -2);
                pairCooldownRef.current.set(key, now + PAIR_COOLDOWN_MS);
                bubblesRef.current = [
                  ...bubblesRef.current.filter((bubble) => bubble.until > now),
                  {
                    id: `space-${quiet.dog.id}-${now}`,
                    dogId: quiet.dog.id,
                    text: "…needs a little space",
                    until: now + 2200,
                  },
                ].slice(-8);
                const away = centerOf(b).x - centerOf(a).x;
                a.vx = away > 0 ? -0.6 : 0.6;
                b.vx = -a.vx;
                continue;
              }
              beginMeeting(a, b, now);
              clamp(a, minX, maxX, minY, maxY);
              clamp(b, minX, maxX, minY, maxY);
              activePairs += 1;
            }
          }
        }
      }

      const before = bubblesRef.current.length;
      bubblesRef.current = bubblesRef.current.filter((bubble) => bubble.until > now);
      if (before > 0 && bubblesRef.current.length === 0) {
        setLiveText("");
      }

      drawGrassBackground(ctx, w, h, LAYOUT_TOP);
      const building = bounds.building;
      drawDirtPath(ctx, door.x, door.y + 8, w / 2, h * 0.72);
      const doorOpen =
        actors.some((actor) => actor.buildingTarget || actor.place === "indoor") ||
        ownerRef.current !== null;
      const tint = nightTint(minutesRef.current);
      const lightsOn = tint.alpha > 0;
      drawDaycareBuilding(
        ctx,
        building.x,
        building.y,
        building.w,
        building.h,
        doorOpen,
        lightsOn,
      );
      const resting = actors.filter((actor) => actor.place === "indoor");
      if (resting.length > 0) {
        const cols = Math.max(1, Math.floor((building.w - 12) / 30));
        ctx.save();
        ctx.beginPath();
        ctx.rect(building.x + 3, building.y + 14, building.w - 6, building.h - 16);
        ctx.clip();
        resting.forEach((actor, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = building.x + 6 + col * 30;
          const y = building.y + 16 + row * 26;
          drawDog(ctx, {
            breedId: actor.dog.breedId,
            colorId: actor.dog.colorId,
            accessoryId: actor.dog.accessoryId,
            mood: "sleepy",
            frame: 0,
            scale: 1,
            x,
            y,
          });
          ctx.font = "8px sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = GB.ink;
          ctx.fillText(actor.dog.name.slice(0, 8), x + 16, y + 30);
        });
        ctx.restore();
      }
      const drawnFixtures = layoutFixtures(w, h, LAYOUT_TOP);
      for (const fixture of drawnFixtures) {
        const active = now < (fixtureActiveRef.current.get(fixture.id) ?? 0);
        const bounce = active ? Math.abs(Math.sin(now / 160)) * 5 : 0;
        if (fixture.kind === "water") drawWaterBowl(ctx, fixture.x, fixture.y, active);
        else if (fixture.kind === "food") drawFoodBowl(ctx, fixture.x, fixture.y, active);
        else if (fixture.kind === "chew") drawChewBone(ctx, fixture.x, fixture.y, active);
        else if (fixture.kind === "pool") drawKiddiePool(ctx, fixture.x, fixture.y, active);
        else if (fixture.kind === "agility") drawAgilityHurdle(ctx, fixture.x, fixture.y, active);
        else if (fixture.kind === "bed") drawDogBed(ctx, fixture.x, fixture.y, active);
        else {
          drawBall(
            ctx,
            fixture.x,
            fixture.y,
            bounce,
            active,
            fixture.ballIndex ?? 0,
          );
        }
      }

      const ownerDraw = ownerRef.current;
      const leashed = actors.find(
        (actor) =>
          actor.partnerWalk &&
          ownerDraw &&
          actor.dog.id === ownerDraw.dogId &&
          actor.place === "yard",
      );
      if (ownerDraw && leashed) {
        drawLeash(
          ctx,
          ownerDraw.x + 16,
          ownerDraw.y + 28,
          leashed.x + SPRITE_W / 2,
          leashed.y + 28,
        );
      }

      const sorted = [...actors]
        .filter((actor) => actor.place === "yard")
        .sort((a, b) => a.y - b.y);
      const heartsDrawn = new Set<string>();
      for (const actor of sorted) {
        drawDog(ctx, {
          breedId: actor.dog.breedId,
          colorId: actor.dog.colorId,
          accessoryId: actor.dog.accessoryId,
          mood: actor.dog.mood,
          frame: reduced ? 0 : actor.frame,
          flip: actor.flip,
          scale: SCALE,
          x: actor.x,
          y: actor.y,
        });

        if (actor.partnerId && actor.interactUntil > now) {
          const key = pairKey(actor.dog.id, actor.partnerId);
          const partner = actors.find((other) => other.dog.id === actor.partnerId);
          if (partner && !heartsDrawn.has(key)) {
            heartsDrawn.add(key);
            const mx = (actor.x + partner.x) / 2 + SPRITE_W / 2 - 6;
            const my = Math.min(actor.y, partner.y) - 4;
            drawHeart(ctx, mx, my);
          }
        }

        const tapped =
          labelRef.current?.id === actor.dog.id && now < labelRef.current.until;
        const meeting = Boolean(actor.partnerId && actor.interactUntil > now);
        if (tapped || meeting) {
          ctx.font = "10px sans-serif";
          ctx.textAlign = "center";
          const label = actor.dog.name;
          const tw = ctx.measureText(label).width + 8;
          const lx = actor.x + SPRITE_W / 2;
          const ly = actor.y - 6;
          drawHappinessBar(ctx, lx - 16, ly - 8, 32, actor.happiness / 100);
          ctx.fillStyle = GB.menu;
          ctx.fillRect(lx - tw / 2, ly, tw, 14);
          ctx.strokeStyle = GB.ink;
          ctx.lineWidth = 1;
          ctx.strokeRect(lx - tw / 2, ly, tw, 14);
          ctx.fillStyle = GB.ink;
          ctx.fillText(label, lx, ly + 10);
        }
      }

      for (const bubble of bubblesRef.current) {
        const actor = actors.find((item) => item.dog.id === bubble.dogId);
        if (!actor) continue;
        drawBubble(
          ctx,
          actor.x + SPRITE_W / 2,
          actor.y,
          bubble.text,
          w,
        );
      }

      if (ownerDraw) {
        drawOwner(
          ctx,
          ownerDraw.x,
          ownerDraw.y,
          ownerDraw.frame,
          ownerDraw.flip,
          2,
          ownerDraw.appearance,
        );
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = GB.menu;
        const label = ownerDraw.ownerName;
        const tw = ctx.measureText(label).width + 8;
        const labelY = ownerDraw.y - 16;
        ctx.fillRect(ownerDraw.x + 16 - tw / 2, labelY, tw, 14);
        ctx.strokeStyle = GB.ink;
        ctx.strokeRect(ownerDraw.x + 16 - tw / 2, labelY, tw, 14);
        ctx.fillStyle = GB.ink;
        ctx.fillText(label, ownerDraw.x + 16, labelY + 10);
        if (ownerDraw.phase === "greeting" || ownerDraw.phase === "talking") {
          ctx.fillStyle = GB.flowerYellow;
          ctx.fillRect(ownerDraw.x + 28, ownerDraw.y - 28, 8, 8);
        }
      }

      drawNightOverlay(ctx, w, h, tint);
      if (lightsOn) drawWindowLights(ctx, building.x, building.y, building.w);

      const visible = actors.filter((actor) => actor.place === "yard").length;
      if (now - countAtRef.current > 500) {
        countAtRef.current = now;
        onVisibleRef.current?.(visible);
      }
    };

    raf = requestAnimationFrame(step);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", onMq);
    };
  }, [syncActors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    syncActors(canvas.clientWidth, canvas.clientHeight);
  }, [dogs, syncActors]);

  const onPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const visiting = ownerRef.current;
    if (
      visiting &&
      !visiting.rush &&
      (visiting.phase === "approach" ||
        visiting.phase === "greeting" ||
        visiting.phase === "talking") &&
      x >= visiting.x - 4 &&
      x <= visiting.x + 40 &&
      y >= visiting.y - 4 &&
      y <= visiting.y + 70
    ) {
      const dog = actorsRef.current.find((actor) => actor.dog.id === visiting.dogId);
      if (dog) {
        beginOwnerTalk();
        return;
      }
    }

    const sorted = [...actorsRef.current].sort((a, b) => b.y - a.y);
    for (const actor of sorted) {
      if (
        x >= actor.x &&
        x <= actor.x + SPRITE_W &&
        y >= actor.y &&
        y <= actor.y + SPRITE_H + 28
      ) {
        const audio = getAudio();
        audio.unlock();
        const now = performance.now();
        const previous = lastClickRef.current;
        if (previous && previous.id === actor.dog.id && now - previous.time < 400) {
          lastClickRef.current = null;
          onOpenProfileRef.current?.(actor.dog);
          return;
        }
        lastClickRef.current = { id: actor.dog.id, time: now };
        labelRef.current = { id: actor.dog.id, until: now + 2800 };
        audio.play("bark");
        const recent = getRecentWith(actor);
        bubblesRef.current = [
          ...bubblesRef.current.filter((bubble) => bubble.dogId !== actor.dog.id),
          {
            id: `tap-${actor.dog.id}-${now}`,
            dogId: actor.dog.id,
            text: recent
              ? `Hi, I'm ${actor.dog.name}!\n${recent}`
              : `Hi, I'm ${actor.dog.name}!\nI love ${actor.dog.favoriteThing}`,
            until: now + 2800,
          },
        ];
        setLiveText(
          recent
            ? `${actor.dog.name}. ${recent}`
            : `Hi, I'm ${actor.dog.name}. I love ${actor.dog.favoriteThing}`,
        );
        onSelectRef.current?.(actor.dog);
        return;
      }
    }

    const audio = getAudio();
    audio.unlock();
    const fixture = hitFixture(
      layoutFixtures(canvas.clientWidth, canvas.clientHeight, LAYOUT_TOP),
      x,
      y,
    );
    if (fixture) {
      audio.play("click");
      const now = performance.now();
      if (fixture.kind === "water" || fixture.kind === "food") {
        audio.play("slurp");
      }
      fixtureActiveRef.current.set(fixture.id, now + (fixture.kind === "ball" ? 12000 : 8000));
      pendingFixtureRef.current = fixture;
      return;
    }

    const building = getBuildingRect(canvas.clientWidth, canvas.clientHeight, LAYOUT_TOP);
    if (buildingContains(building, x, y)) {
      const resting = actorsRef.current.filter((actor) => actor.place === "indoor").length;
      setLiveText(
        resting === 1 ? "1 pup resting inside" : `${resting} pups resting inside`,
      );
    }
  };

  return (
    <div className={`relative h-full min-h-[420px] w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-manipulation"
        role="img"
        aria-label="Daycare yard. Dogs greet each other as they wander. Tap a dog to open their playdate log."
        onClick={(e) => onPointer(e.clientX, e.clientY)}
        onDoubleClick={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const sorted = [...actorsRef.current].sort((a, b) => b.y - a.y);
          const actor = sorted.find(
            (item) =>
              x >= item.x &&
              x <= item.x + SPRITE_W &&
              y >= item.y &&
              y <= item.y + SPRITE_H + 28,
          );
          if (actor) onOpenProfileRef.current?.(actor.dog);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            onPointer(rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
        }}
        tabIndex={0}
      />
      {ownerTalkOffer && !dialogue && (
        <button
          type="button"
          className="pointer-events-auto absolute inset-x-3 top-2 z-25 border-4 border-[var(--ink)] bg-[var(--card)] px-3 py-2 text-center shadow-[inset_0_0_0_3px_var(--yard-green),3px_3px_0_var(--ink)]"
          onClick={(event) => {
            event.stopPropagation();
            beginOwnerTalk();
          }}
        >
          <span className="font-pixel block text-[0.5rem] leading-relaxed text-[var(--ink)]">
            {ownerTalkOffer.ownerName} is here
          </span>
          <span className="mt-0.5 block text-xs text-[var(--ink)]/75">
            Tap to talk
          </span>
        </button>
      )}
      {liveText && (
        <span className="sr-only" role="status">
          {liveText}
        </span>
      )}
      {dialogue && (
        <div
          className="absolute inset-x-3 bottom-3 z-30 border-4 border-[var(--ink)] bg-[var(--card)] px-3 pt-4 pb-3 shadow-[inset_0_0_0_4px_var(--yard-green),4px_4px_0_var(--ink)]"
          role="dialog"
          aria-label={`Talking with ${dialogue.name}`}
        >
          <p className="font-pixel absolute -top-3 left-3 border-[3px] border-[var(--ink)] bg-[var(--card)] px-2 py-1 text-[0.5rem] text-[var(--ink)]">
            {dialogue.name}
          </p>
          <p className="mt-2 min-h-10 font-pixel text-[0.55rem] leading-relaxed">
            {dialogue.lines[dialogue.index]}
          </p>
          <button
            type="button"
            className="pixel-button mt-3 px-2 py-1 text-[0.5rem]"
            autoFocus
            onClick={() => {
              getAudio().play("click");
              if (dialogue.index + 1 >= dialogue.lines.length) {
                talkingRef.current = false;
                const owner = ownerRef.current;
                if (owner) {
                  owner.phase = "greeting";
                  owner.until = performance.now() + 1200;
                }
                setDialogue(null);
              } else {
                setDialogue({ ...dialogue, index: dialogue.index + 1 });
              }
            }}
          >
            {dialogue.index + 1 >= dialogue.lines.length ? "Bye" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}

function getRecentWith(actor: Actor): string | null {
  const latest = getLogForDog(actor.dog.id)[0];
  if (!latest) return null;
  return personalLine(latest, actor.dog.id);
}

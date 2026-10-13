"use client";

import { useEffect, useState } from "react";
import { DogPreview } from "@/components/DogPreview";
import { getBadgesForDog } from "@/lib/badges";
import {
  getLogForDog,
  personalLine,
  type YardInteraction,
} from "@/lib/interactions";
import { getPersonality, type Dog } from "@/lib/types";
import { storedHappiness } from "@/lib/yardRuntime";

type Props = {
  dog: Dog;
};

export function DogCard({ dog }: Props) {
  const badges = getBadgesForDog(dog.createdAt);
  const [log, setLog] = useState<YardInteraction[]>([]);
  const [happiness, setHappinessValue] = useState<number | null>(null);
  const personality = getPersonality(dog);

  useEffect(() => {
    setLog(getLogForDog(dog.id).slice(0, 5));
    setHappinessValue(storedHappiness(dog.id));
  }, [dog.id]);
  const joined = new Date(dog.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="pixel-card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <DogPreview
          breedId={dog.breedId}
          colorId={dog.colorId}
          accessoryId={dog.accessoryId}
          mood={dog.mood}
          scale={2}
          animate={false}
          label={`${dog.name}, a ${dog.breedId}`}
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-pixel text-[0.6rem] leading-relaxed break-words">
            {dog.name}
          </h2>
          <p className="text-sm text-[var(--ink)]/80">
            Owner: {dog.ownerName}
          </p>
          <p className="text-sm">Age {dog.age}</p>
          <p className="text-sm">
            {personality === "shy" ? "Shy pup" : "Social butterfly"}
            {happiness !== null ? ` · Happiness ${Math.round(happiness)}` : ""}
          </p>
          {badges.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-1" aria-label="Badges">
              {badges.map((b) => (
                <li
                  key={b.id}
                  className="inline-flex items-center gap-1 border-2 border-[var(--ink)] bg-[#FFE8A0] px-1.5 py-0.5 text-xs"
                  title={b.label}
                >
                  <span aria-hidden>{b.icon}</span>
                  {b.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="text-sm">
        <span className="font-semibold">Loves:</span> {dog.favoriteThing}
      </p>
      {dog.introLine && (
        <p className="text-sm italic text-[var(--ink)]/90">&ldquo;{dog.introLine}&rdquo;</p>
      )}
      <div>
        <h3 className="text-sm font-semibold">Playdates</h3>
        {log.length === 0 ? (
          <p className="text-sm text-[var(--ink)]/70">No meetings recorded yet.</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {log.map((entry) => (
              <li key={entry.id} className="text-sm">
                {personalLine(entry, dog.id)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-[var(--ink)]/60">Joined {joined}</p>
    </article>
  );
}

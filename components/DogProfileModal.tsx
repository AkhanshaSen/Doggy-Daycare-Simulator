"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DogPreview } from "@/components/DogPreview";
import { getBadgesForDog } from "@/lib/badges";
import { getLogForDog, personalLine } from "@/lib/interactions";
import { getPersonality, type Dog } from "@/lib/types";
import { getHappiness } from "@/lib/yardRuntime";

type Props = {
  dog: Dog | null;
  onClose: () => void;
};

export function DogProfileModal({ dog, onClose }: Props) {
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [happiness, setHappinessValue] = useState(72);

  useEffect(() => {
    if (!dog) return;
    const read = () => setHappinessValue(getHappiness(dog.id));
    read();
    const timer = window.setInterval(read, 800);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [dog]);

  if (!dog) return null;

  const badges = getBadgesForDog(dog.createdAt);
  const log = getLogForDog(dog.id).slice(0, 5);
  const personality = getPersonality(dog);
  const joined = new Date(dog.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f380f]/45 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pixel-card max-h-[90dvh] w-full max-w-md overflow-y-auto p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-pixel text-[0.65rem] leading-relaxed">
            {dog.name}
          </h2>
          <button
            type="button"
            className="pixel-button pixel-button-secondary px-2 py-1 text-[0.5rem]"
            onClick={onClose}
            autoFocus
          >
            Close
          </button>
        </div>
        <div className="mt-3 flex gap-3">
          <DogPreview
            breedId={dog.breedId}
            colorId={dog.colorId}
            accessoryId={dog.accessoryId}
            mood={dog.mood}
            scale={3}
            label={`${dog.name}, a ${dog.breedId}`}
          />
          <div className="text-sm">
            <p>Owner: {dog.ownerName}</p>
            <p>Age {dog.age}</p>
            <p className="mt-1">
              {personality === "shy"
                ? "Shy pup — prefers solo time"
                : "Social butterfly"}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span>Happiness</span>
            <span>{Math.round(happiness)}</span>
          </div>
          <div className="h-3 border-2 border-[var(--ink)] bg-white">
            <div
              className="h-full"
              style={{
                width: `${Math.max(0, Math.min(100, happiness))}%`,
                background:
                  happiness > 60 ? "#306230" : happiness > 35 ? "#d0a020" : "#c04040",
              }}
            />
          </div>
        </div>
        <p className="mt-3 text-sm">
          <span className="font-semibold">Loves:</span> {dog.favoriteThing}
        </p>
        {dog.introLine && (
          <p className="mt-1 text-sm italic">&ldquo;{dog.introLine}&rdquo;</p>
        )}
        {badges.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Badges">
            {badges.map((badge) => (
              <li
                key={badge.id}
                className="border-2 border-[var(--ink)] bg-[#f8e060] px-1.5 py-0.5 text-xs"
              >
                {badge.icon} {badge.label}
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-3 text-sm font-semibold">Playdates</h3>
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
        <p className="mt-3 text-xs text-[var(--ink)]/60">Joined {joined}</p>
      </div>
    </div>
  );
}

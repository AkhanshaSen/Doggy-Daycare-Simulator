"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DogPreview } from "@/components/DogPreview";
import { MuteToggle } from "@/components/MuteToggle";
import { getAudio } from "@/lib/audio";
import { getDogRepository } from "@/lib/localDogRepository";
import { useDogStore } from "@/lib/store";
import type { Dog } from "@/lib/types";

export default function AddedPage() {
  const lastAddedId = useDogStore((s) => s.lastAddedId);
  const draft = useDogStore((s) => s.draft);
  const resetDraft = useDogStore((s) => s.resetDraft);
  const [dog, setDog] = useState<Dog | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (lastAddedId) {
        const found = await getDogRepository().getDogById(lastAddedId);
        if (!cancelled && found) {
          setDog(found);
          return;
        }
      }
      // Fallback to draft preview if storage race
      if (!cancelled) {
        setDog({
          id: lastAddedId ?? "preview",
          ownerName: draft.ownerName,
          name: draft.name || "Your pup",
          age: Number(draft.age) || 0,
          favoriteThing: draft.favoriteThing || "the yard",
          introLine: draft.introLine || undefined,
          breedId: draft.breedId,
          colorId: draft.colorId,
          accessoryId: draft.accessoryId,
          mood: "happy",
          createdAt: new Date().toISOString(),
          status: "in_yard",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lastAddedId, draft]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--sky-blue)] px-4 py-8">
      <div className="absolute top-4 right-4">
        <MuteToggle />
      </div>
      <div className="pixel-card flex w-full max-w-md flex-col items-center gap-4 p-6 text-center">
        <p className="font-pixel text-[0.55rem] text-[var(--accent-orange)]">
          Success!
        </p>
        <h1 className="font-pixel text-[0.7rem] leading-relaxed">
          {dog?.name ?? "Your dog"} joined the yard
        </h1>
        {dog && (
          <DogPreview
            breedId={dog.breedId}
            colorId={dog.colorId}
            accessoryId={dog.accessoryId}
            mood={dog.mood}
            scale={4}
            label={`${dog.name} is ready`}
          />
        )}
        <p className="text-sm text-[var(--ink)]/80">
          {dog?.ownerName
            ? `${dog.ownerName}'s pup is already making friends.`
            : "They're already making friends."}
        </p>
        <Link
          href="/"
          className="pixel-button"
          onClick={() => {
            getAudio().unlock();
            getAudio().play("click");
            resetDraft();
          }}
        >
          Visit the yard
        </Link>
      </div>
    </main>
  );
}

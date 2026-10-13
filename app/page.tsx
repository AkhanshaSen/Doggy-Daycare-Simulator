"use client";

import { useEffect, useState } from "react";
import { DogProfileModal } from "@/components/DogProfileModal";
import { PlaydateLog } from "@/components/PlaydateLog";
import { SiteHeader } from "@/components/SiteHeader";
import { YardCanvas } from "@/components/YardCanvas";
import { getDogRepository } from "@/lib/localDogRepository";
import { useDogStore } from "@/lib/store";
import type { Dog } from "@/lib/types";

export default function YardPage() {
  const setYardDogs = useDogStore((s) => s.setYardDogs);
  const yardDogs = useDogStore((s) => s.yardDogs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileDog, setProfileDog] = useState<Dog | null>(null);
  const [logRevision, setLogRevision] = useState(0);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dogs = await getDogRepository().getYardDogs();
        if (!cancelled) {
          setYardDogs(dogs);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load the yard. Try refreshing.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setYardDogs]);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--yard-green)]">
      <SiteHeader
        yardCount={loading ? undefined : (visibleCount ?? yardDogs.length)}
      />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-[420px] flex-1">
          {loading && (
            <p className="font-pixel absolute inset-0 z-10 flex items-center justify-center text-[0.55rem] text-[var(--ink)]">
              Opening the yard…
            </p>
          )}
          {error && (
            <p className="absolute inset-0 z-10 flex items-center justify-center p-4 text-center text-[var(--ink)]">
              {error}
            </p>
          )}
          {!loading && !error && (
            <YardCanvas
              dogs={yardDogs}
              onSelectDog={(dog) => setSelectedId(dog.id)}
              onOpenProfile={setProfileDog}
              onInteraction={() => setLogRevision((value) => value + 1)}
              onVisibleCountChange={setVisibleCount}
            />
          )}
        </div>
        {!loading && !error && (
          <PlaydateLog
            dogs={yardDogs}
            selectedId={selectedId}
            revision={logRevision}
            onClearSelection={() => setSelectedId(null)}
          />
        )}
      </div>
      <p className="relative z-10 px-4 pb-3 text-center text-xs text-[var(--ink)]/70">
        Tap an owner to talk · Double-tap a dog for their card · Tap bowls, toys, the pool, or the hurdle
      </p>
      <DogProfileModal dog={profileDog} onClose={() => setProfileDog(null)} />
    </main>
  );
}


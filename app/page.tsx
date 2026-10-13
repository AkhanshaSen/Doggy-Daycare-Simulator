"use client";

import { useEffect, useRef, useState } from "react";
import { DogProfileModal } from "@/components/DogProfileModal";
import { PlaydateLog } from "@/components/PlaydateLog";
import { SiteHeader } from "@/components/SiteHeader";
import { YardCanvas } from "@/components/YardCanvas";
import { YardControls } from "@/components/YardControls";
import type { ClockSpeed } from "@/lib/clock";
import { getDogRepository } from "@/lib/localDogRepository";
import type { ParkThemeId } from "@/lib/parkThemes";
import {
  clearPendingDropoff,
  isYourDog,
  latestDogId,
  readPlayer,
  type PlayerProfile,
} from "@/lib/player";
import { readSettings, writeSettings, type YardSettings } from "@/lib/settings";
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
  const [settings, setSettings] = useState<YardSettings | null>(null);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [clockSeek, setClockSeek] = useState(0);
  const scrubAtRef = useRef(0);
  const logDefaulted = useRef(false);

  useEffect(() => {
    setSettings(readSettings());
    setPlayer(readPlayer());
  }, []);

  useEffect(() => {
    if (logDefaulted.current || !player || yardDogs.length === 0) return;
    logDefaulted.current = true;
    if (selectedId) return;
    const preferred = latestDogId(player);
    if (preferred && yardDogs.some((dog) => dog.id === preferred)) {
      setSelectedId(preferred);
    }
  }, [player, yardDogs, selectedId]);

  const saveSettings = (next: YardSettings) => {
    setSettings(next);
    writeSettings(next);
  };

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
      {settings && (
        <YardControls
          minutes={settings.minutes}
          speed={settings.speed}
          themeId={settings.themeId}
          onMinutes={(minutes) => {
            scrubAtRef.current = performance.now();
            setClockSeek((value) => value + 1);
            saveSettings({ ...settings, minutes });
          }}
          onSpeed={(speed: ClockSpeed) => saveSettings({ ...settings, speed })}
          onTheme={(themeId: ParkThemeId) => saveSettings({ ...settings, themeId })}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:items-stretch">
        <div className="relative min-h-[min(340px,42dvh)] flex-1 lg:min-h-[420px]">
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
          {!loading && !error && settings && (
            <YardCanvas
              dogs={yardDogs}
              themeId={settings.themeId}
              clockMinutes={settings.minutes}
              clockSpeed={settings.speed}
              clockSeek={clockSeek}
              onClockMinutes={(minutes) => {
                if (performance.now() - scrubAtRef.current < 500) return;
                setSettings((current) => {
                  if (!current) return current;
                  const next = { ...current, minutes };
                  writeSettings(next);
                  return next;
                });
              }}
              player={player}
              onDropoffFinished={() => setPlayer(clearPendingDropoff())}
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
            yours={Boolean(selectedId && isYourDog(selectedId, player))}
            onSelectDog={setSelectedId}
          />
        )}
      </div>
      <p className="relative z-10 px-4 pb-3 text-center text-xs text-[var(--ink)]/70">
        Slide the clock to dusk — pups go home or sleep inside · Tap an owner to talk · Double-tap a dog for their card
      </p>
      <DogProfileModal dog={profileDog} onClose={() => setProfileDog(null)} />
    </main>
  );
}


"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DogCard } from "@/components/DogCard";
import { MuteToggle } from "@/components/MuteToggle";
import { getAudio } from "@/lib/audio";
import { getDogRepository } from "@/lib/localDogRepository";
import type { Dog } from "@/lib/types";

export default function VisitorRecordPage() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (pageNum: number, append: boolean) => {
    const result = await getDogRepository().getGraduatedDogs(pageNum);
    setDogs((prev) => (append ? [...prev, ...result.dogs] : result.dogs));
    setHasMore(result.hasMore);
    setPage(pageNum);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load(0, false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const playClick = () => {
    getAudio().unlock();
    getAudio().play("click");
  };

  return (
    <main className="min-h-dvh bg-[var(--sky-blue)] px-4 py-4 pb-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <Link
              href="/"
              className="text-sm text-[var(--accent-orange)] underline"
              onClick={playClick}
            >
              ← Visit the yard
            </Link>
            <h1 className="font-pixel mt-2 text-[0.7rem] leading-relaxed sm:text-[0.85rem]">
              Visitor Record
            </h1>
            <p className="mt-1 text-sm text-[var(--ink)]/70">
              Graduates from the yard live here forever (on this device).
            </p>
          </div>
          <MuteToggle />
        </div>

        {loading && (
          <p className="font-pixel text-[0.5rem]">Loading records…</p>
        )}

        {!loading && dogs.length === 0 && (
          <div className="pixel-card mx-auto max-w-md p-8 text-center">
            <p className="font-pixel text-[0.55rem] leading-relaxed">
              No graduates yet. Dogs move here once the yard fills up.
            </p>
            <Link
              href="/"
              className="pixel-button mt-6 inline-block"
              onClick={playClick}
            >
              Visit the yard
            </Link>
          </div>
        )}

        {!loading && dogs.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {dogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  className="pixel-button pixel-button-secondary"
                  disabled={loadingMore}
                  onClick={async () => {
                    playClick();
                    setLoadingMore(true);
                    try {
                      await load(page + 1, true);
                    } finally {
                      setLoadingMore(false);
                    }
                  }}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

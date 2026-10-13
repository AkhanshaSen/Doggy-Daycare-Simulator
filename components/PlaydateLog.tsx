"use client";

import { useEffect, useState } from "react";
import {
  getAllInteractions,
  getLogForDog,
  interactionLine,
  personalLine,
  type YardInteraction,
} from "@/lib/interactions";
import type { Dog } from "@/lib/types";

type Props = {
  dogs: Dog[];
  selectedId: string | null;
  revision: number;
  onClearSelection: () => void;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PlaydateLog({
  dogs,
  selectedId,
  revision,
  onClearSelection,
}: Props) {
  const [entries, setEntries] = useState<YardInteraction[]>([]);
  const selected = dogs.find((d) => d.id === selectedId) ?? null;

  useEffect(() => {
    const next = selectedId
      ? getLogForDog(selectedId)
      : getAllInteractions();
    setEntries(next.slice(0, selectedId ? 20 : 12));
  }, [selectedId, revision]);

  return (
    <aside
      className="z-20 flex max-h-64 w-full flex-col border-t-3 border-[var(--ink)] bg-[#fffdf8] lg:max-h-none lg:w-80 lg:border-t-0 lg:border-l-3"
      aria-label="Playdate log"
    >
      <div className="flex items-start justify-between gap-2 border-b-2 border-[var(--ink)] px-3 py-3">
        <div>
          <h2 className="font-pixel text-[0.55rem] leading-relaxed">
            {selected ? `${selected.name}'s log` : "Playdate log"}
          </h2>
          <p className="mt-1 text-xs text-[var(--ink)]/70">
            {selected
              ? "Who this pup has met in the yard."
              : "Every hello, sniff, and game between pups."}
          </p>
        </div>
        {selected && (
          <button
            type="button"
            className="pixel-button pixel-button-secondary px-2 py-1 text-[0.5rem]"
            onClick={onClearSelection}
          >
            All
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {entries.length === 0 ? (
          <p className="py-4 text-sm text-[var(--ink)]/75">
            {selected
              ? `${selected.name} hasn't met anyone yet. Give them a moment to wander over.`
              : "No playdates yet. Dogs say hello when they wander close."}
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="border-2 border-[var(--ink)] bg-white px-2 py-1.5 text-sm"
              >
                <p>
                  {selected
                    ? personalLine(entry, selected.id)
                    : interactionLine(entry)}
                </p>
                <p className="text-xs text-[var(--ink)]/55">
                  {formatTime(entry.at)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}

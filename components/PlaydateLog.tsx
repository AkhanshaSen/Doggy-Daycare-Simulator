"use client";

import { useState } from "react";
import {
  filterLog,
  getAllInteractions,
  getLogForDog,
  interactionLine,
  personalLine,
  type LogView,
} from "@/lib/interactions";
import type { Dog } from "@/lib/types";

type Props = {
  dogs: Dog[];
  selectedId: string | null;
  revision: number;
  onSelectDog: (id: string | null) => void;
};

const VIEWS: { id: LogView; label: string; short: string }[] = [
  { id: "all", label: "All", short: "All" },
  { id: "playdates", label: "Playdates", short: "Play" },
  { id: "owners", label: "Owner gossip", short: "Humans" },
  { id: "fixtures", label: "Fixtures", short: "Items" },
];

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
  onSelectDog,
}: Props) {
  const [view, setView] = useState<LogView>("all");
  const selected = dogs.find((d) => d.id === selectedId) ?? null;
  const entries = filterLog(
    selectedId ? getLogForDog(selectedId) : getAllInteractions(),
    view,
  ).slice(0, selectedId ? 40 : 24);

  return (
    <aside
      className="z-20 flex w-full min-h-[220px] max-h-[min(52dvh,520px)] flex-col border-t-3 border-[var(--ink)] bg-[#fffdf8] lg:max-h-none lg:w-72 lg:shrink-0 lg:border-t-0 lg:border-l-3 xl:w-80"
      aria-label="Playdate log"
    >
      <div className="shrink-0 border-b-2 border-[var(--ink)] px-2 py-1.5">
        <h2 className="font-pixel text-[0.5rem] leading-relaxed">
          {selected ? `${selected.name}'s log` : "Playdate log"}
        </h2>
      </div>
      <div className="shrink-0 border-b-2 border-[var(--ink)] px-2 py-1.5">
        <div className="flex items-center gap-2">
          <label
            htmlFor="log-dog-filter"
            className="font-pixel shrink-0 text-[0.4rem] text-[var(--ink)]"
          >
            Dog
          </label>
          <select
            id="log-dog-filter"
            className="pixel-input min-h-0 flex-1 py-0.5 text-xs leading-tight"
            value={selectedId ?? ""}
            aria-label="Log perspective"
            onChange={(event) => onSelectDog(event.target.value || null)}
          >
            <option value="">Everyone</option>
            {dogs.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.name}
              </option>
            ))}
          </select>
        </div>
        <div
          className="mt-1.5 grid grid-cols-4 gap-0.5"
          role="group"
          aria-label="Log filter"
        >
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`pixel-chip ${
                view === option.id ? "pixel-chip-active" : ""
              }`}
              aria-pressed={view === option.id}
              title={option.label}
              onClick={() => setView(option.id)}
            >
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{option.short}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
        {entries.length === 0 ? (
          <p className="py-3 text-xs text-[var(--ink)]/75">
            {selected
              ? `${selected.name} hasn't logged anything in this view yet.`
              : "No playdates yet. Dogs say hello when they wander close."}
          </p>
        ) : (
          <ol key={revision} className="flex flex-col gap-1.5">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="border-2 border-[var(--ink)] bg-white px-2 py-1 text-xs leading-snug"
              >
                <p>
                  {selected
                    ? personalLine(entry, selected.id)
                    : interactionLine(entry)}
                </p>
                <p className="text-[0.65rem] text-[var(--ink)]/55">
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

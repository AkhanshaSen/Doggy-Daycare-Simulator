"use client";

import { formatClock, phaseFor, phaseLabel, type ClockSpeed } from "@/lib/clock";
import { PARK_THEME_LIST, type ParkThemeId } from "@/lib/parkThemes";

type Props = {
  minutes: number;
  speed: ClockSpeed;
  themeId: ParkThemeId;
  onMinutes: (minutes: number) => void;
  onSpeed: (speed: ClockSpeed) => void;
  onTheme: (themeId: ParkThemeId) => void;
};

const SPEEDS: { id: ClockSpeed; label: string }[] = [
  { id: "pause", label: "Pause" },
  { id: "normal", label: "1x" },
  { id: "fast", label: "Fast" },
];

export function YardControls({
  minutes,
  speed,
  themeId,
  onMinutes,
  onSpeed,
  onTheme,
}: Props) {
  const phase = phaseFor(minutes);
  return (
    <section
      className="relative z-20 mx-4 mb-2 flex flex-wrap items-end gap-3 border-4 border-[var(--ink)] bg-[var(--card)] px-3 py-2"
      aria-label="Park clock and style"
    >
      <div className="min-w-40 flex-1">
        <p className="font-pixel text-[0.55rem] leading-relaxed">
          {formatClock(minutes)}
          <span className="ml-2 text-[0.45rem]">{phaseLabel(phase)}</span>
        </p>
        <input
          className="mt-1 w-full accent-[var(--ink)]"
          type="range"
          min={0}
          max={1439}
          step={1}
          value={Math.floor(((minutes % 1440) + 1440) % 1440)}
          aria-label="Time of day"
          onChange={(event) => onMinutes(Number(event.target.value))}
        />
      </div>
      <div className="flex gap-1" role="group" aria-label="Clock speed">
        {SPEEDS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`pixel-button px-2 py-1 text-[0.45rem] ${
              speed === option.id ? "" : "pixel-button-secondary"
            }`}
            aria-pressed={speed === option.id}
            onClick={() => onSpeed(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-xs">
        Park
        <select
          className="pixel-input"
          value={themeId}
          aria-label="Park style"
          onChange={(event) => onTheme(event.target.value as ParkThemeId)}
        >
          {PARK_THEME_LIST.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

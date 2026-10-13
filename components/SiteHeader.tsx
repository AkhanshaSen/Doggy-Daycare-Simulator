"use client";

import Link from "next/link";
import { MuteToggle } from "@/components/MuteToggle";
import { getAudio } from "@/lib/audio";

type Props = {
  title?: string;
  showNav?: boolean;
  variant?: "yard" | "sky";
  yardCount?: number;
};

export function SiteHeader({
  title = "Doggy Daycare",
  showNav = true,
  variant = "yard",
  yardCount,
}: Props) {
  const onNavClick = () => {
    getAudio().unlock();
    getAudio().play("click");
  };

  return (
    <header
      className={`relative z-20 flex flex-col gap-3 px-4 pt-4 pb-2 sm:flex-row sm:items-start sm:justify-between ${
        variant === "sky" ? "" : ""
      }`}
    >
      <div>
        <h1 className="font-pixel flex flex-wrap items-baseline gap-3 text-[0.75rem] leading-relaxed text-[var(--ink)] sm:text-[0.9rem]">
          <span>{title}</span>
          {typeof yardCount === "number" && (
            <span className="text-[0.5rem] text-[var(--ink)]/80">
              {yardCount} {yardCount === 1 ? "pup" : "pups"}
            </span>
          )}
        </h1>
        {showNav && (
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Main">
            <Link
              href="/add"
              className="pixel-button"
              onClick={onNavClick}
            >
              Add a dog
            </Link>
            <Link
              href="/record"
              className="pixel-button pixel-button-secondary"
              onClick={onNavClick}
            >
              Visitor Record
            </Link>
          </nav>
        )}
      </div>
      <div className="self-start">
        <MuteToggle />
      </div>
    </header>
  );
}

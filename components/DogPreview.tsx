"use client";

import { useEffect, useRef } from "react";
import { drawDog, SPRITE_SIZE } from "@/lib/sprites";
import type { AccessoryId, BreedId, Mood } from "@/lib/types";

type Props = {
  breedId: BreedId;
  colorId: string;
  accessoryId: AccessoryId;
  mood?: Mood;
  scale?: number;
  animate?: boolean;
  label?: string;
  className?: string;
};

export function DogPreview({
  breedId,
  colorId,
  accessoryId,
  mood = "happy",
  scale = 4,
  animate = true,
  label,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = SPRITE_SIZE * scale;
    canvas.width = size;
    canvas.height = size;

    let reduced = false;
    if (typeof window !== "undefined") {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    const paint = () => {
      ctx.clearRect(0, 0, size, size);
      drawDog(ctx, {
        breedId,
        colorId,
        accessoryId,
        mood,
        frame: reduced || !animate ? 0 : frameRef.current,
        scale,
      });
    };

    paint();

    if (!animate || reduced) return;

    let last = 0;
    const loop = (t: number) => {
      if (t - last > 220) {
        frameRef.current = (frameRef.current + 1) % 2;
        paint();
        last = t;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [breedId, colorId, accessoryId, mood, scale, animate]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label ?? `Preview of ${breedId} dog`}
        className="pixel-card bg-[#88C46B] p-2"
        style={{ width: SPRITE_SIZE * scale, height: SPRITE_SIZE * scale }}
      />
    </div>
  );
}

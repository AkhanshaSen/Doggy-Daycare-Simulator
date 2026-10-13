"use client";

import { useEffect, useState } from "react";
import { getAudio } from "@/lib/audio";
import { useDogStore } from "@/lib/store";

export function MuteToggle() {
  const muted = useDogStore((s) => s.muted);
  const setMuted = useDogStore((s) => s.setMuted);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = getAudio();
    setMuted(audio.isMuted());
    setReady(true);
  }, [setMuted]);

  if (!ready) {
    return (
      <button
        type="button"
        className="pixel-button pixel-button-secondary"
        aria-label="Sound loading"
        disabled
      >
        …
      </button>
    );
  }

  return (
    <button
      type="button"
      className="pixel-button pixel-button-secondary"
      aria-pressed={!muted}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      onClick={() => {
        const audio = getAudio();
        audio.unlock();
        const next = !audio.isMuted();
        audio.setMuted(next);
        setMuted(next);
        if (!next) audio.play("click");
      }}
    >
      {muted ? "Sound off" : "Sound on"}
    </button>
  );
}

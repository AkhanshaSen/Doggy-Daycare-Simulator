"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DogPreview } from "@/components/DogPreview";
import { MuteToggle } from "@/components/MuteToggle";
import { OptionPicker } from "@/components/OptionPicker";
import { getAudio } from "@/lib/audio";
import { getDogRepository } from "@/lib/localDogRepository";
import { rememberDropoff } from "@/lib/player";
import { assertCleanText } from "@/lib/profanity";
import { canAddDog, remainingDogsToday } from "@/lib/rateLimit";
import { useDogStore } from "@/lib/store";
import {
  ACCESSORIES,
  BREEDS,
  COLORS_BY_BREED,
  DAILY_DOG_LIMIT,
  FIELD_LIMITS,
} from "@/lib/types";

export default function AddDogPage() {
  const router = useRouter();
  const draft = useDogStore((s) => s.draft);
  const setDraft = useDogStore((s) => s.setDraft);
  const draftToInput = useDogStore((s) => s.draftToInput);
  const setLastAddedId = useDogStore((s) => s.setLastAddedId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(DAILY_DOG_LIMIT);

  const colors = COLORS_BY_BREED[draft.breedId];

  useEffect(() => {
    setRemaining(remainingDogsToday());
  }, [draft.step, submitting]);

  const playClick = () => {
    getAudio().unlock();
    getAudio().play("click");
  };

  const validateStep2 = (): boolean => {
    const next: Record<string, string> = {};
    if (!draft.ownerName.trim()) next.ownerName = "Owner name is required.";
    if (!draft.name.trim()) next.name = "Dog's name is required.";
    const age = Number(draft.age);
    if (draft.age === "" || !Number.isFinite(age)) {
      next.age = "Enter an age.";
    } else if (age < 0 || age > 30) {
      next.age = "Age must be between 0 and 30.";
    }
    if (!draft.favoriteThing.trim()) {
      next.favoriteThing = "Favourite thing is required.";
    }

    const profanity = assertCleanText({
      ownerName: draft.ownerName,
      name: draft.name,
      favoriteThing: draft.favoriteThing,
      introLine: draft.introLine,
    });
    if (profanity) {
      setFormError(profanity);
    } else {
      setFormError(null);
    }

    setErrors(next);
    return Object.keys(next).length === 0 && !profanity;
  };

  const onSubmit = async () => {
    if (!validateStep2()) return;
    if (!canAddDog()) {
      setFormError(
        "You've already dropped off 3 dogs today. Come back tomorrow!",
      );
      return;
    }
    const input = draftToInput();
    if (!input) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const dog = await getDogRepository().addDog(input);
      rememberDropoff(dog.ownerName, dog.id);
      setLastAddedId(dog.id);
      getAudio().unlock();
      getAudio().play("success");
      router.push("/add/done");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not add dog.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[var(--sky-blue)] px-4 py-4 pb-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href="/"
              className="text-sm text-[var(--accent-orange)] underline"
              onClick={playClick}
            >
              ← Back to Daycare
            </Link>
            <h1 className="font-pixel mt-2 text-[0.7rem] leading-relaxed">
              Add a dog
            </h1>
          </div>
          <MuteToggle />
        </div>

        <div className="font-pixel flex gap-2 text-[0.5rem]" aria-label="Progress">
          <span
            className={`border-2 border-[var(--ink)] px-2 py-1 ${
              draft.step === 1 ? "bg-[var(--accent-orange)] text-white" : "bg-white"
            }`}
          >
            1. Build
          </span>
          <span
            className={`border-2 border-[var(--ink)] px-2 py-1 ${
              draft.step === 2 ? "bg-[var(--accent-orange)] text-white" : "bg-white"
            }`}
          >
            2. Details
          </span>
        </div>

        <p className="text-sm text-[var(--ink)]/70">
          {remaining} of 3 drop-offs left today
        </p>

        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <DogPreview
            breedId={draft.breedId}
            colorId={draft.colorId}
            accessoryId={draft.accessoryId}
            scale={4}
            label="Live preview of your dog"
          />

          <div className="pixel-card p-4">
            {draft.step === 1 && (
              <>
                <OptionPicker
                  legend="Breed"
                  name="breed"
                  options={BREEDS}
                  value={draft.breedId}
                  onChange={(id) => {
                    playClick();
                    setDraft({ breedId: id as typeof draft.breedId });
                  }}
                />
                <OptionPicker
                  legend="Coat colour"
                  name="color"
                  options={colors}
                  value={draft.colorId}
                  onChange={(id) => {
                    playClick();
                    setDraft({ colorId: id });
                  }}
                />
                <OptionPicker
                  legend="Accessory"
                  name="accessory"
                  options={ACCESSORIES}
                  value={draft.accessoryId}
                  onChange={(id) => {
                    playClick();
                    setDraft({ accessoryId: id as typeof draft.accessoryId });
                  }}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="pixel-button"
                    onClick={() => {
                      playClick();
                      setDraft({ step: 2 });
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {draft.step === 2 && (
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void onSubmit();
                }}
              >
                <Field
                  label="Owner name"
                  value={draft.ownerName}
                  max={FIELD_LIMITS.ownerName}
                  error={errors.ownerName}
                  required
                  onChange={(v) => setDraft({ ownerName: v })}
                />
                <Field
                  label="Dog's name"
                  value={draft.name}
                  max={FIELD_LIMITS.name}
                  error={errors.name}
                  required
                  onChange={(v) => setDraft({ name: v })}
                />
                <div>
                  <label className="mb-1 block text-sm font-semibold" htmlFor="age">
                    Age <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="age"
                    className="pixel-input"
                    type="number"
                    min={0}
                    max={30}
                    inputMode="numeric"
                    value={draft.age}
                    required
                    onChange={(e) => setDraft({ age: e.target.value })}
                  />
                  {errors.age && (
                    <p className="field-error" role="alert">
                      {errors.age}
                    </p>
                  )}
                </div>
                <Field
                  label="Favourite thing"
                  value={draft.favoriteThing}
                  max={FIELD_LIMITS.favoriteThing}
                  error={errors.favoriteThing}
                  required
                  onChange={(v) => setDraft({ favoriteThing: v })}
                />
                <Field
                  label="Intro line"
                  value={draft.introLine}
                  max={FIELD_LIMITS.introLine}
                  onChange={(v) => setDraft({ introLine: v })}
                />

                <p className="text-sm text-[var(--ink)]/80">
                  Please review carefully — you can&apos;t edit or delete a dog
                  after adding them.
                </p>
                <p className="text-xs text-[var(--ink)]/60">
                  Tip: use a first name only; don&apos;t enter full personal details.
                </p>

                {formError && (
                  <p className="field-error" role="alert">
                    {formError}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap justify-between gap-2">
                  <button
                    type="button"
                    className="pixel-button pixel-button-secondary"
                    onClick={() => {
                      playClick();
                      setDraft({ step: 1 });
                      setErrors({});
                      setFormError(null);
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="pixel-button"
                    disabled={submitting}
                  >
                    {submitting ? "Adding…" : "Add to Daycare"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  max,
  error,
  required,
  onChange,
}: {
  label: string;
  value: string;
  max: number;
  error?: string;
  required?: boolean;
  onChange: (v: string) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label className="text-sm font-semibold" htmlFor={id}>
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
        <span className="text-xs text-[var(--ink)]/60" aria-live="polite">
          {value.length}/{max}
        </span>
      </div>
      <input
        id={id}
        className="pixel-input"
        type="text"
        value={value}
        maxLength={max}
        required={required}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
      />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

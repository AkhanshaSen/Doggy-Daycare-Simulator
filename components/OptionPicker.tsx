"use client";

type Option = { id: string; label: string };

type Props = {
  legend: string;
  name: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
};

export function OptionPicker({
  legend,
  name,
  options,
  value,
  onChange,
}: Props) {
  return (
    <fieldset className="mb-4">
      <legend className="font-pixel mb-2 text-[0.55rem] text-[var(--ink)]">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {options.map((opt) => {
          const selected = opt.id === value;
          return (
            <label
              key={opt.id}
              className={`cursor-pointer border-3 border-[var(--ink)] px-3 py-2 text-sm ${
                selected
                  ? "bg-[var(--accent-orange)] text-white shadow-[2px_2px_0_var(--ink)]"
                  : "bg-white hover:bg-[#f5f0e6]"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={opt.id}
                checked={selected}
                onChange={() => onChange(opt.id)}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

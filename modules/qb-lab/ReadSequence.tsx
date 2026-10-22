"use client";
import { readSteps, type ReadFocus } from "./review-model";
export function ReadSequence({
  value,
  onChange,
}: {
  value: ReadFocus;
  onChange: (value: ReadFocus) => void;
}) {
  const step = readSteps.find((s) => s.id === value)!;
  return (
    <section className="lab-read-sequence" aria-label="Observation sequence">
      <p className="lab-kicker">EYES THROUGH THE PICTURE / OBSERVATION ORDER</p>
      <div className="lab-read-buttons">
        {readSteps.map((s, i) => (
          <button
            className="lab-read-step"
            aria-pressed={value === s.id}
            key={s.id}
            onClick={() => onChange(s.id)}
          >
            <span>0{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>
      <p className="lab-read-description">{step.note}</p>
    </section>
  );
}

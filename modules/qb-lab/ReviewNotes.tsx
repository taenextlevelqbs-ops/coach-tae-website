"use client";
import { useRef, useState } from "react";
import { filmComments } from "./demo";
import { updateLab, useLocalLab } from "./platform/store";
import { reviewTags, type FilmMoment, type ReviewTag } from "./review-model";
export function ReviewNotes({
  time,
  moments,
  onMomentsChange,
  onSeek,
}: {
  time: number;
  moments: FilmMoment[];
  onMomentsChange: (moments: FilmMoment[]) => void;
  onSeek: (time: number) => void;
}) {
  const { state } = useLocalLab();
  const [tag, setTag] = useState<ReviewTag>("Alignment");
  const [notice, setNotice] = useState("");
  const nextId = useRef(Math.max(0, ...moments.map((moment) => moment.id)) + 1);
  return (
    <aside className="lab-feedback-panel">
      <p className="lab-kicker">COACHING MARGIN / SAMPLE NOTES</p>
      <h2>The second look.</h2>
      <p className="lab-muted">
        Fictional feedback, not submitted by Coach Tae.
      </p>
      <div className="lab-timestamp-list">
        {filmComments.map((c, i) => (
          <button
            key={c.time}
            aria-label={`Jump to ${c.time} seconds: ${c.title}`}
            aria-pressed={
              time >= c.time && time < (filmComments[i + 1]?.time ?? 11)
            }
            onClick={() => onSeek(c.time)}
          >
            <span>00:0{c.time}</span>
            <div>
              <strong>{c.title}</strong>
              <p>{c.text}</p>
            </div>
          </button>
        ))}
      </div>
      <button
        className="lab-button"
        onClick={() => {
          if (
            !state.assignments.some(
              (a) =>
                a.profile === "A" &&
                a.drill === "observe" &&
                a.status === "assigned",
            )
          ) {
            updateLab((s) => ({
              ...s,
              assignments: [
                ...s.assignments,
                {
                  id: crypto.randomUUID(),
                  profile: "A" as const,
                  drill: "observe",
                  status: "assigned" as const,
                },
              ].slice(-40),
            }));
          }
          setNotice(
            "Observation correction assigned locally to demo A. No coach or athlete was notified.",
          );
        }}
      >
        Assign observation correction locally
      </button>
      <div className="lab-tag-form">
        <p className="lab-kicker">MARK A MOMENT / LOCAL ONLY</p>
        <label>
          Observation tag
          <select
            aria-label="Observation tag"
            value={tag}
            onChange={(e) => setTag(e.target.value as ReviewTag)}
          >
            {reviewTags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <button
          className="lab-button"
          disabled={moments.length >= 8}
          onClick={() => {
            if (moments.some((m) => m.time === time && m.tag === tag)) {
              setNotice("This moment already has that tag.");
              return;
            }
            onMomentsChange([...moments, { id: nextId.current++, time, tag }]);
            setNotice(
              `Tagged ${time.toFixed(1)} seconds: ${tag}. Saved in this tab only.`,
            );
          }}
        >
          Tag current moment
        </button>
        <p className="lab-fine" role="status" aria-label="Moment tag status">
          {notice}
        </p>
        {moments.length >= 8 && (
          <p className="lab-fine">
            Eight-moment demo limit reached. Remove a tag to add another.
          </p>
        )}
        <ul className="lab-moment-list">
          {moments.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => onSeek(m.time)}
                aria-label={`Revisit tagged ${m.time.toFixed(1)} seconds: ${m.tag}`}
              >
                {m.time.toFixed(1)}s · {m.tag}
              </button>
              <button
                aria-label={`Remove ${m.tag} at ${m.time.toFixed(1)} seconds`}
                onClick={() => {
                  onMomentsChange(moments.filter((item) => item.id !== m.id));
                  setNotice("Tag removed from this tab.");
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

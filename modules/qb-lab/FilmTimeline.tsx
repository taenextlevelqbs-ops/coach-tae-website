"use client";
import { filmComments } from "./demo";
import type { FilmMoment } from "./review-model";
export function FilmTimeline({
  time,
  onSeek,
  moments,
}: {
  time: number;
  onSeek: (time: number) => void;
  moments: FilmMoment[];
}) {
  return (
    <div className="lab-timeline">
      <div className="lab-timeline-scale" aria-hidden="true">
        {[0, 2, 4, 6, 8, 10].map((t) => (
          <span key={t}>00:{String(t).padStart(2, "0")}</span>
        ))}
      </div>
      <label className="lab-slider-label">
        Review timeline <span>{time.toFixed(1)} seconds</span>
        <input
          type="range"
          aria-label="Review timeline"
          min="0"
          max="10"
          step="0.1"
          value={time}
          onChange={(e) => onSeek(Number(e.target.value))}
        />
      </label>
      <div className="lab-timeline-chapters" aria-label="Timeline chapters">
        {filmComments.map((c, i) => (
          <button
            key={c.time}
            onClick={() => onSeek(c.time)}
            aria-label={`Seek chapter ${i + 1} at ${c.time} seconds`}
          >
            <span>0{i + 1}</span>
            {["Alignment", "Rotation", "Reflect"][i]}
          </button>
        ))}
      </div>
      {moments.length > 0 && (
        <div
          className="lab-bookmark-track"
          aria-label="Tagged timeline moments"
        >
          {moments.map((m) => (
            <button key={m.id} onClick={() => onSeek(m.time)}>
              {m.time.toFixed(1)}s / {m.tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

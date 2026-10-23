"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
export type ReviewStroke = { time: number; points: { x: number; y: number }[] };
export type CanvasNote = { time: number; text: string };
/** Normalized, bounded overlay. Parent must remount on film-ID changes. No network or localStorage. */
export function ReviewCanvas({
  children,
  time,
  onPause,
  onSeek,
}: {
  children: ReactNode;
  time: number;
  onPause: () => void;
  onSeek: (time: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [strokes, setStrokes] = useState<ReviewStroke[]>([]);
  const [notes, setNotes] = useState<CanvasNote[]>([]);
  const [draft, setDraft] = useState("");
  const active = useRef<ReviewStroke | null>(null);
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 });
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, 1000, 1000);
    context.strokeStyle = "#eab308";
    context.lineWidth = 4;
    context.lineCap = "round";
    for (const stroke of strokes.filter(
      (item) => Math.abs(item.time - time) < 0.15,
    )) {
      context.beginPath();
      stroke.points.forEach((point, i) => {
        if (i) context.lineTo(point.x * 1000, point.y * 1000);
        else context.moveTo(point.x * 1000, point.y * 1000);
      });
      if (stroke.points.length === 1) {
        const point = stroke.points[0];
        context.moveTo(point.x * 1000 - 8, point.y * 1000);
        context.lineTo(point.x * 1000 + 8, point.y * 1000);
      }
      context.stroke();
    }
  }, [strokes, time]);
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  }
  return (
    <section
      className="lab-review-canvas"
      aria-label="Timestamped drawing and notes"
    >
      <div style={{ position: "relative" }}>
        {children}
        <canvas
          ref={canvas}
          width={1000}
          height={1000}
          aria-label="Drawing overlay. Keyboard alternative below."
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: drawing ? "auto" : "none",
            touchAction: drawing ? "none" : "auto",
          }}
          onPointerDown={(event) => {
            if (!drawing || strokes.length >= 20) return;
            onPause();
            event.currentTarget.setPointerCapture(event.pointerId);
            active.current = { time, points: [point(event)] };
            setStrokes((items) => [...items, active.current!]);
          }}
          onPointerMove={(event) => {
            if (!active.current) return;
            const current = active.current;
            if (current.points.length >= 200) return;
            current.points = [...current.points, point(event)];
            setStrokes((items) => [...items.slice(0, -1), { ...current }]);
          }}
          onPointerUp={() => {
            active.current = null;
          }}
          onPointerCancel={() => {
            active.current = null;
          }}
        />
      </div>
      <div className="lab-actions">
        <button
          className="lab-button"
          aria-pressed={drawing}
          onClick={() => {
            onPause();
            active.current = null;
            setDrawing(!drawing);
          }}
        >
          {" "}
          {drawing ? "Finish drawing" : "Pause and draw"}
        </button>
        <button
          className="lab-button"
          disabled={!strokes.length}
          onClick={() => setStrokes((items) => items.slice(0, -1))}
        >
          Undo drawing
        </button>
        <button
          className="lab-button"
          onClick={() => {
            onPause();
            setStrokes([]);
            setNotes([]);
            setDraft("");
          }}
        >
          Clear review notes and drawings
        </button>
      </div>
      <button
        className="lab-button"
        disabled={strokes.length >= 20}
        aria-label="Place review marker. Arrow keys move, Enter places."
        onKeyDown={(event) => {
          const move: Record<string, [number, number]> = {
            ArrowLeft: [-0.02, 0],
            ArrowRight: [0.02, 0],
            ArrowUp: [0, -0.02],
            ArrowDown: [0, 0.02],
          };
          if (move[event.key]) {
            event.preventDefault();
            const [x, y] = move[event.key];
            setCursor((value) => ({
              x: Math.max(0, Math.min(1, value.x + x)),
              y: Math.max(0, Math.min(1, value.y + y)),
            }));
          }
        }}
        onClick={() => {
          onPause();
          setStrokes((items) =>
            [...items, { time, points: [cursor] }].slice(-20),
          );
        }}
      >
        Place marker · {Math.round(cursor.x * 100)}%,{" "}
        {Math.round(cursor.y * 100)}%
      </button>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = draft.trim();
          if (!value || notes.length >= 20) return;
          onPause();
          setNotes((items) => [...items, { time, text: value }]);
          setDraft("");
        }}
      >
        <label>
          Timestamped coaching note
          <textarea
            maxLength={1000}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <button
          className="lab-button"
          disabled={!draft.trim() || notes.length >= 20}
        >
          Add note at {time.toFixed(1)}s
        </button>
      </form>
      <p className="lab-fine">
        Use synthetic coaching notes only; no real athlete names or personal
        information. Session-only review; not sent to a coach or saved to an
        account. Up to 20 notes and drawings. Drawings appear at their tagged
        moment.
      </p>
      <ul aria-label="Canvas review notes">
        {notes.map((note, i) => (
          <li key={i}>
            <button className="lab-button" onClick={() => onSeek(note.time)}>
              {note.time.toFixed(1)}s · {note.text}
            </button>
          </li>
        ))}
      </ul>
      <p aria-live="polite">
        {strokes.length} drawings · {notes.length} notes
      </p>
    </section>
  );
}

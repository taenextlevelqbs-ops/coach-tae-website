"use client";
import { useState, type RefObject } from "react";
export function ReviewSubmission({
  dialog,
  onQueue,
}: {
  dialog: RefObject<HTMLDialogElement | null>;
  onQueue: (review: { clip: string; focus: string }) => void;
}) {
  const [clip, setClip] = useState("Alignment study");
  const [focus, setFocus] = useState("Describe the alignment");
  return (
    <dialog
      ref={dialog}
      className="lab-dialog"
      aria-labelledby="submission-title"
    >
      <div className="lab-card-top">
        <p className="lab-kicker">LOCAL WORKFLOW / NO UPLOAD</p>
        <button
          className="lab-close"
          aria-label="Close submission preview"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
      </div>
      <h2 id="submission-title">Prepare a demo review.</h2>
      <p>
        No files accepted. Choose a fixed illustrated study to explore the
        review workflow.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onQueue({ clip, focus });
          dialog.current?.close();
        }}
      >
        <label>
          Demo clip
          <select
            aria-label="Demo clip"
            value={clip}
            onChange={(e) => setClip(e.target.value)}
          >
            <option>Alignment study</option>
            <option>Rotation study</option>
          </select>
        </label>
        <label>
          Review focus
          <select
            aria-label="Review focus"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          >
            <option>Describe the alignment</option>
            <option>Observe defender movement</option>
          </select>
        </label>
        <label className="lab-inline-check">
          <input type="checkbox" required /> I understand this is a local
          demonstration.
        </label>
        <button className="lab-button primary full" type="submit">
          Queue synthetic review →
        </button>
      </form>
    </dialog>
  );
}

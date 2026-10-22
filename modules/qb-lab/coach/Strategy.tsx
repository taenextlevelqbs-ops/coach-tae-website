"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocalLab } from "../platform/store";
import {
  parseScript,
  distances,
  concepts,
  situations,
  formatNames,
  type ScriptTag,
} from "./model";
export function Strategy({
  scripts,
  onScripts,
}: {
  scripts: ScriptTag[];
  onScripts: (next: ScriptTag[]) => void;
}) {
  const { state } = useLocalLab();
  const [source, setSource] = useState(
    "Spacing study | tackle | 1 | Medium | Spacing | Open field\nRed-zone study | flag5 | 3 | Short | Custom | Red zone",
  );
  const [notice, setNotice] = useState("");
  const [down, setDown] = useState("");
  const [distance, setDistance] = useState("");
  const [concept, setConcept] = useState("");
  const [situation, setSituation] = useState("");
  const shown = scripts.filter(
    (s) =>
      (!down || s.down === Number(down)) &&
      (!distance || s.distance === distance) &&
      (!concept || s.concept === concept) &&
      (!situation || s.situation === situation),
  );
  return (
    <div className="coach-strategy-layout">
      <aside className="coach-card">
        <p className="coach-eyebrow">STRUCTURED, NOT GUESSWORK</p>
        <h2>Parse a situational script</h2>
        <p>
          One play per line. Tactical labels only; do not enter athlete
          information. Import is atomic and replaces this session’s tags.
        </p>
        <label>
          Play script
          <textarea
            aria-label="Play script"
            rows={8}
            maxLength={16000}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
        <code>Name | format | down | distance | concept | situation</code>
        <p className="coach-small">
          Formats: tackle, flag5/7/8. Passing-event 7v7 play imports need a
          separate reviewed adapter and are not silently treated as flag7.
        </p>
        <button
          className="coach-primary"
          onClick={() => {
            try {
              onScripts(parseScript(source));
              setNotice(
                "Script parsed. Link each entry to an actual saved play before opening the simulator.",
              );
            } catch (e) {
              setNotice(e instanceof Error ? e.message : "Script rejected.");
            }
          }}
        >
          Parse script
        </button>
        <p role="status" aria-label="Script parser result">
          {notice}
        </p>
        <Link href="/qb-lab/playbook">Draw and save a play →</Link>
      </aside>
      <section>
        <div className="coach-section-title">
          <div>
            <p className="coach-eyebrow">THE RIGHT PLAY, THE RIGHT MOMENT</p>
            <h2>Situational play library</h2>
          </div>
          <span className="coach-pill">{shown.length} matching entries</span>
        </div>
        <div className="coach-card coach-filter-grid">
          {[
            ["Down", down, setDown, ["1", "2", "3", "4"]],
            ["Distance", distance, setDistance, distances],
            ["Concept", concept, setConcept, concepts],
            ["Situation", situation, setSituation, situations],
          ].map(([name, value, update, options]) => (
            <label key={name as string}>
              {name as string}
              <select
                aria-label={`Filter ${name}`}
                value={value as string}
                onChange={(e) =>
                  (update as (v: string) => void)(e.target.value)
                }
              >
                <option value="">All</option>
                {(options as readonly string[]).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {shown.length === 0 ? (
          <div className="coach-card coach-empty">
            <h3>No matching script entries.</h3>
            <p>
              Parse a script or broaden the filters. No plays are invented from
              the tags.
            </p>
          </div>
        ) : (
          <div className="coach-script-list">
            {shown.map((s) => {
              const play = state.plays.find(
                (p) => p.id === s.playId && p.format === s.format,
              );
              return (
                <article className="coach-card coach-script" key={s.id}>
                  <div>
                    <span className="coach-eyebrow">
                      {formatNames[s.format]}
                    </span>
                    <h3>{s.name}</h3>
                    <div className="coach-tags">
                      {[
                        `${s.down}${s.down === 1 ? "st" : s.down === 2 ? "nd" : s.down === 3 ? "rd" : "th"} down`,
                        s.distance,
                        s.concept,
                        s.situation,
                      ].map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <label>
                    Saved formation for {s.name}
                    <select
                      aria-label={`Saved play for ${s.name}`}
                      value={play?.id ?? ""}
                      onChange={(e) =>
                        onScripts(
                          scripts.map((item) =>
                            item.id === s.id
                              ? { ...item, playId: e.target.value || undefined }
                              : item,
                          ),
                        )
                      }
                    >
                      <option value="">Choose a matching saved play</option>
                      {state.plays
                        .filter((p) => p.format === s.format)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  {play ? (
                    <Link
                      className="coach-link-button"
                      href={`/qb-lab/simulator/engine?play=${encodeURIComponent(play.id)}`}
                    >
                      Run {s.name} in simulator →
                    </Link>
                  ) : (
                    <p className="coach-small">
                      Create or select a saved play to run its actual formation
                      and routes.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
        <p className="coach-small">
          Concept names are organizational tags. Parsing does not create Mesh,
          Stick or another concept’s routes, infer a correct progression or
          certify football content. Coaches author and review the attached play.
        </p>
      </section>
    </div>
  );
}

"use client";
import { useState } from "react";
import {
  demoRoster,
  formatNames,
  positions,
  placePlayer,
  type TeamFormat,
  type AthleteId,
  type DepthChart,
  type FocusWeights,
} from "./model";
export function Roster({
  charts,
  onChart,
  emphasis,
  onEmphasis,
}: {
  charts: Partial<Record<TeamFormat, DepthChart>>;
  onChart: (format: TeamFormat, chart: DepthChart) => void;
  emphasis: Record<AthleteId, FocusWeights>;
  onEmphasis: (id: AthleteId, key: keyof FocusWeights, n: number) => void;
}) {
  const [format, setFormat] = useState<TeamFormat>("tackle");
  const [selected, setSelected] = useState<AthleteId>("A");
  const [notice, setNotice] = useState("");
  const chart = charts[format] ?? {};
  const allowed = demoRoster.filter(
    (a) =>
      format === "passing7" ||
      (format === "tackle" ? a.pathway === "tackle" : a.pathway === "flag"),
  );
  function move(slot: string, id: AthleteId | "") {
    try {
      onChart(format, placePlayer(chart, format, slot, id));
      setNotice(
        id
          ? `${demoRoster.find((a) => a.id === id)?.name} moved to ${slot.replace(":", " · depth ")}.`
          : "Position cleared.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to move player.");
    }
  }
  return (
    <div className="coach-roster-layout">
      <section>
        <div className="coach-section-title">
          <div>
            <p className="coach-eyebrow">DEVELOP THE PERSON</p>
            <h2>Roster &amp; coaching focus</h2>
          </div>
          <span className="coach-pill">2 synthetic athletes</span>
        </div>
        <div className="coach-player-list">
          {demoRoster.map((a) => (
            <article
              className={`coach-player ${selected === a.id ? "is-selected" : ""}`}
              key={a.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("application/x-qblab-demo", a.id)
              }
            >
              <span className="coach-avatar">{a.initials}</span>
              <div>
                <h3>{a.name}</h3>
                <p>
                  Demo {a.id} · age {a.age} · {a.pathway}
                </p>
                <button
                  aria-pressed={selected === a.id}
                  onClick={() => setSelected(a.id)}
                >
                  Select {a.name}
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="coach-card">
          <h3>Plan the next conversation</h3>
          {(
            [
              ["footwork", "Footwork"],
              ["recognition", "Recognition"],
              ["mechanics", "Mechanics"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label} emphasis for{" "}
              {demoRoster.find((a) => a.id === selected)?.name} ·{" "}
              {emphasis[selected][key]} / 5
              <input
                type="range"
                aria-label={`${label} emphasis for ${demoRoster.find((a) => a.id === selected)?.name}`}
                min="1"
                max="5"
                step="1"
                value={emphasis[selected][key]}
                onChange={(e) =>
                  onEmphasis(selected, key, Number(e.target.value))
                }
              />
            </label>
          ))}
          <p>
            Coach-set practice preferences, not measured player attributes or
            performance ratings.
          </p>
          <p>
            Drag a player to a position, or use its selection menu. Planning
            edits stay in this workspace session.
          </p>
        </div>
      </section>
      <section className="coach-card">
        <div className="coach-section-title">
          <h2>Build your depth</h2>
          <label>
            Depth chart format
            <select
              aria-label="Depth chart format"
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as TeamFormat);
                setNotice("");
              }}
            >
              {Object.entries(formatNames).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p>
          Offensive planning positions · two depths per position. Passing 7v7
          and flag are separate formats. Positions do not establish league
          eligibility or a legal formation.
        </p>
        <div className="coach-depth-grid">
          {positions[format].map((p) => (
            <article
              className="coach-position"
              key={p}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("application/x-qblab-demo");
                if (id === "A" || id === "B") move(`${p}:1`, id);
                else
                  setNotice("Drop a synthetic player card from this roster.");
              }}
            >
              <h3>{p}</h3>
              {[1, 2].map((depth) => (
                <label key={depth}>
                  {depth === 1 ? "First" : "Second"} option
                  <select
                    aria-label={`${p} depth ${depth}`}
                    value={chart[`${p}:${depth}`] ?? ""}
                    onChange={(e) =>
                      move(`${p}:${depth}`, e.target.value as AthleteId | "")
                    }
                  >
                    <option value="">Vacant</option>
                    {allowed.map((a) => (
                      <option value={a.id} key={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </article>
          ))}
        </div>
        <p role="status" aria-label="Depth chart update">
          {notice}
        </p>
      </section>
    </div>
  );
}

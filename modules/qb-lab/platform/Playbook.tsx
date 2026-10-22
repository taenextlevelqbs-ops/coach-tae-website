"use client";
import { useState } from "react";
import Link from "next/link";
import {
  formation,
  type Format,
  type Play,
  type Point,
} from "../simulation/model";
import { validateFormation } from "../football/content";
import { SimField } from "../simulation/SimField";
import {
  empty,
  localPlayRepository,
  parseState,
  useLocalLab,
  updateLab,
  validPlay,
} from "./store";
export function Playbook() {
  const { state } = useLocalLab();
  const [play, setPlay] = useState<Play>(formation("tackle"));
  const [past, setPast] = useState<Play[]>([]);
  const [future, setFuture] = useState<Play[]>([]);
  const [selected, setSelected] = useState("R5");
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState("");
  const player = play.players.find((p) => p.id === selected) ?? play.players[0];
  function edit(next: Play) {
    setPast((p) => [...p, play].slice(-40));
    setFuture([]);
    setPlay(next);
    setMessage("Unsaved changes. Save to retain this play after reload.");
  }
  function move(id: string, point: Point) {
    edit({
      ...play,
      players: play.players.map((p) =>
        p.id === id ? { ...p, start: point } : p,
      ),
    });
  }
  function route(points: Point[]) {
    if (player.id === "QB" || player.eligible === false) {
      setMessage(
        "This player is not a receiving target. Select an eligible receiver; QB movement is controlled in the simulator.",
      );
      return;
    }
    edit({
      ...play,
      players: play.players.map((p) =>
        p.id === player.id ? { ...p, route: points } : p,
      ),
    });
  }
  async function save() {
    const saved = {
      ...play,
      id: play.id.startsWith("play-") ? crypto.randomUUID() : play.id,
    };
    try {
      await localPlayRepository.save(saved);
      setPlay(saved);
      setMessage(
        "Play saved to this browser. Available in the matching simulator roster.",
      );
    } catch (error) {
      setMessage(
        `Durable save failed: ${error instanceof Error ? error.message : "Unknown storage error"}. An in-memory copy may exist; export before leaving.`,
      );
    }
  }
  function importFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 250000) {
      setMessage("Import rejected: 250 KB maximum.");
      return;
    }
    file
      .text()
      .then((raw) => {
        const data = JSON.parse(raw);
        const imported = validPlay(data)
          ? parseState(JSON.stringify({ ...empty, plays: [data] })).plays[0]
          : null;
        if (!imported) throw Error();
        edit(imported);
        setSelected(imported.players[0].id);
        setMessage(
          "Play imported for inspection. Save to add it to this browser.",
        );
      })
      .catch(() =>
        setMessage(
          "Import rejected: invalid JSON, format, roster or coordinate bounds.",
        ),
      );
  }
  function exportPlay() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(play, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "qb-lab-play.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Play JSON exported. No athlete records are included.");
  }
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">PLAYBOOK STUDIO / LOCAL AUTHORING</p>
          <h1>Build the picture.</h1>
          <p className="lab-lede">
            Move players, edit route points and run your own concept. A saved
            drawing is not a validated play or coaching recommendation.
          </p>
        </div>
        <Link className="lab-button primary" href="/qb-lab/simulator">
          Run a saved play →
        </Link>
      </div>
      <div className="lab-app-toolbar">
        <label>
          Play name · no athlete names
          <input
            aria-label="Play name"
            maxLength={50}
            value={play.name}
            onChange={(e) => edit({ ...play, name: e.target.value })}
          />
        </label>
        <label>
          Roster format
          <select
            aria-label="Play format"
            value={play.format}
            onChange={(e) => {
              edit(formation(e.target.value as Format));
              setSelected("QB");
            }}
          >
            <option value="tackle">Tackle · 11v11</option>
            <option value="flag5">Flag · 5v5</option>
            <option value="flag7">Flag · 7v7</option>
            <option value="flag8">Flag · 8v8</option>
          </select>
        </label>
        <button
          className="lab-button"
          onClick={() => {
            edit({
              ...formation(play.format, false),
              id: play.id,
              name: play.name,
            });
            setSelected("QB");
          }}
        >
          Compact formation
        </button>
        <button
          className="lab-button"
          onClick={() => {
            edit({
              ...formation(play.format, true),
              id: play.id,
              name: play.name,
            });
            setSelected("QB");
          }}
        >
          Spread formation
        </button>
      </div>
      <p className="lab-fine">
        X/H/Y/Z are system-configurable labels. Roles and routes are separate.{" "}
        {validateFormation(play).join(" ")} Structural checks do not certify
        numbering, motion or league eligibility.
      </p>
      {play.format === "tackle" && (
        <label>
          Offensive personnel
          <select
            aria-label="Offensive personnel"
            value={play.personnel ?? "11"}
            onChange={(e) =>
              edit({
                ...formation(
                  "tackle",
                  true,
                  e.target.value as "10" | "11" | "12",
                ),
                id: play.id,
                name: play.name,
              })
            }
          >
            <option value="10">10 · 1 RB / 0 TE</option>
            <option value="11">11 · 1 RB / 1 TE</option>
            <option value="12">12 · 1 RB / 2 TE</option>
          </select>
        </label>
      )}
      <div className="lab-simulator-grid">
        <section className="lab-simulator-stage">
          <SimField
            players={play.players}
            selected={player.id}
            onSelect={setSelected}
            onMove={move}
            onDraw={
              drawing
                ? (p) => {
                    if (player.route.length < 8) route([...player.route, p]);
                    else
                      setMessage(
                        "Eight-point route limit reached. Remove a point to continue.",
                      );
                  }
                : undefined
            }
          />
          <div className="lab-app-toolbar">
            <button
              className="lab-button"
              disabled={!past.length}
              onClick={() => {
                setFuture((f) => [play, ...f]);
                setPlay(past[past.length - 1]);
                setPast((p) => p.slice(0, -1));
              }}
            >
              Undo
            </button>
            <button
              className="lab-button"
              disabled={!future.length}
              onClick={() => {
                setPast((p) => [...p, play]);
                setPlay(future[0]);
                setFuture((f) => f.slice(1));
              }}
            >
              Redo
            </button>
            <button
              className="lab-button"
              aria-pressed={drawing}
              onClick={() => setDrawing(!drawing)}
            >
              {drawing ? "Finish drawing" : "Draw route points"}
            </button>
          </div>
          <p className="lab-fine">
            Drag a marker, focus it and use arrows, or use numerical inputs.
            Drawing mode adds up to eight points by tapping empty field space.
            Schematics do not validate formations, player eligibility, routes or
            blocking. Flag league rules are not configured.
          </p>
        </section>
        <aside className="lab-panel">
          <h2>Player & route editor</h2>
          <label>
            Selected player
            <select
              aria-label="Selected player"
              value={player.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {play.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <div className="lab-coordinate-inputs">
            {(["x", "y"] as const).map((axis) => (
              <label key={axis}>
                {axis.toUpperCase()} position
                <input
                  aria-label={`Player ${axis.toUpperCase()}`}
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(player.start[axis])}
                  onChange={(e) =>
                    move(player.id, {
                      ...player.start,
                      [axis]: Math.max(
                        0,
                        Math.min(100, Number(e.target.value)),
                      ),
                    })
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Route label
            <select
              aria-label="Route label"
              value={player.label}
              onChange={(e) =>
                edit({
                  ...play,
                  players: play.players.map((p) =>
                    p.id === player.id ? { ...p, label: e.target.value } : p,
                  ),
                })
              }
            >
              {[
                ...new Set([player.label, "QB", "C", "X", "Y", "Z", "H", "R"]),
              ].map((label) => (
                <option key={label}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Custom system label
            <input
              aria-label="Custom system label"
              maxLength={12}
              value={player.label}
              onChange={(e) =>
                edit({
                  ...play,
                  players: play.players.map((p) =>
                    p.id === player.id
                      ? {
                          ...p,
                          label: e.target.value.replace(/[^A-Za-z0-9-]/g, ""),
                        }
                      : p,
                  ),
                })
              }
            />
          </label>
          <div className="lab-actions">
            <button
              className="lab-button"
              onClick={() =>
                route([
                  { x: player.start.x, y: Math.max(5, player.start.y - 30) },
                ])
              }
            >
              Straight path
            </button>
            <button
              className="lab-button"
              onClick={() =>
                route([
                  { x: player.start.x, y: 45 },
                  { x: Math.min(95, player.start.x + 20), y: 45 },
                ])
              }
            >
              Angle path
            </button>
            <button className="lab-button" onClick={() => route([])}>
              Clear route
            </button>
          </div>
          <ol className="lab-route-points">
            {player.route.map((p, i) => (
              <li key={i}>
                <span>Point {i + 1}</span>
                {(["x", "y"] as const).map((axis) => (
                  <input
                    key={axis}
                    aria-label={`Route point ${i + 1} ${axis.toUpperCase()}`}
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(p[axis])}
                    onChange={(e) =>
                      route(
                        player.route.map((q, j) =>
                          j === i
                            ? {
                                ...q,
                                [axis]: Math.max(
                                  0,
                                  Math.min(100, Number(e.target.value)),
                                ),
                              }
                            : q,
                        ),
                      )
                    }
                  />
                ))}
                <button
                  aria-label={`Remove route point ${i + 1}`}
                  onClick={() => route(player.route.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
          <button
            className="lab-button primary"
            disabled={!play.name.trim()}
            onClick={save}
          >
            Save play locally
          </button>
          <button className="lab-button" onClick={exportPlay}>
            Export play JSON
          </button>
          <label className="lab-file-import">
            Import play JSON
            <input
              aria-label="Import play JSON"
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                importFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <p role="status">{message}</p>
          <h3>Saved playbook</h3>
          {state.plays.length === 0 ? (
            <p>No plays saved in this browser.</p>
          ) : (
            state.plays.map((p) => (
              <div className="lab-saved-play" key={p.id}>
                <button
                  className="lab-button"
                  onClick={() => {
                    edit(p);
                    setSelected(p.players[0].id);
                    setMessage("Saved play loaded.");
                  }}
                >
                  {p.name} · {p.format}
                </button>
                <button
                  className="lab-button"
                  aria-label={`Delete saved play ${p.name}`}
                  onClick={() => {
                    updateLab((s) => ({
                      ...s,
                      plays: s.plays.filter((item) => item.id !== p.id),
                    }));
                    setMessage(
                      "Saved play removed from the local playbook. Export the active draft if needed.",
                    );
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </aside>
      </div>
    </>
  );
}

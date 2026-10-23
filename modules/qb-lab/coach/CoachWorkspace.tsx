"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AppIcon, type AppIconName } from "../AppIcon";
import { Overview } from "./Overview";
import { Roster } from "./Roster";
import { Strategy } from "./Strategy";
import { FilmVault } from "./FilmVault";
import type {
  AthleteId,
  TeamFormat,
  DepthChart,
  DemoSubmission,
  ScheduleItem,
  ScriptTag,
  FocusWeights,
} from "./model";
const tabs = [
  { id: "overview", label: "Dashboard", symbol: "home" },
  { id: "roster", label: "Roster", symbol: "profile" },
  { id: "playbook", label: "Playbook", symbol: "plays" },
  { id: "film", label: "Film Vault", symbol: "film" },
] as const;
const subscribeReady = () => () => {};
export function CoachWorkspace() {
  const ready = useSyncExternalStore(
    subscribeReady,
    () => true,
    () => false,
  );
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("overview");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [charts, setCharts] = useState<Partial<Record<TeamFormat, DepthChart>>>(
    {},
  );
  const [emphasis, setEmphasis] = useState<Record<AthleteId, FocusWeights>>({
    A: { footwork: 3, recognition: 3, mechanics: 3 },
    B: { footwork: 3, recognition: 3, mechanics: 3 },
  });
  const [scripts, setScripts] = useState<ScriptTag[]>([]);
  const [submissions, setSubmissions] = useState<DemoSubmission[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  return (
    <section className="coach-console" aria-label="Coach command workspace">
      <header className="coach-header">
        <div>
          <p className="coach-eyebrow">COACH TAE / DEVELOPMENT OPERATIONS</p>
          <h1>Your team. Your next move.</h1>
          <p>
            A clear view of the work, the people and the next coaching moment.
          </p>
        </div>
        <div className="coach-workspace-status">
          <span className="coach-status-light" />
          Synthetic workspace<span>Real accounts &amp; uploads disabled</span>
        </div>
      </header>
      <p><Link className="lab-button" href="/qb-lab/messages">Account messaging &amp; schedule →</Link><Link className="lab-button" href="/qb-lab/welcome/workflows">Synthetic coaching walkthrough →</Link></p>
      <nav
        className="coach-tabs"
        role="tablist"
        aria-label="Coach workspace sections"
      >
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`coach-tab-${t.id}`}
            disabled={!ready}
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`coach-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => {
              let next = i;
              if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
              else if (e.key === "ArrowLeft")
                next = (i - 1 + tabs.length) % tabs.length;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = tabs.length - 1;
              else return;
              e.preventDefault();
              setActive(tabs[next].id);
              tabRefs.current[next]?.focus();
            }}
          >
            <span aria-hidden="true">
              <AppIcon name={t.symbol as AppIconName} />
            </span>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="coach-session-note">
        Demo athletes only. Roster plans, scripts, schedules and film
        illustrations stay in this workspace session; existing activity and
        assignment history uses the browser-local QB LAB store.
      </div>
      {tabs
        .filter((t) => t.id !== active)
        .map((t) => (
          <div
            key={t.id}
            role="tabpanel"
            id={`coach-panel-${t.id}`}
            aria-labelledby={`coach-tab-${t.id}`}
            hidden
          />
        ))}
      <fieldset
        className="coach-ready-boundary"
        disabled={!ready}
        aria-label="Interactive coach workspace"
      >
        <div
          role="tabpanel"
          id={`coach-panel-${active}`}
          aria-labelledby={`coach-tab-${active}`}
          tabIndex={0}
          className="coach-content"
        >
          {active === "overview" && (
            <Overview
              submissions={submissions}
              schedule={schedule}
              onSchedule={(s) => setSchedule((p) => [...p, s].slice(-100))}
            />
          )}
          {active === "roster" && (
            <Roster
              charts={charts}
              onChart={(f, c) => setCharts((p) => ({ ...p, [f]: c }))}
              emphasis={emphasis}
              onEmphasis={(id, key, n) =>
                setEmphasis((p) => ({ ...p, [id]: { ...p[id], [key]: n } }))
              }
            />
          )}
          {active === "playbook" && (
            <Strategy scripts={scripts} onScripts={setScripts} />
          )}
          {active === "film" && (
            <FilmVault
              submissions={submissions}
              onSubmit={(player) =>
                setSubmissions((p) =>
                  p.length >= 20
                    ? p
                    : [
                        ...p,
                        {
                          id: crypto.randomUUID(),
                          player,
                          coach: "coach-demo",
                          visibility: "Private",
                          status: "Awaiting review",
                          feedback: [],
                          marks: [],
                        },
                      ],
                )
              }
              onReview={(id, feedback, marks) =>
                setSubmissions((p) =>
                  p.map((s) =>
                    s.id === id
                      ? { ...s, feedback, marks, status: "Reviewed" }
                      : s,
                  ),
                )
              }
            />
          )}
        </div>
      </fieldset>
      <footer className="coach-footer">
        Coach Tae QB LAB · Private development, purposeful coaching.
        Demonstration controls do not grant server access.
      </footer>
    </section>
  );
}

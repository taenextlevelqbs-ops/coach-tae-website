"use client";
import { useState } from "react";
import Link from "next/link";
import { AppIcon } from "../AppIcon";
import { useLocalLab } from "../platform/store";
import { CoachAssignments } from "../platform/Coach";
import {
  demoRoster,
  type AthleteId,
  type DemoSubmission,
  type ScheduleItem,
} from "./model";
const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(iso + "T12:00:00Z"));
export function Overview({
  submissions,
  schedule,
  onSchedule,
}: {
  submissions: DemoSubmission[];
  schedule: ScheduleItem[];
  onSchedule: (item: ScheduleItem) => void;
}) {
  const { state } = useLocalLab();
  const [openedAt] = useState(() => Date.now());
  const [month, setMonth] = useState("2026-10");
  const [day, setDay] = useState("2026-10-22");
  const [athlete, setAthlete] = useState<AthleteId>("A");
  const [time, setTime] = useState("16:00");
  const [session, setSession] = useState<ScheduleItem["session"]>("Footwork");
  const [windowDays, setWindowDays] = useState(30);
  const [notice, setNotice] = useState("");
  const [year, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const offset = new Date(Date.UTC(year, m - 1, 1)).getUTCDay();
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(month + "-01T12:00:00Z"));
  const recent = state.activities.filter(
    (a) =>
      openedAt - Date.parse(a.at) <= windowDays * 86400000 &&
      Date.parse(a.at) <= openedAt,
  );
  const categories = ["workout", "lesson", "simulation", "mechanics"] as const;
  function shift(delta: number) {
    const d = new Date(Date.UTC(year, m - 1 + delta, 1));
    setMonth(d.toISOString().slice(0, 7));
  }
  return (
    <>
      <div className="coach-metrics" aria-label="Local workspace metrics">
        {[
          ["Demo roster", 2, "Synthetic athletes"],
          [
            "Video queue",
            submissions.filter((s) => s.status === "Awaiting review").length,
            "Demo submissions awaiting review",
          ],
          ["Scheduled sessions", schedule.length, "Your session plans"],
          [
            "Recorded work",
            state.activities.length,
            "Actual browser-local events",
          ],
        ].map(([label, value, detail]) => (
          <article className="coach-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </div>
      <div className="coach-overview-grid">
        <section className="coach-card">
          <div className="coach-section-title">
            <div>
              <p className="coach-eyebrow">MAKE TIME FOR DEVELOPMENT</p>
              <h2>Training calendar</h2>
            </div>
            <span className="coach-pill">Session planning · Eastern time</span>
          </div>
          <div className="coach-calendar-head">
            <button
              aria-label="Previous calendar month"
              onClick={() => shift(-1)}
            >
              ←
            </button>
            <h3>{monthLabel}</h3>
            <button aria-label="Next calendar month" onClick={() => shift(1)}>
              →
            </button>
          </div>
          <div
            className="coach-calendar"
            role="group"
            aria-label={`${monthLabel} dates`}
          >
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span aria-hidden="true" key={d}>
                {d}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={`blank${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const iso = `${month}-${String(i + 1).padStart(2, "0")}`;
              return (
                <button
                  aria-label={dayLabel(iso)}
                  aria-pressed={day === iso}
                  key={iso}
                  onClick={() => setDay(iso)}
                >
                  {i + 1}
                  {schedule.some((s) => s.date === iso) && (
                    <span
                      aria-label="has planned sessions"
                      className="coach-date-dot"
                    />
                  )}
                </button>
              );
            })}
          </div>
          <p className="coach-small">
            Demonstration calendar starts in October 2026. Select any day to
            plan a synthetic session.
          </p>
          <h3>{dayLabel(day)}</h3>
          <div className="coach-form-row">
            <label>
              Session athlete
              <select
                value={athlete}
                onChange={(e) => setAthlete(e.target.value as AthleteId)}
              >
                {demoRoster.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · demo
                  </option>
                ))}
              </select>
            </label>
            <label>
              Session type
              <select
                value={session}
                onChange={(e) =>
                  setSession(e.target.value as ScheduleItem["session"])
                }
              >
                <option>Footwork</option>
                <option>Football IQ</option>
              </select>
            </label>
            <label>
              Session time
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>
          </div>
          <button
            className="coach-primary"
            disabled={!/^\d{2}:\d{2}$/.test(time)}
            onClick={() => {
              if (
                schedule.some(
                  (s) =>
                    s.date === day && s.time === time && s.athlete === athlete,
                )
              ) {
                setNotice(
                  "That demo athlete already has a session at this time.",
                );
                return;
              }
              onSchedule({
                id: crypto.randomUUID(),
                date: day,
                time,
                athlete,
                session,
              });
              setNotice(
                "Session added to this demo workspace. No notification was sent.",
              );
            }}
          >
            Schedule demonstration session
          </button>
          <p>{notice}</p>
        </section>
        <div className="coach-stack">
          <section className="coach-card">
            <div className="coach-section-title">
              <div>
                <p className="coach-eyebrow">ACTIVITY, NOT INVENTED RATINGS</p>
                <h2>Development activity</h2>
              </div>
              <label>
                Activity period
                <select
                  aria-label="Activity period"
                  value={windowDays}
                  onChange={(e) => setWindowDays(Number(e.target.value))}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                </select>
              </label>
            </div>
            {recent.length === 0 ? (
              <div className="coach-empty">
                <span>
                  <AppIcon name="progress" style={{ width: 30, height: 30 }} />
                </span>
                <h3>Your next rep starts the story.</h3>
                <p>
                  No activity recorded in this period. Complete real
                  interactions in the demo tools to populate this chart.
                </p>
                <Link href="/qb-lab/simulator/engine">Open live pocket →</Link>
              </div>
            ) : (
              <ul
                className="coach-chart"
                aria-label="Recorded activity by category"
              >
                {categories.map((k) => {
                  const count = recent.filter((a) => a.kind === k).length;
                  return (
                    <li key={k}>
                      <div>
                        <span>{k}</span>
                        <strong>{count} events</strong>
                      </div>
                      <div aria-hidden="true" className="coach-chart-track">
                        <span
                          style={{ width: `${(count / recent.length) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="coach-small">
              Browser-local completions and decisions as of page opening; no
              verified skill improvement or season performance is inferred.
            </p>
          </section>
          <section className="coach-card">
            <h2>Schedule feed</h2>
            {!schedule.length ? (
              <p>No sessions planned yet. Choose a date to add the first.</p>
            ) : (
              <ol className="coach-feed">
                {[...schedule]
                  .sort((a, b) =>
                    (a.date + a.time).localeCompare(b.date + b.time),
                  )
                  .slice(0, 8)
                  .map((s) => (
                    <li key={s.id}>
                      <span className="coach-feed-dot" />
                      <div>
                        <strong>
                          {s.session} ·{" "}
                          {demoRoster.find((a) => a.id === s.athlete)?.name}
                        </strong>
                        <p>
                          {s.date} · {s.time} Eastern · demo only
                        </p>
                      </div>
                    </li>
                  ))}
              </ol>
            )}
          </section>
        </div>
      </div>
      <section className="coach-assignment-section">
        <div className="coach-section-title">
          <div>
            <p className="coach-eyebrow">CONNECT THE NEXT REP</p>
            <h2>Assignments &amp; athlete development</h2>
          </div>
        </div>
        <CoachAssignments />
      </section>
    </>
  );
}

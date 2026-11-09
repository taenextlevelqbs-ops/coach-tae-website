"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import "../../book/booking.css";
type Session = {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  closed: boolean;
};
type Booking = {
  id: string;
  session_id: string;
  parent_name: string;
  athlete_name: string;
  email: string;
  phone: string;
  status: string;
  stripe_payment_id: string | null;
  credit_id: string | null;
};
type Schedule = {
  sessions: Session[];
  bookings: Booking[];
  types: { id: string; name: string }[];
  blocks: { id: string; starts_at: string; ends_at: string; reason: string }[];
};
export default function CoachSchedule() {
  const [data, setData] = useState<Schedule | null>(null),
    [message, setMessage] = useState(
      "Sign in to manage your private schedule.",
    ),
    [cursor, setCursor] = useState(DateTime.now().setZone("America/New_York")),
    [view, setView] = useState<"week" | "month">("week"),
    [target, setTarget] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function restoreSession() {
      try {
        const response = await fetch("/api/coach/schedule", { cache: "no-store", signal: controller.signal });
        if (response.status === 401) return;
        if (!response.ok) throw new Error("Unable to restore your schedule. Please sign in again.");
        const schedule: Schedule = await response.json();
        if (!controller.signal.aborted) {
          setData(schedule);
          setMessage("Schedule updated.");
        }
      } catch (error) {
        if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Unable to restore your schedule.");
      }
    }
    void restoreSession();
    return () => controller.abort();
  }, []);
  async function load() {
    const r = await fetch("/api/coach/schedule", { cache: "no-store" });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setData(d);
    setMessage("Schedule updated.");
  }
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const r = await fetch("/api/coach/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      if (!r.ok) throw Error("Sign-in failed.");
      await load();
    } catch (e) {
      setMessage(String(e));
    }
  }
  async function action(body: Record<string, unknown>) {
    try {
      const r = await fetch("/api/coach/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
    } catch (e) {
      setMessage(String(e));
    }
  }
  const first = cursor.startOf(view);
  const days = Array.from(
    { length: view === "week" ? 7 : (cursor.daysInMonth ?? 30) },
    (_, i) => first.plus({ days: i }),
  );
  return (
    <main className="booking">
      <Link href="/">← Coach Tae</Link>
      <h1>Coach Tae Lab</h1>
      <p>Your private training dashboard · Eastern time</p>
      <p role="status">{message}</p>
      {!data ? (
        <form onSubmit={login}>
          <label>
            Coach email
            <input name="email" type="email" required autoComplete="username" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button>Sign in</button>
        </form>
      ) : (
        <>
          <button
            onClick={() =>
              void fetch("/api/coach/login", { method: "DELETE" }).then(() =>
                setData(null),
              )
            }
          >
            Sign out
          </button>
          <button
            onClick={() =>
              void load().catch(() => setMessage("Unable to refresh"))
            }
          >
            Refresh schedule
          </button>
          <label>
            Reschedule destination
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Choose a session</option>
              {data.sessions
                .filter((s) => !s.closed)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {DateTime.fromISO(s.starts_at)
                      .setZone("America/New_York")
                      .toFormat("LLL d, h:mm a")}
                  </option>
                ))}
            </select>
          </label>
          <div className="month">
            <button
              onClick={() =>
                setCursor(
                  cursor.minus(view === "week" ? { weeks: 1 } : { months: 1 }),
                )
              }
            >
              Previous
            </button>
            <strong>{cursor.toFormat("LLLL yyyy")}</strong>
            <button
              onClick={() =>
                setCursor(
                  cursor.plus(view === "week" ? { weeks: 1 } : { months: 1 }),
                )
              }
            >
              Next
            </button>
          </div>
          <div className="choices">
            <button
              aria-pressed={view === "week"}
              onClick={() => setView("week")}
            >
              Week
            </button>
            <button
              aria-pressed={view === "month"}
              onClick={() => setView("month")}
            >
              Month
            </button>
          </div>
          {days.map((day) => (
            <section key={day.toISODate()}>
              <h2>{day.toFormat("ccc, LLL d")}</h2>
              {data.sessions
                .filter((s) =>
                  DateTime.fromISO(s.starts_at)
                    .setZone("America/New_York")
                    .hasSame(day, "day"),
                )
                .map((s) => (
                  <article key={s.id}>
                    <strong>
                      {DateTime.fromISO(s.starts_at)
                        .setZone("America/New_York")
                        .toFormat("h:mm a")}{" "}
                      · Capacity {s.capacity}
                      {s.closed ? " · Closed for booking" : ""}
                    </strong>
                    {data.bookings
                      .filter((b) => b.session_id === s.id)
                      .map((b) => (
                        <p key={b.id}>
                          {b.athlete_name} · {b.parent_name} ·{" "}
                          <a href={`mailto:${b.email}`}>{b.email}</a> ·{" "}
                          <a href={`tel:${b.phone}`}>{b.phone}</a> · {b.status}{" "}
                          ·{" "}
                          {b.stripe_payment_id
                            ? "Stripe payment verified"
                            : b.credit_id
                              ? "Prepaid package credit"
                              : "No verified payment"}
                          {b.status === "confirmed" && (
                            <>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Cancel this appointment? This does not issue a refund.",
                                    )
                                  )
                                    void action({ action: "cancel", id: b.id });
                                }}
                              >
                                Cancel appointment
                              </button>
                              <button
                                disabled={!target}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Move this appointment to the selected destination?",
                                    )
                                  )
                                    void action({
                                      action: "reschedule",
                                      id: b.id,
                                      target,
                                    });
                                }}
                              >
                                Move to selected session
                              </button>
                            </>
                          )}
                        </p>
                      ))}
                    <button
                      onClick={() =>
                        void action({ action: "delete", id: s.id })
                      }
                    >
                      Delete unused session
                    </button>
                    <button
                      disabled={s.closed}
                      onClick={() => void action({ action: "close", id: s.id })}
                    >
                      Close availability (keep appointments)
                    </button>
                  </article>
                ))}
            </section>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fields = Object.fromEntries(new FormData(e.currentTarget));
              void action({
                action: fields.id ? "edit" : "session",
                ...fields,
              });
            }}
          >
            <h2>Add or edit availability</h2>
            <label>
              Existing session to edit (leave blank to add)
              <select name="id">
                <option value="">New session</option>
                {data.sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {DateTime.fromISO(s.starts_at)
                      .setZone("America/New_York")
                      .toFormat("LLL d, h:mm a")}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Times of sessions with booking history cannot be edited.
              Reschedule each appointment instead.
            </p>
            <label>
              Repeat weekly (1–12 weeks)
              <input
                name="weeks"
                type="number"
                min="1"
                max="12"
                defaultValue="1"
              />
            </label>
            <label>
              Training type
              <select name="type" required>
                {data.types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input name="date" type="date" required />
            </label>
            <label>
              Eastern start time
              <input name="time" type="time" required />
            </label>
            <label>
              Duration in minutes
              <input
                name="minutes"
                type="number"
                min="15"
                max="240"
                defaultValue="60"
                required
              />
            </label>
            <label>
              Capacity (private sessions: 1)
              <input
                name="capacity"
                type="number"
                min="1"
                max="30"
                defaultValue="1"
                required
              />
            </label>
            <button>Add session</button>
          </form>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action({
                action: "block",
                ...Object.fromEntries(new FormData(e.currentTarget)),
              });
            }}
          >
            <h2>Block days</h2>
            <p>
              Paid appointments remain on the calendar. Contact affected
              families before changing their appointments.
            </p>
            <label>
              First blocked day
              <input name="date" type="date" required />
            </label>
            <label>
              First available day after block
              <input name="endDate" type="date" required />
            </label>
            <label>
              Reason
              <input name="reason" required maxLength={200} />
            </label>
            <button>Block new bookings</button>
          </form>
          {data.blocks.map((b) => (
            <article key={b.id}>
              {b.reason} ·{" "}
              {DateTime.fromISO(b.starts_at)
                .setZone("America/New_York")
                .toISODate()}
              <button
                onClick={() => void action({ action: "unblock", id: b.id })}
              >
                Remove block
              </button>
            </article>
          ))}
        </>
      )}
    </main>
  );
}

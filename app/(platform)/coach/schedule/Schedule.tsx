"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { api } from "@/lib/platform/browser";
import type { Booking, Slot } from "@/lib/platform/types";
import { message, useNow } from "../../usePortal";
const zone = "America/New_York";
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type Rule = {
  id: string;
  weekday: number;
  kind: "private" | "group";
  local_start: string;
  local_end: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  capacity: number;
  active: boolean;
};
type CalendarBooking = Booking & {
  ct_athletes: { name: string };
  ct_families?: { email: string } | null;
};
type CalendarData = {
  rules: Rule[];
  slots: (Slot & { cancelled: boolean })[];
  bookings: CalendarBooking[];
  blocks: { id: string; starts_at: string; ends_at: string; reason: string }[];
  limited: boolean;
  settings?: {
    cancellation_hours: number;
    reschedule_hours: number;
    notice_hours: number;
    location: string;
  };
};
type WindowForm = {
  id: string | null;
  weekdays: number[];
  kind: "private" | "group";
  local_start: string;
  local_end: string;
  duration_minutes: number;
  buffer_minutes: number;
  capacity: number;
};
const emptyWindow: WindowForm = {
  id: null,
  weekdays: [],
  kind: "private",
  local_start: "",
  local_end: "",
  duration_minutes: 60,
  buffer_minutes: 15,
  capacity: 1,
};
function CoachBooking({
  booking,
  onAction,
}: {
  booking: CalendarBooking;
  onAction: (path: string, body: unknown) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false),
    [date, setDate] = useState(""),
    [targets, setTargets] = useState<Slot[]>([]),
    [target, setTarget] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<CalendarData>(`admin/calendar?date=${date}`);
      setTargets(
        result.slots.filter(
          (s) =>
            !s.cancelled &&
            s.kind === booking.ct_slots.kind &&
            s.id !== booking.slot_id &&
            DateTime.fromISO(s.starts_at).setZone(zone).toISODate() === date,
        ),
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="record stack">
      <div className="row between">
        <strong>{booking.ct_athletes.name}</strong>
        <span className="badge">
          {booking.status === "held" ? "Unpaid hold" : booking.status}
        </span>
      </div>
      {booking.ct_families?.email && (
        <small className="muted">Parent: {booking.ct_families.email}</small>
      )}
      <small className="muted">Reference: {booking.id}</small>
      <div className="row">
        {booking.status === "confirmed" && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => setEditing(!editing)}
          >
            Reschedule athlete
          </button>
        )}
        <button
          className="danger"
          disabled={busy}
          onClick={async () => {
            if (
              !window.confirm(
                "Cancel this athlete’s booking? Confirmed bookings restore an eligible same-type credit; unpaid holds do not. This does not issue a cash refund.",
              )
            )
              return;
            setBusy(true);
            await onAction("booking", {
              booking_id: booking.id,
              target_slot_id: null,
            });
            setBusy(false);
          }}
        >
          Cancel athlete booking
        </button>
      </div>
      {editing && (
        <form className="stack" onSubmit={load}>
          <label>
            New date (Eastern)
            <input
              type="date"
              required
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTargets([]);
                setTarget("");
              }}
            />
          </label>
          <button className="secondary" disabled={busy}>
            Find sessions
          </button>
          {targets.length > 0 ? (
            <>
              <label>
                Move to
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">Choose a session</option>
                  {targets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {DateTime.fromISO(s.starts_at)
                        .setZone(zone)
                        .toFormat("h:mm a")}{" "}
                      · capacity {s.capacity}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={busy || !target}
                onClick={async () => {
                  setBusy(true);
                  if (
                    await onAction("booking", {
                      booking_id: booking.id,
                      target_slot_id: target,
                    })
                  )
                    setEditing(false);
                  setBusy(false);
                }}
              >
                Save reschedule
              </button>
            </>
          ) : (
            date && (
              <p className="muted">
                Search this date for matching sessions. Capacity is rechecked
                when saving.
              </p>
            )
          )}
        </form>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
    </div>
  );
}
export default function Schedule() {
  const now = useNow();
  const [today] = useState(() => DateTime.now().setZone(zone).toISODate()!);
  const [month, setMonth] = useState(today),
    [selected, setSelected] = useState(today),
    [data, setData] = useState<CalendarData | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState<"window" | "one-time" | "block" | null>(null),
    [form, setForm] = useState<WindowForm>(emptyWindow);
  const first = DateTime.fromISO(month, { zone }).startOf("month");
  const load = useCallback(async () => {
    const value = await api<CalendarData>(`admin/calendar?date=${month}`);
    setData(value);
    setError("");
  }, [month]);
  useEffect(() => {
    let active = true;
    api<CalendarData>(`admin/calendar?date=${month}`)
      .then((value) => {
        if (active) {
          setData(value);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, [month]);
  async function action(path: string, body: unknown) {
    setBusy(true);
    setNotice("");
    try {
      const result = await api<{ created?: number }>(`admin/${path}`, body);
      await load();
      setNotice(
        result.created !== undefined
          ? `Saved. ${result.created} sessions published. Existing bookings are preserved; conflicting times are skipped.`
          : "Saved to your calendar.",
      );
      return true;
    } catch (e) {
      setNotice(message(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  function openMode(next: "window" | "one-time" | "block") {
    setMode(next);
    requestAnimationFrame(() =>
      document
        .getElementById("schedule-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }
  function openWindow(rule?: Rule) {
    setForm(
      rule
        ? {
            ...rule,
            id: rule.id,
            weekdays: [rule.weekday],
            local_start: rule.local_start.slice(0, 5),
            local_end:
              rule.local_end?.slice(0, 5) ||
              DateTime.fromFormat(rule.local_start.slice(0, 5), "HH:mm")
                .plus({ minutes: rule.duration_minutes })
                .toFormat("HH:mm"),
          }
        : {
            ...emptyWindow,
            weekdays: [DateTime.fromISO(selected).weekday % 7],
          },
    );
    openMode("window");
  }
  function changeMonth(delta: number) {
    const next = first.plus({ months: delta }).toISODate()!;
    setMonth(next);
    setSelected(next);
    setMode(null);
  }
  if (error)
    return (
      <section className="panel stack">
        <p className="notice error" role="alert">
          {error}
        </p>
        <Link href="/coach" className="button secondary">
          Back to coach dashboard
        </Link>
      </section>
    );
  if (!data) return <p role="status">Loading your Eastern-time calendar…</p>;
  const dayStart = DateTime.fromISO(selected, { zone }),
    dayEnd = dayStart.plus({ days: 1 });
  const live = (b: CalendarBooking) =>
    b.status === "confirmed" ||
    (b.status === "held" && Date.parse(b.hold_until || "") > now);
  const dateFor = (stamp: string) =>
    DateTime.fromISO(stamp).setZone(zone).toISODate();
  const daySlots = data.slots.filter(
    (s) =>
      dateFor(s.starts_at) === selected &&
      (!s.cancelled ||
        data.bookings.some((b) => b.slot_id === s.id && live(b))),
  );
  const dayBlocks = data.blocks.filter(
    (b) =>
      DateTime.fromISO(b.starts_at) < dayEnd &&
      DateTime.fromISO(b.ends_at) > dayStart,
  );
  return (
    <div className="stack">
      <div className="row between">
        <Link className="inline-link" href="/coach">
          ← Coach dashboard
        </Link>
        <span className="badge">America/New_York · DST automatic</span>
      </div>
      <div className="row">
        <button onClick={() => openWindow()}>Add Availability</button>
        <button className="secondary" onClick={() => openMode("one-time")}>
          Add one-time session
        </button>
        <button className="secondary" onClick={() => openMode("block")}>
          Block Date / vacation
        </button>
      </div>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {data.limited && (
        <p className="notice error">
          This month exceeds the 1,000-record display limit. Capacity remains
          protected by database checks; narrow operational reports before
          relying on this view.
        </p>
      )}
      <div className="grid">
        <section className="panel calendar-panel">
          <div className="row between">
            <button
              className="secondary"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              ←
            </button>
            <h2>{first.toFormat("LLLL yyyy")}</h2>
            <button
              className="secondary"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              →
            </button>
          </div>
          <div className="calendar-grid" aria-label="Training calendar">
            {days.map((d) => (
              <div className="calendar-weekday" key={d}>
                {d}
              </div>
            ))}
            {Array.from({ length: first.weekday % 7 }, (_, i) => (
              <span key={`blank-${i}`} aria-hidden="true" />
            ))}
            {Array.from({ length: first.daysInMonth || 0 }, (_, i) => {
              const d = first.plus({ days: i }),
                date = d.toISODate()!;
              const sessions = data.slots.filter(
                (s) => dateFor(s.starts_at) === date && !s.cancelled,
              );
              const count = data.bookings.filter(
                (b) => dateFor(b.ct_slots.starts_at) === date && live(b),
              ).length;
              const blocked = data.blocks.some(
                (b) =>
                  DateTime.fromISO(b.starts_at) < d.plus({ days: 1 }) &&
                  DateTime.fromISO(b.ends_at) > d,
              );
              return (
                <button
                  className="calendar-day"
                  key={date}
                  aria-pressed={selected === date}
                  aria-label={`${d.toFormat("MMMM d")}, ${sessions.length} sessions, ${count} bookings${blocked ? ", blocked time" : ""}`}
                  onClick={() => {
                    setSelected(date);
                    setMode(null);
                  }}
                >
                  <strong>{i + 1}</strong>
                  <span className="calendar-dots" aria-hidden="true">
                    {sessions.length > 0 && <i className="session-dot" />}
                    {count > 0 && <i className="booking-dot" />}
                    {blocked && <i className="block-dot" />}
                  </span>
                  <small>
                    {count > 0
                      ? `${count} booked`
                      : sessions.length > 0
                        ? `${sessions.length} slots`
                        : ""}
                  </small>
                </button>
              );
            })}
          </div>
          <p className="muted">
            Blue: sessions · green: bookings · red: blocked time. Select a day
            to manage it.
          </p>
        </section>
        <section className="panel stack">
          <p className="eyebrow">{dayStart.toFormat("cccc, LLLL d")}</p>
          <h2>Day schedule</h2>
          {!daySlots.length && !dayBlocks.length && (
            <p className="notice">
              No sessions or blocked time. Add confirmed availability to open
              this date.
            </p>
          )}
          {dayBlocks.map((b) => (
            <div className="notice error stack" key={b.id}>
              <strong>Blocked · {b.reason || "Time off"}</strong>
              <p>
                {DateTime.fromISO(b.starts_at)
                  .setZone(zone)
                  .toFormat("LLL d, h:mm a")}{" "}
                –{" "}
                {DateTime.fromISO(b.ends_at)
                  .setZone(zone)
                  .toFormat("LLL d, h:mm a")}
              </p>
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  action("schedule", { action: "unblock", data: { id: b.id } })
                }
              >
                Remove block
              </button>
            </div>
          ))}
          {daySlots.map((s) => (
            <article key={s.id} className="record stack">
              <h3>
                {DateTime.fromISO(s.starts_at).setZone(zone).toFormat("h:mm a")}
                –{DateTime.fromISO(s.ends_at).setZone(zone).toFormat("h:mm a")}{" "}
                · {s.kind}
              </h3>
              <span className="muted">
                Capacity {s.capacity} ·{" "}
                {
                  data.bookings.filter((b) => b.slot_id === s.id && live(b))
                    .length
                }{" "}
                reserved
              </span>
              {s.kind === "group" && (
                <form
                  className="row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void action("schedule", {
                      action: "capacity",
                      data: {
                        id: s.id,
                        capacity: Number(
                          new FormData(e.currentTarget).get("capacity"),
                        ),
                      },
                    });
                  }}
                >
                  <label>
                    Group capacity
                    <input
                      name="capacity"
                      type="number"
                      min={1}
                      max={30}
                      defaultValue={s.capacity}
                      required
                    />
                  </label>
                  <button className="secondary" disabled={busy}>
                    Save capacity
                  </button>
                </form>
              )}
              {data.bookings
                .filter((b) => b.slot_id === s.id && live(b))
                .map((b) => (
                  <CoachBooking key={b.id} booking={b} onAction={action} />
                ))}
              <button
                className="danger"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Cancel this entire session and notify all booked families? Confirmed bookings receive eligible training credits. This time will be blocked from reopening.",
                    )
                  )
                    void action("cancel-session", { slot_id: s.id });
                }}
              >
                Cancel entire session
              </button>
            </article>
          ))}
        </section>
      </div>
      {mode === "window" && (
        <section className="panel stack" id="schedule-editor">
          <h2>{form.id ? "Edit availability" : "Add availability"}</h2>
          <p className="muted">
            Weekly windows repeat for 60 days and refresh automatically. Each
            session gets a buffer before and after it. Editing preserves
            reservations and creates a new schedule version.
          </p>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await action("windows", {
                  id: form.id,
                  data: { ...form, timezone: zone },
                })
              )
                setMode(null);
            }}
          >
            <fieldset>
              <legend>Training days</legend>
              <div className="weekday-picker">
                {days.map((d, i) => (
                  <label key={d} className="radio">
                    <input
                      type="checkbox"
                      checked={form.weekdays.includes(i)}

                      onChange={(e) =>
                        setForm({
                          ...form,
                          weekdays: e.target.checked
                            ? form.id
                              ? [i]
                              : [...form.weekdays, i]
                            : form.weekdays.filter((v) => v !== i),
                        })
                      }
                    />
                    {d}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="row">
              <label>
                Service
                <select
                  value={form.kind}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kind: e.target.value as "private" | "group",
                      capacity: 1,
                    })
                  }
                >
                  <option value="private">Private training</option>
                  <option value="group">Group training</option>
                </select>
              </label>
              <label>
                Start (Eastern)
                <input
                  type="time"
                  required
                  value={form.local_start}
                  onChange={(e) =>
                    setForm({ ...form, local_start: e.target.value })
                  }
                />
              </label>
              <label>
                End (Eastern)
                <input
                  type="time"
                  required
                  value={form.local_end}
                  onChange={(e) =>
                    setForm({ ...form, local_end: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="row">
              <label>
                Session minutes
                <input
                  required
                  type="number"
                  min={15}
                  max={180}
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration_minutes: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Buffer each side (minutes)
                <input
                  required
                  type="number"
                  min={0}
                  max={60}
                  value={form.buffer_minutes}
                  onChange={(e) =>
                    setForm({ ...form, buffer_minutes: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Capacity
                <input
                  required
                  type="number"
                  min={1}
                  max={form.kind === "private" ? 1 : 30}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <div className="row">
              <button disabled={busy || !form.weekdays.length}>
                Save availability
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setMode(null)}
              >
                Close
              </button>
            </div>
          </form>
        </section>
      )}
      {mode === "block" && (
        <section className="panel stack" id="schedule-editor">
          <h2>Block a date or vacation</h2>
          <p className="muted">
            The end date is included. Existing reservations must be resolved
            first; they are never silently cancelled.
          </p>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const start = DateTime.fromISO(String(f.get("from")), {
                  zone,
                }).startOf("day"),
                end = DateTime.fromISO(String(f.get("to")), { zone })
                  .plus({ days: 1 })
                  .startOf("day");
              if (
                await action("schedule", {
                  action: "block",
                  data: {
                    starts_at: start.toUTC().toISO(),
                    ends_at: end.toUTC().toISO(),
                    reason: String(f.get("reason")),
                  },
                })
              )
                setMode(null);
            }}
          >
            <div className="row">
              <label>
                First date
                <input
                  name="from"
                  type="date"
                  required
                  defaultValue={selected}
                />
              </label>
              <label>
                Last date (included)
                <input name="to" type="date" required defaultValue={selected} />
              </label>
            </div>
            <label>
              Reason (coach only)
              <input name="reason" maxLength={300} />
            </label>
            <button disabled={busy}>Save blocked dates</button>
          </form>
        </section>
      )}
      {mode === "one-time" && (
        <section className="panel stack" id="schedule-editor">
          <h2>Add a special one-time session</h2>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await action("one-time", {
                  date: String(f.get("date")),
                  local_start: String(f.get("start")),
                  kind: String(f.get("kind")),
                  duration_minutes: Number(f.get("duration")),
                  buffer_minutes: Number(f.get("buffer")),
                  capacity: Number(f.get("capacity")),
                })
              )
                setMode(null);
            }}
          >
            <div className="row">
              <label>
                Date
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={selected}
                />
              </label>
              <label>
                Start (Eastern)
                <input type="time" name="start" required />
              </label>
              <label>
                Service
                <select name="kind">
                  <option value="private">Private</option>
                  <option value="group">Group</option>
                </select>
              </label>
            </div>
            <div className="row">
              <label>
                Duration (minutes)
                <input
                  type="number"
                  name="duration"
                  required
                  min={15}
                  max={180}
                  defaultValue={60}
                />
              </label>
              <label>
                Buffer each side
                <input
                  type="number"
                  name="buffer"
                  required
                  min={0}
                  max={60}
                  defaultValue={15}
                />
              </label>
              <label>
                Capacity (private = 1)
                <input
                  type="number"
                  name="capacity"
                  required
                  min={1}
                  max={30}
                  defaultValue={1}
                />
              </label>
            </div>
            <button disabled={busy}>Save one-time session</button>
          </form>
        </section>
      )}
      {data.settings && (
        <section className="panel stack">
          <h2>Booking policies & location</h2>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await action("settings", {
                timezone: zone,
                cancellation_hours: Number(f.get("cancel")),
                reschedule_hours: Number(f.get("reschedule")),
                notice_hours: Number(f.get("notice")),
                location: String(f.get("location")),
              });
            }}
          >
            <div className="row">
              <label>
                Cancellation notice (hours)
                <input
                  type="number"
                  name="cancel"
                  min={0}
                  max={168}
                  defaultValue={data.settings.cancellation_hours}
                />
              </label>
              <label>
                Reschedule notice (hours)
                <input
                  type="number"
                  name="reschedule"
                  min={0}
                  max={168}
                  defaultValue={data.settings.reschedule_hours}
                />
              </label>
              <label>
                Minimum booking notice (hours)
                <input
                  type="number"
                  name="notice"
                  min={0}
                  max={168}
                  defaultValue={data.settings.notice_hours}
                />
              </label>
            </div>
            <label>
              Training location / instructions
              <input
                name="location"
                maxLength={300}
                required
                defaultValue={data.settings.location}
              />
            </label>
            <button disabled={busy}>Save policies</button>
          </form>
        </section>
      )}
      <section className="panel stack">
        <h2>Recurring weekly windows</h2>
        {!data.rules.length && (
          <p className="muted">No weekly availability has been confirmed.</p>
        )}
        {data.rules.map((r) => (
          <article className="record" key={r.id}>
            <h3>
              {days[r.weekday]} · {r.local_start.slice(0, 5)}
              {r.local_end ? `–${r.local_end.slice(0, 5)}` : ""} · {r.kind}
            </h3>
            <p className="muted">
              {r.active ? "Active" : "Disabled"} · {r.duration_minutes} min
              sessions · buffer {r.buffer_minutes} min each side · capacity{" "}
              {r.capacity}
            </p>
            <div className="row">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => openWindow(r)}
              >
                Edit window
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  action("schedule", {
                    action: "rule_toggle",
                    data: { id: r.id, active: !r.active },
                  })
                }
              >
                {r.active ? "Disable window" : "Enable window"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

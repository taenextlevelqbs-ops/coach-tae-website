"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { api } from "@/lib/platform/browser";
import { entitled } from "@/lib/platform/catalog";
import type { Booking, Slot } from "@/lib/platform/types";
import { usePortal, message, useNow } from "../usePortal";
import Purchase from "../Purchase";
function SessionActions({
  booking,
  onUpdate,
}: {
  booking: Booking;
  onUpdate: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [editing, setEditing] = useState(false),
    [slots, setSlots] = useState<Slot[]>([]),
    [target, setTarget] = useState(""),
    [date, setDate] = useState("");
  async function change(slot: string | null) {
    setBusy(true);
    setError("");
    try {
      await api("bookings/manage", {
        booking_id: booking.id,
        target_slot_id: slot,
      });
      setEditing(false);
      await onUpdate();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function load(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setTarget("");
    try {
      const r = await api<{ slots: Slot[] }>(
        `availability?kind=${booking.ct_slots.kind}&date=${date}&zone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`,
      );
      setSlots(r.slots.filter((s) => s.id !== booking.slot_id));
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <div className="row">
        <button
          className="secondary"
          disabled={busy}
          onClick={() => setEditing(!editing)}
        >
          Manage booking
        </button>
      </div>
      {editing && (
        <>
          <p className="muted">
            An eligible cancellation restores one {booking.ct_slots.kind}{" "}
            training credit. No cash refund is issued by self-service
            cancellation.
          </p>
          <button
            className="danger"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  "Cancel this session? Eligible cancellations return one training credit.",
                )
              )
                void change(null);
            }}
          >
            Cancel session & restore eligible credit
          </button>
          <form className="row" onSubmit={load}>
            <label>
              Move to another date
              <input
                type="date"
                required
                value={date}
                min={DateTime.local().toISODate()!}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <button disabled={busy}>Find new times</button>
          </form>
          {slots.length > 0 ? (
            <>
              <label>
                Available times
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">Choose a time</option>
                  {slots.map((s) => (
                    <option value={s.id} key={s.id}>
                      {new Date(s.starts_at).toLocaleString()} · {s.remaining}{" "}
                      spots
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={busy || !target} onClick={() => change(target)}>
                Confirm reschedule
              </button>
            </>
          ) : (
            date && (
              <p className="muted">
                Search for another available session. Changes must meet the
                booking policy.
              </p>
            )
          )}
        </>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
    </div>
  );
}
export default function Portal() {
  const now = useNow();
  const { data, error, refresh } = usePortal();
  const [name, setName] = useState(""),
    [year, setYear] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [checkout, setCheckout] = useState("");
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("checkout");
    if (value) {
      queueMicrotask(() => setCheckout(value));
      let count = 0;
      const timer = setInterval(() => {
        void refresh();
        if (++count >= 6) clearInterval(timer);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [refresh]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await api("athletes", {
        name,
        graduation_year: year ? Number(year) : null,
      });
      setName("");
      setYear("");
      await refresh();
    } catch (e) {
      setNotice(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function redirect(path: string, body: unknown = {}) {
    setBusy(true);
    setNotice("");
    try {
      const r = await api<{ url: string }>(path, body);
      window.location.assign(r.url);
    } catch (e) {
      setNotice(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <p className="notice error" role="alert">
        {error}
      </p>
    );
  if (!data) return <p role="status">Loading your family…</p>;
  const upcoming = data.bookings.filter(
      (b) =>
        b.status === "confirmed" && Date.parse(b.ct_slots.starts_at) >= now,
    ),
    history = data.bookings.filter(
      (b) => b.status === "confirmed" && Date.parse(b.ct_slots.ends_at) < now,
    ),
    pending = data.bookings.filter(
      (b) => b.status === "held" && Date.parse(b.hold_until || "") > now,
    );
  return (
    <div className="stack">
      {data.recovery?.private || data.recovery?.group ? (
        <p className="notice">
          Refund reconciliation: {data.recovery?.private || 0} private and{" "}
          {data.recovery?.group || 0} group credits remain to be recovered from
          a previously refunded purchase. Available balances stay nonnegative;
          future credit additions settle this adjustment first.
        </p>
      ) : null}
      {checkout && (
        <p className="notice" role="status">
          {checkout === "complete"
            ? "Checkout returned successfully. Confirmation and access appear only after Stripe payment verification. If the payment is still pending, refresh shortly."
            : "Checkout was cancelled. Any unpaid reservation expires automatically."}
        </p>
      )}
      {notice && (
        <p role="alert" className="notice error">
          {notice}
        </p>
      )}
      <div className="row between">
        <Link href="/book" className="button">
          Book a session →
        </Link>
        {data.isCoach && (
          <Link href="/coach" className="button secondary">
            Coach dashboard
          </Link>
        )}
        <button className="secondary" onClick={refresh}>
          Refresh status
        </button>
      </div>
      <div className="grid-3">
        <div className="panel">
          <p className="eyebrow">Private credits</p>
          <div className="credit">{data.credits.private}</div>
          <p className="muted">Available for 1-on-1 training</p>
        </div>
        <div className="panel">
          <p className="eyebrow">Group credits</p>
          <div className="credit">{data.credits.group}</div>
          <p className="muted">Available for small-group training</p>
        </div>
        <div className="panel">
          <p className="eyebrow">On the calendar</p>
          <div className="credit">{upcoming.length}</div>
          <p className="muted">Upcoming confirmed sessions</p>
        </div>
      </div>
      <div className="grid">
        <section className="panel stack">
          <h2>Upcoming training</h2>
          {upcoming.length ? (
            upcoming.map((b) => (
              <article key={b.id} className="record">
                <div className="row between">
                  <h3>
                    {data.athletes.find((a) => a.id === b.athlete_id)?.name} ·{" "}
                    {b.ct_slots.kind}
                  </h3>
                  <span className="badge">Confirmed</span>
                </div>
                <p>
                  {new Date(b.ct_slots.starts_at).toLocaleString(undefined, {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </p>
                <p className="muted">{data.settings.location}</p>
                <SessionActions booking={b} onUpdate={refresh} />
              </article>
            ))
          ) : (
            <p className="muted">
              No upcoming confirmed sessions. Choose a date to get started.
            </p>
          )}
          {pending.length > 0 && (
            <div className="notice">
              {pending.length} temporary unpaid{" "}
              {pending.length === 1 ? "reservation" : "reservations"}. Payment
              must be completed to confirm; these expire automatically.
            </div>
          )}
          <p className="auth-note">
            Times use your device timezone. Changes require at least{" "}
            {data.settings.cancellation_hours} hours for cancellation or{" "}
            {data.settings.reschedule_hours} hours for rescheduling. Qualifying
            cancellations restore a same-type credit.
          </p>
        </section>
        <section className="panel stack">
          <h2>Your athletes</h2>
          {data.athletes.map((a) => (
            <div className="record" key={a.id}>
              <strong>{a.name}</strong>
              <p className="muted">
                {a.graduation_year
                  ? `Class of ${a.graduation_year}`
                  : "Graduation year not specified"}
              </p>
            </div>
          ))}
          <form onSubmit={add} className="stack">
            <h3>Add an athlete</h3>
            <label>
              Athlete name
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              Graduation year (optional)
              <input
                type="number"
                min={2020}
                max={2050}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </label>
            <button disabled={busy || !name.trim()}>Add athlete</button>
          </form>
        </section>
      </div>
      <section className="stack">
        <div>
          <p className="eyebrow">Commit to development</p>
          <h2>More reps. Better value.</h2>
          <p className="muted">
            Credits are shared by athletes in your family. Private and group
            credits remain separate. Purchases are currently restricted to
            Stripe test mode.
          </p>
        </div>
        <div className="grid">
          <div className="panel stack">
            <h3>3 group sessions</h3>
            <div className="price">$150</div>
            <p className="muted">
              Three group training credits · $50 per session
            </p>
            <Purchase product="group_pack">Buy 3 group credits</Purchase>
          </div>
          <div className="panel stack">
            <h3>3 private sessions</h3>
            <div className="price">$240</div>
            <p className="muted">
              Three private training credits · $80 per session
            </p>
            <Purchase product="private_pack">Buy 3 private credits</Purchase>
          </div>
        </div>
      </section>
      <section className="panel stack">
        <h2>QB Lab membership</h2>
        {data.memberships.length ? (
          data.memberships.map((m) => (
            <div key={m.subscription_id} className="record">
              <span className="badge">
                {entitled(m.status, m.access_until)
                  ? "Access active"
                  : "Access inactive"}
              </span>
              <p>
                Status: {m.status} ·{" "}
                {m.cancel_at_period_end ? "Cancels" : "Current period ends"}{" "}
                {new Date(m.access_until).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <p className="muted">
            No membership yet. Explore QB Lab and view the content available
            before subscribing.
          </p>
        )}
        <div className="row">
          <Link href="/lab" className="button">
            Explore QB Lab
          </Link>
          {(data.orders.length > 0 || data.memberships.length > 0) && (
            <button
              className="secondary"
              disabled={busy}
              onClick={() => redirect("billing")}
            >
              Manage billing in Stripe
            </button>
          )}
        </div>
      </section>
      <div className="grid">
        <section className="panel">
          <h2>Training history</h2>
          {history.length ? (
            history.map((b) => (
              <div className="record" key={b.id}>
                <strong>
                  {data.athletes.find((a) => a.id === b.athlete_id)?.name} ·{" "}
                  {b.ct_slots.kind}
                </strong>
                <p className="muted">
                  {new Date(b.ct_slots.starts_at).toLocaleString()} · Past
                  confirmed session
                </p>
              </div>
            ))
          ) : (
            <p className="muted">Past confirmed sessions will appear here.</p>
          )}
          <details>
            <summary>Cancelled & expired bookings</summary>
            {data.bookings
              .filter((b) => ["cancelled", "expired"].includes(b.status))
              .map((b) => (
                <p className="muted" key={b.id}>
                  {new Date(b.ct_slots.starts_at).toLocaleString()} ·{" "}
                  {b.ct_slots.kind} · {b.status}
                </p>
              ))}
          </details>
        </section>
        <section className="panel">
          <h2>Payments</h2>
          {data.orders.length ? (
            data.orders.map((o) => (
              <div className="record" key={o.id}>
                <div className="row between">
                  <strong>{o.product_key.replaceAll("_", " ")}</strong>
                  <span className="badge">{o.status}</span>
                </div>
                <p className="muted">
                  {new Date(o.created_at).toLocaleDateString()} ·{" "}
                  {o.amount !== null
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: o.currency || "usd",
                      }).format(o.amount / 100)
                    : "Payment not confirmed"}
                </p>
                {!!o.refunded_amount && (
                  <p className="notice">
                    Settled refunds: ${(o.refunded_amount / 100).toFixed(2)}
                  </p>
                )}
                {o.status === "paid" && (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => redirect("receipt", { order_id: o.id })}
                  >
                    View Stripe receipt
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="muted">Your verified payments will appear here.</p>
          )}
        </section>
      </div>
    </div>
  );
}

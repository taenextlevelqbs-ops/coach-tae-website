"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { api } from "@/lib/platform/browser";
import type { Slot } from "@/lib/platform/types";
import { useSession } from "../Session";
import { message, usePortal } from "../usePortal";
export default function Book() {
  const { data, error, refresh } = usePortal();
  const { products } = useSession();
  const [kind, setKind] = useState<"private" | "group">("private"),
    [zone, setZone] = useState("America/New_York"),
    [date, setDate] = useState(DateTime.utc().toISODate()!),
    [athlete, setAthlete] = useState(""),
    [slots, setSlots] = useState<Slot[]>([]),
    [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [notice, setNotice] = useState(""),
    [slotError, setSlotError] = useState(""),
    [success, setSuccess] = useState(false);
  const [reservation, setReservation] = useState<{
    bookingId: string;
    orderId: string;
  } | null>(null);
  useEffect(() => {
    queueMicrotask(() => {
      if (new URLSearchParams(window.location.search).get("kind") === "group")
        setKind("group");
      setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setDate(DateTime.local().toISODate()!);
    });
  }, []);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setSelected("");
        setSlotError("");
      }
    });
    api<{ slots: Slot[] }>(
      `availability?kind=${kind}&date=${date}&zone=${encodeURIComponent(zone)}`,
    )
      .then((r) => {
        if (active) setSlots(r.slots);
      })
      .catch((e) => {
        if (active) {
          setSlots([]);
          setSlotError(message(e));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind, date, zone, success]);
  const athleteId = athlete || data?.athletes[0]?.id || "";
  const credits = data?.credits[kind] || 0;
  async function book() {
    setBusy(true);
    setNotice("");
    try {
      const result = await api<{ booking: { id: string; status: string } }>(
        "book",
        {
          athlete_id: athleteId,
          slot_id: selected,
          credit: credits > 0,
          request_id: crypto.randomUUID(),
        },
      );
      if (result.booking.status === "confirmed") {
        setSuccess(true);
        setSelected("");
        await refresh();
        return;
      }
      const pending = {
        bookingId: result.booking.id,
        orderId: crypto.randomUUID(),
      };
      setReservation(pending);
      const checkout = await api<{ url: string }>("checkout", {
        product: kind,
        booking_id: pending.bookingId,
        request_id: pending.orderId,
      });
      window.location.assign(checkout.url);
    } catch (e) {
      setNotice(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function retry() {
    if (!reservation) return;
    setBusy(true);
    setNotice("");
    try {
      const r = await api<{ url: string }>("checkout", {
        product: kind,
        booking_id: reservation.bookingId,
        request_id: reservation.orderId,
      });
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
  if (!data.athletes.length)
    return (
      <div className="panel">
        <h2>First, add your athlete.</h2>
        <p className="muted">
          Your parent account can manage multiple athletes.
        </p>
        <Link className="button" href="/portal">
          Add an athlete
        </Link>
      </div>
    );
  if (success)
    return (
      <div className="panel stack">
        <span className="badge">Confirmed</span>
        <h2>You’re on the calendar.</h2>
        <p>
          Your eligible training credit was used. Your confirmation is available
          in the family portal; email delivery follows separately.
        </p>
        <Link href="/portal" className="button">
          View my sessions
        </Link>
        <button
          className="secondary"
          onClick={() => {
            setSuccess(false);
            setReservation(null);
          }}
        >
          Book another session
        </button>
      </div>
    );
  return (
    <div className="grid section-gap">
      <section className="panel stack">
        <p className="eyebrow">01 / Choose your session</p>
        <h2>Build your week.</h2>
        <div className="row">
          <label>
            Athlete
            <select
              value={athleteId}
              onChange={(e) => setAthlete(e.target.value)}
              disabled={!!reservation}
            >
              {data.athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Training
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
              disabled={!!reservation}
            >
              <option value="private">Private · $85</option>
              <option value="group">Group · $60</option>
            </select>
          </label>
        </div>
        <div className="row">
          <label>
            Date
            <input
              type="date"
              min={DateTime.now().setZone(zone).toISODate()!}
              max={DateTime.now().plus({ days: 89 }).toISODate()!}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={!!reservation}
            />
          </label>
          <label>
            Display timezone
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              disabled={!!reservation}
            >
              {Array.from(
                new Set([
                  zone,
                  "America/New_York",
                  "America/Chicago",
                  "America/Denver",
                  "America/Los_Angeles",
                  "Europe/London",
                  "UTC",
                ]),
              ).map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </label>
        </div>
        {loading ? (
          <p role="status">Checking availability…</p>
        ) : slotError ? (
          <p role="alert" className="notice error">
            {slotError}
          </p>
        ) : slots.length ? (
          <div className="slot-list" aria-label="Available session times">
            {slots.map((s) => (
              <button
                className="slot"
                key={s.id}
                disabled={!!reservation}
                aria-pressed={s.id === selected}
                onClick={() => setSelected(s.id)}
              >
                <strong>
                  {DateTime.fromISO(s.starts_at)
                    .setZone(zone)
                    .toFormat("h:mm a")}
                </strong>
                <small>
                  {DateTime.fromISO(s.ends_at).setZone(zone).toFormat("h:mm a")}{" "}
                  · {s.remaining} {s.remaining === 1 ? "spot" : "spots"} left
                </small>
              </button>
            ))}
          </div>
        ) : (
          <p className="notice">
            No sessions available on this date. Please choose another day.
          </p>
        )}
      </section>
      <section className="panel stack">
        <p className="eyebrow">02 / Reserve your rep</p>
        <h2>
          {credits > 0
            ? "Put your credits to work."
            : "One session. A step forward."}
        </h2>
        <div className="price">
          {credits > 0
            ? "1 training credit"
            : kind === "private"
              ? "$85"
              : "$60"}
        </div>
        <p className="muted">
          {credits} {kind} {credits === 1 ? "credit" : "credits"} available.{" "}
          {credits > 0
            ? "Your credit confirms this booking immediately."
            : "Your place is confirmed after successful Stripe payment."}
        </p>
        <p className="notice">
          {data.settings.location}
          <br />
          Cancel at least {data.settings.cancellation_hours} hours ahead to
          receive a same-type training credit. Reschedule at least{" "}
          {data.settings.reschedule_hours} hours ahead. Cancellations return
          training credit, not cash. Late changes require contacting Coach Tae
          through the existing website.
        </p>
        {notice && (
          <p role="alert" className="notice error">
            {notice}
          </p>
        )}
        {reservation ? (
          <>
            <p className="notice">
              Your selected session is temporarily reserved. Complete checkout
              to confirm it; unpaid reservations expire automatically.
            </p>
            <button disabled={busy} onClick={retry}>
              {busy ? "Opening checkout…" : "Retry secure checkout"}
            </button>
            <Link href="/portal" className="inline-link">
              View reservation status
            </Link>
          </>
        ) : (
          <button
            disabled={
              busy ||
              loading ||
              !selected ||
              (!credits && !products.includes(kind))
            }
            onClick={book}
          >
            {busy
              ? "Reserving…"
              : credits > 0
                ? "Confirm with 1 credit"
                : "Continue to secure checkout"}
          </button>
        )}
        {!credits && !products.includes(kind) && (
          <p className="muted">
            Stripe Checkout for this session is not configured yet.
          </p>
        )}
        <p className="auth-note">
          Payment is handled securely by Stripe. A pending reservation is not a
          confirmed booking.
        </p>
      </section>
    </div>
  );
}

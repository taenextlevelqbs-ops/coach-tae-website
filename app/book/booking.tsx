"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import "./booking.css";
type Type = { id: string; name: string; amount: number };
type Offer = {
  id: string;
  session_type_id: string;
  name: string;
  amount: number;
};
type Credit = { id: string; session_type_id: string; remaining: number };
type Slot = {
  id: string;
  session_type_id: string;
  starts_at: string;
  remaining: number;
};
export default function Booking() {
  const [types, setTypes] = useState<Type[]>([]),
    [slots, setSlots] = useState<Slot[]>([]),
    [type, setType] = useState(""),
    [day, setDay] = useState(""),
    [slot, setSlot] = useState(""),
    [month, setMonth] = useState(
      DateTime.now().setZone("America/New_York").startOf("month"),
    ),
    [message, setMessage] = useState("Loading available training…"),
    [busy, setBusy] = useState(false),
    [offers, setOffers] = useState<Offer[]>([]),
    [offer, setOffer] = useState(""),
    [credits, setCredits] = useState<Credit[]>([]),
    [credit, setCredit] = useState(""),
    [parentEmail, setParentEmail] = useState(""),
    [code, setCode] = useState("");
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/booking/availability", {
          cache: "no-store",
        });
        if (!r.ok) throw Error();
        const d = await r.json();
        if (alive) {
          setTypes(d.types);
          setSlots(d.slots);
          setOffers(d.offers ?? []);
          setMessage(
            d.slots.length ? "" : "No training times are currently available.",
          );
        }
      } catch {
        if (alive)
          setMessage(
            "Native booking is not available yet. Please book using the links below.",
          );
      }
    }
    void load();
    const id = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  const matching = slots.filter((s) => s.session_type_id === type);
  const days = Array.from(
    { length: month.daysInMonth ?? 30 },
    (_, i) => month.plus({ days: i }).toISODate()!,
  );
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("Securing your time…");
    try {
      const fields = Object.fromEntries(new FormData(e.currentTarget));
      const r = await fetch(
        credit ? "/api/booking/parent" : "/api/booking/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...fields,
            session: slot,
            offer,
            credit,
            action: credit ? "redeem" : undefined,
          }),
        },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (credit) {
        setMessage("Your package session is confirmed. Watch for your email.");
        setSlot("");
        setBusy(false);
        await loadCredits();
      } else window.location.assign(d.url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to book");
      setBusy(false);
    }
  }
  async function loadCredits() {
    const r = await fetch("/api/booking/parent", { cache: "no-store" });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setCredits(d.credits);
  }
  async function parentAction(action: string) {
    try {
      const r = await fetch("/api/booking/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: parentEmail, code }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (action === "verify") {
        await loadCredits();
        setMessage("Email verified. Select an available credit below.");
      } else setMessage("Check your email for a sign-in code.");
    } catch (e) {
      setMessage(String(e));
    }
  }
  return (
    <main className="booking">
      <Link href="/">← Coach Tae QB Development</Link>
      <h1>Book Training</h1>
      <p>Develop. Compete. Lead.</p>
      <p>Private QB Training · $75 | Group QB Training · $50 per athlete</p>
      <p>All appointment times are Eastern (America/New_York).</p>
      <div role="status" aria-live="polite">
        {message}
      </div>
      <p>
        Returning from payment? Your appointment is confirmed only after payment
        verification. Watch for your confirmation email.
      </p>
      <section>
        <h2>1. Choose your training</h2>
        <div className="choices">
          {types.map((t) => (
            <button
              aria-pressed={type === t.id}
              key={t.id}
              onClick={() => {
                setType(t.id);
                setSlot("");
                setDay("");
                setOffer("");
                setCredit("");
              }}
            >
              {t.name} · ${(t.amount / 100).toFixed(2)}
            </button>
          ))}
        </div>
        <label>
          Payment option
          <select
            value={offer}
            onChange={(e) => {
              setOffer(e.target.value);
              setCredit("");
            }}
          >
            <option value="">Single session</option>
            {offers
              .filter((o) => o.session_type_id === type)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · ${(o.amount / 100).toFixed(2)}
                </option>
              ))}
          </select>
        </label>
        <details>
          <summary>Use existing package credits</summary>
          <label>
            Package purchaser email
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
            />
          </label>
          <button onClick={() => void parentAction("send")}>
            Email sign-in code
          </button>
          <label>
            Email code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
            />
          </label>
          <button onClick={() => void parentAction("verify")}>
            Verify email
          </button>
          <label>
            Available credits
            <select
              value={credit}
              onChange={(e) => {
                setCredit(e.target.value);
                setOffer("");
              }}
            >
              <option value="">Choose a package</option>
              {credits
                .filter((c) => c.session_type_id === type)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.remaining} sessions remaining
                  </option>
                ))}
            </select>
          </label>
        </details>
      </section>
      <section>
        <h2>2. Choose a date and time</h2>
        <div className="month">
          <button
            aria-label="Previous month"
            onClick={() => setMonth(month.minus({ months: 1 }))}
          >
            ←
          </button>
          <strong>{month.toFormat("LLLL yyyy")}</strong>
          <button
            aria-label="Next month"
            onClick={() => setMonth(month.plus({ months: 1 }))}
          >
            →
          </button>
        </div>
        <div className="calendar">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d}>{d}</span>
          ))}
          {Array.from({ length: month.weekday - 1 }, (_, i) => (
            <span key={`pad${i}`} />
          ))}
          {days.map((d) => (
            <button
              key={d}
              disabled={
                !matching.some(
                  (s) =>
                    DateTime.fromISO(s.starts_at)
                      .setZone("America/New_York")
                      .toISODate() === d,
                )
              }
              aria-pressed={d === day}
              onClick={() => {
                setDay(d);
                setSlot("");
              }}
            >
              {Number(d.slice(-2))}
            </button>
          ))}
        </div>
        <div className="choices">
          {matching
            .filter(
              (s) =>
                DateTime.fromISO(s.starts_at)
                  .setZone("America/New_York")
                  .toISODate() === day,
            )
            .map((s) => (
              <button
                key={s.id}
                aria-pressed={slot === s.id}
                onClick={() => setSlot(s.id)}
              >
                {DateTime.fromISO(s.starts_at)
                  .setZone("America/New_York")
                  .toFormat("h:mm a")}{" "}
                · {s.remaining} left
              </button>
            ))}
        </div>
      </section>
      <form onSubmit={submit}>
        <h2>3. Parent and athlete details</h2>
        {[
          ["parent", "Parent / guardian name"],
          ["athlete", "Athlete name"],
          ["email", "Parent email"],
          ["phone", "Parent phone"],
        ].map(([name, label]) => (
          <label key={name}>
            {label}
            <input
              name={name}
              required
              maxLength={name === "email" ? 254 : name === "phone" ? 30 : 100}
              type={
                name === "email" ? "email" : name === "phone" ? "tel" : "text"
              }
              autoComplete={
                name === "email"
                  ? "email"
                  : name === "phone"
                    ? "tel"
                    : undefined
              }
            />
          </label>
        ))}
        <p>
          Your time is held during checkout. Payment is securely processed by
          Stripe. We collect only the contact details needed for training.
        </p>
        <button disabled={!slot || busy}>
          {credit ? "Book using package credit" : "Continue to secure payment"}
        </button>
      </form>
      <section>
        <h2>Existing booking options</h2>
        <p>
          Our existing booking service remains available while native booking is
          being verified.
        </p>
        <a href="https://calendly.com/taenextlevelqbs/individual-training-clone">
          Book private training
        </a>{" "}
        ·{" "}
        <a href="https://calendly.com/taenextlevelqbs/group-training">
          Book group training
        </a>
      </section>
    </main>
  );
}

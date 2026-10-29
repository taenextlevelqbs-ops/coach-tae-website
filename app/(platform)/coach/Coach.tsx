"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QuizEditor from "./QuizEditor";
import { api } from "@/lib/platform/browser";
import { entitled } from "@/lib/platform/catalog";
import type {
  Athlete,
  Booking,
  Lesson,
  Membership,
  Order,
  Slot,
} from "@/lib/platform/types";
import { message, useNow } from "../usePortal";
type Rule = {
  id: string;
  kind: string;
  weekday: number;
  local_start: string;
  timezone: string;
  capacity: number;
  active: boolean;
  duration_minutes: number;
  buffer_minutes: number;
};
type Block = { id: string; starts_at: string; ends_at: string; reason: string };
type Job = {
  id: string;
  kind: string;
  attempts: number;
  last_error: string | null;
  completed_at: string | null;
  created_at: string;
  run_at: string;
  family_id: string;
};
type Settings = {
  timezone: string;
  cancellation_hours: number;
  reschedule_hours: number;
  notice_hours: number;
  location: string;
};
type Admin = {
  ct_athletes: Athlete[];
  ct_bookings: (Booking & {
    family_id: string;
    ct_athletes: { name: string };
  })[];
  ct_slots: Slot[];
  ct_rules: Rule[];
  ct_blocks: Block[];
  ct_orders: Order[];
  ct_invoices: {
    invoice_id: string;
    family_id: string;
    amount_paid: number;
    currency: string;
    status: string;
    created_at: string;
  }[];
  ct_credits: { family_id: string; kind: string; delta: number }[];
  ct_memberships: (Membership & { family_id: string })[];
  ct_lessons: Lesson[];
  ct_outbox: Job[];
  ct_settings: Settings[];
  ct_credit_recovery?: { family_id: string; kind: string; units: number }[];
};
export default function Coach() {
  const now = useNow();
  const [data, setData] = useState<Admin | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [tab, setTab] = useState("Overview");
  const [lesson, setLesson] = useState<Partial<Lesson>>({
      title: "",
      body: "",
      category: "football_iq",
      published: false,
    }),
    [questions, setQuestions] = useState("[]");
  const refresh = useCallback(async () => {
    try {
      const value = await api<Admin>("admin");
      setData(value);
      setError("");
    } catch (e) {
      setError(message(e));
    }
  }, []);
  useEffect(() => {
    let active = true;
    api<Admin>("admin")
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
  }, []);
  async function action(path: string, body: unknown) {
    setBusy(true);
    setNotice("");
    try {
      const r = await api<{ created?: number }>(`admin/${path}`, body);
      setNotice(
        r.created !== undefined
          ? `Published ${r.created} new sessions. Existing bookings were preserved. Conflicting rules and blocked times are skipped.`
          : "Saved.",
      );
      await refresh();
      return true;
    } catch (e) {
      setNotice(message(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (error)
    return (
      <p role="alert" className="notice error">
        {error}
      </p>
    );
  if (!data) return <p role="status">Verifying coach access…</p>;
  const upcoming = data.ct_bookings
      .filter(
        (b) =>
          b.status === "confirmed" && Date.parse(b.ct_slots.starts_at) > now,
      )
      .sort(
        (a, b) =>
          Date.parse(a.ct_slots.starts_at) - Date.parse(b.ct_slots.starts_at),
      ),
    failed = data.ct_outbox.filter((j) => !j.completed_at && j.attempts > 0);
  const revenue =
    data.ct_orders
      .filter((o) => o.status === "paid" && !o.product_key.startsWith("lab_"))
      .reduce((sum, o) => sum + (o.amount || 0) - (o.refunded_amount || 0), 0) +
    data.ct_invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.amount_paid, 0);
  const balances = Object.values(
    data.ct_credits.reduce<
      Record<string, { family: string; private: number; group: number }>
    >((r, c) => {
      const b = (r[c.family_id] ||= {
        family: c.family_id,
        private: 0,
        group: 0,
      });
      b[c.kind as "private" | "group"] += c.delta;
      return r;
    }, {}),
  );
  return (
    <div className="stack">
      <div className="row between">
        <p className="notice">
          Staging workflow · Stripe test mode only. Reports below show at most
          1,000 rows per dataset; they are operational summaries, not accounting
          statements.
        </p>
        <button className="secondary" onClick={refresh}>
          Refresh dashboard
        </button>
      </div>
      <div className="tabs" aria-label="Dashboard sections">
        {[
          "Overview",
          "Schedule",
          "Athletes",
          "Payments",
          "Packages & memberships",
          "QB Lab",
          "Notifications",
        ].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {tab === "Overview" && (
        <>
          <div className="grid-3">
            <div className="panel">
              <p className="eyebrow">Upcoming sessions</p>
              <div className="credit">{upcoming.length}</div>
            </div>
            <div className="panel">
              <p className="eyebrow">Active memberships</p>
              <div className="credit">
                {
                  data.ct_memberships.filter((m) =>
                    entitled(m.status, m.access_until),
                  ).length
                }
              </div>
            </div>
            <div className="panel">
              <p className="eyebrow">Recorded paid volume · USD</p>
              <div className="price">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(revenue / 100)}
              </div>
              <p className="muted">
                Excludes fully refunded one-time orders. Subscription invoice
                totals are gross before refunds, fees and disputes.
              </p>
            </div>
          </div>
          <section className="panel">
            <h2>Next on the field</h2>
            {upcoming.slice(0, 15).map((b) => (
              <div key={b.id} className="record">
                <strong>
                  {b.ct_athletes.name} · {b.ct_slots.kind}
                </strong>
                <p className="muted">
                  {new Date(b.ct_slots.starts_at).toLocaleString()} · {b.id}
                </p>
              </div>
            ))}
            {!upcoming.length && (
              <p className="muted">No upcoming confirmed sessions.</p>
            )}
          </section>
        </>
      )}
      {tab === "Schedule" && (
        <section className="panel stack">
          <h2>Availability & Schedule</h2>
          <p className="muted">
            Manage weekly windows, one-time sessions, vacations and family
            bookings on your visual Eastern-time calendar.
          </p>
          <Link href="/coach/schedule" className="button">
            Open Availability & Schedule
          </Link>
        </section>
      )}
      {tab === "Athletes" && (
        <section className="panel">
          <h2>Athlete directory</h2>
          {data.ct_athletes.map((a) => (
            <div className="record" key={a.id}>
              <h3>
                {a.name}{" "}
                {a.graduation_year ? `· Class of ${a.graduation_year}` : ""}
              </h3>
              <p className="muted">Family reference: {a.family_id}</p>
              <p className="muted">
                {
                  data.ct_bookings.filter(
                    (b) => b.athlete_id === a.id && b.status === "confirmed",
                  ).length
                }{" "}
                confirmed sessions
              </p>
            </div>
          ))}
        </section>
      )}
      {tab === "Payments" && (
        <section className="panel">
          <h2>Payments & subscription invoices</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product / invoice</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.ct_orders.map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      {o.product_key}
                      <br />
                      {o.id}
                    </td>
                    <td>
                      {o.status}
                      {o.refunded_amount
                        ? ` · $${(o.refunded_amount / 100).toFixed(2)} refunded`
                        : ""}
                    </td>
                    <td>
                      {o.amount === null
                        ? "Pending"
                        : `$${(o.amount / 100).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
                {data.ct_invoices.map((i) => (
                  <tr key={i.invoice_id}>
                    <td>{new Date(i.created_at).toLocaleDateString()}</td>
                    <td>{i.invoice_id}</td>
                    <td>{i.status}</td>
                    <td>
                      {i.currency.toUpperCase()}{" "}
                      {(i.amount_paid / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">
            Use Stripe for authoritative settlements, disputes, partial refunds
            and tax reporting. Subscription invoice rows include renewals.
          </p>
        </section>
      )}
      {tab === "Packages & memberships" && (
        <div className="grid">
          <section className="panel">
            <h2>Family credit balances</h2>
            {data.ct_credit_recovery
              ?.filter((r) => r.units > 0)
              .map((r) => (
                <div className="notice" key={`${r.family_id}-${r.kind}`}>
                  Family {r.family_id}: {r.units} {r.kind} credit adjustment
                  remaining after a refunded, partially redeemed purchase.
                  Spendable balances remain nonnegative.
                </div>
              ))}
            {balances.map((b) => (
              <div className="record" key={b.family}>
                <p className="muted">{b.family}</p>
                <strong>
                  {b.private} private · {b.group} group
                </strong>
                {(b.private < 0 || b.group < 0) && (
                  <p className="notice error">
                    Credits were refunded after redemption. Resolve this balance
                    with the family before another booking.
                  </p>
                )}
              </div>
            ))}
          </section>
          <section className="panel">
            <h2>Memberships</h2>
            {data.ct_memberships.map((m) => (
              <div className="record" key={m.subscription_id}>
                <span className="badge">{m.status}</span>
                <p className="muted">Family: {m.family_id}</p>
                <p>Paid through: {new Date(m.access_until).toLocaleString()}</p>
                <p className="muted">
                  {m.cancel_at_period_end
                    ? "Cancels at period end"
                    : "Not scheduled to cancel"}
                </p>
              </div>
            ))}
          </section>
        </div>
      )}
      {tab === "QB Lab" && (
        <div className="grid">
          <section className="panel stack">
            <h2>{lesson.id ? "Edit lesson" : "Publish your expertise"}</h2>
            <p className="muted">
              Original curriculum and coach edits are managed here. Lesson text
              is displayed safely as plain text. Quiz answers are checked on the
              server.
            </p>
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                let parsed;
                try {
                  parsed = JSON.parse(questions);
                } catch {
                  setNotice("Quiz questions must be valid JSON.");
                  return;
                }
                await action("lesson", { ...lesson, questions: parsed });
              }}
            >
              <label>
                Title
                <input
                  required
                  maxLength={160}
                  value={lesson.title || ""}
                  onChange={(e) =>
                    setLesson({ ...lesson, title: e.target.value })
                  }
                />
              </label>
              <label>
                Category
                <select
                  value={lesson.category}
                  onChange={(e) =>
                    setLesson({ ...lesson, category: e.target.value })
                  }
                >
                  <option value="football_iq">Football IQ</option>
                  <option value="stretching">Stretching</option>
                  <option value="development">Development</option>
                  <option value="quiz">Quiz</option>
                </select>
              </label>
              <div className="row">
                <label>
                  Learning path
                  <select
                    value={lesson.level || "beginner"}
                    onChange={(e) =>
                      setLesson({
                        ...lesson,
                        level: e.target.value as
                          "beginner" | "intermediate" | "advanced",
                      })
                    }
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
                <label>
                  Topic
                  <input
                    value={lesson.topic || "Fundamentals"}
                    maxLength={80}
                    onChange={(e) =>
                      setLesson({ ...lesson, topic: e.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                Diagram
                <select
                  value={lesson.diagram || ""}
                  onChange={(e) =>
                    setLesson({ ...lesson, diagram: e.target.value || null })
                  }
                >
                  {[
                    "",
                    "cover0",
                    "cover1",
                    "cover2",
                    "cover3",
                    "cover4",
                    "cover6",
                    "rotation",
                    "pocket",
                    "slant-flat",
                    "stick",
                    "snag",
                    "mesh",
                    "smash",
                    "flood",
                    "verticals",
                    "levels",
                    "curl-flat",
                  ].map((d) => (
                    <option value={d} key={d}>
                      {d || "No diagram"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Lesson text
                <textarea
                  required
                  maxLength={20000}
                  value={lesson.body || ""}
                  onChange={(e) =>
                    setLesson({ ...lesson, body: e.target.value })
                  }
                />
              </label>
              <QuizEditor value={questions} onChange={setQuestions} />
              <label className="radio">
                <input
                  type="checkbox"
                  checked={lesson.published || false}
                  onChange={(e) =>
                    setLesson({ ...lesson, published: e.target.checked })
                  }
                />
                Publish to active members
              </label>
              <button disabled={busy}>Save lesson</button>
            </form>
          </section>
          <section className="panel stack">
            <h2>Content library</h2>
            <button
              className="secondary"
              onClick={() => {
                setLesson({
                  title: "",
                  body: "",
                  category: "football_iq",
                  published: false,
                });
                setQuestions("[]");
              }}
            >
              Create another lesson
            </button>
            {data.ct_lessons.map((l) => (
              <div className="record" key={l.id}>
                <h3>{l.title}</h3>
                <p className="muted">
                  {l.category} · {l.published ? "Published" : "Draft"}
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    setLesson(l);
                    setQuestions(JSON.stringify(l.questions, null, 2));
                  }}
                >
                  Edit lesson
                </button>
              </div>
            ))}
          </section>
        </div>
      )}
      {tab === "Notifications" && (
        <section className="panel">
          <h2>Delivery queue</h2>
          <p className="muted">
            {failed.length} deliveries currently need retries or attention. Jobs
            retry with backoff up to 12 attempts. This queue includes automated
            refunds. Scheduled reminders are skipped if a booking changed.
          </p>
          {data.ct_outbox
            .filter((j) => !j.completed_at)
            .map((j) => (
              <div key={j.id} className="record">
                <h3>{j.kind}</h3>
                <p className="muted">
                  Attempts: {j.attempts} · Due:{" "}
                  {new Date(j.run_at).toLocaleString()}
                </p>
                {j.last_error && <p className="notice error">{j.last_error}</p>}
                {j.attempts > 0 && (
                  <button
                    disabled={busy}
                    className="secondary"
                    onClick={() => action("retry", { id: j.id })}
                  >
                    Retry delivery
                  </button>
                )}
              </div>
            ))}
        </section>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/platform/browser";
import { entitled } from "@/lib/platform/catalog";
import type { Lesson } from "@/lib/platform/types";
import { usePortal, message } from "../usePortal";
import Purchase from "../Purchase";
import FieldDiagram from "./FieldDiagram";
import { achievements } from "@/lib/platform/learning";
function LessonCard({
  lesson,
  athlete,
  completed,
  onComplete,
}: {
  lesson: Lesson;
  athlete: string;
  completed?: { score: number | null };
  onComplete: () => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({}),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [feedback, setFeedback] = useState<
    {
      prompt: string;
      correct: boolean;
      correct_option: string;
      explanation: string;
    }[]
  >([]);
  async function complete(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const r = await api<{
        score: number | null;
        feedback?: {
          prompt: string;
          correct: boolean;
          correct_option: string;
          explanation: string;
        }[];
      }>("progress", {
        athlete_id: athlete,
        lesson_id: lesson.id,
        answers: lesson.questions.map((_, i) => answers[i]),
      });
      setNotice(
        r.score === null
          ? "Lesson marked complete."
          : `Quiz complete · ${r.score}%`,
      );
      setFeedback(r.feedback || []);
      await onComplete();
    } catch (e) {
      setNotice(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="panel stack" id={`lesson-${lesson.id}`}>
      <div className="row between">
        <span className="badge">{lesson.category.replaceAll("_", " ")}</span>
        {completed && (
          <span className="badge">
            Completed {completed.score !== null ? `· ${completed.score}%` : ""}
          </span>
        )}
      </div>
      <h2>{lesson.title}</h2>
      {lesson.diagram && <FieldDiagram name={lesson.diagram} />}
      <div className="lesson-body">{lesson.body}</div>
      <form className="stack" onSubmit={complete}>
        {lesson.questions.map((q, i) => (
          <fieldset key={i}>
            <legend>
              {i + 1}. {q.prompt}
            </legend>
            {q.options.map((option, j) => (
              <label className="radio" key={j}>
                <input
                  type="radio"
                  name={`${lesson.id}-${i}`}
                  required
                  checked={answers[i] === j}
                  onChange={() => setAnswers({ ...answers, [i]: j })}
                />
                {option}
              </label>
            ))}
          </fieldset>
        ))}
        <button disabled={busy || !athlete}>
          {busy
            ? "Saving progress…"
            : lesson.questions.length
              ? "Submit quiz"
              : "Mark lesson complete"}
        </button>
        {!athlete && (
          <p className="muted">
            Add an athlete in the family portal to track progress.
          </p>
        )}
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
      </form>
      {feedback.map((f, i) => (
        <div className="feedback" key={i}>
          <h3>
            {f.correct ? "Correct" : "Review this read"}: {f.prompt}
          </h3>
          <p>
            <strong>Answer:</strong> {f.correct_option}
          </p>
          <p className="muted">{f.explanation}</p>
        </div>
      ))}
    </article>
  );
}
export default function Lab() {
  const { data, error, refresh } = usePortal();
  const [lessons, setLessons] = useState<Lesson[]>([]),
    [inventory, setInventory] = useState<{ title: string; category: string }[]>(
      [],
    ),
    [loadError, setLoadError] = useState(""),
    [athlete, setAthlete] = useState(""),
    [loaded, setLoaded] = useState(false),
    [path, setPath] = useState("beginner"),
    [topic, setTopic] = useState("all"),
    [lessonId, setLessonId] = useState("");
  const active =
    !!data?.memberships.some((m) => entitled(m.status, m.access_until)) ||
    !!data?.isCoach;
  useEffect(() => {
    let current = true;
    api<{ lessons: { title: string; category: string }[] }>("library")
      .then((r) => {
        if (current) setInventory(r.lessons);
      })
      .catch((e) => {
        if (current) setLoadError(message(e));
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    if (!active) return;
    let current = true;
    api<{ lessons: Lesson[] }>("lessons")
      .then((r) => {
        if (current) {
          setLessons(r.lessons);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (current) {
          setLoadError(message(e));
          setLoaded(true);
        }
      });
    return () => {
      current = false;
    };
  }, [active]);
  if (error)
    return (
      <p role="alert" className="notice error">
        {error}
      </p>
    );
  if (!data) return <p role="status">Loading membership…</p>;
  const athleteId = athlete || data.athletes[0]?.id || "";
  const athleteProgress = data.progress.filter(
    (p) => p.athlete_id === athleteId,
  );
  const badges = achievements(lessons, athleteProgress);
  const filtered = lessons.filter(
    (l) =>
      (l.level || "beginner") === path &&
      (topic === "all" || l.topic === topic),
  );
  const currentLesson = filtered.find((l) => l.id === lessonId) || filtered[0];
  return (
    <div className="stack">
      {loadError && (
        <p className="notice error" role="alert">
          {loadError}
        </p>
      )}
      {active ? (
        <>
          <div className="row between">
            <span className="badge">QB Lab · Member access</span>
            <Link className="inline-link" href="/portal">
              Manage membership
            </Link>
          </div>
          <label>
            Track progress for
            <select
              value={athleteId}
              onChange={(e) => setAthlete(e.target.value)}
            >
              {!data.athletes.length && (
                <option value="">Add an athlete in your portal</option>
              )}
              {data.athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            {data.progress.filter((p) => p.athlete_id === athleteId).length}{" "}
            lessons completed by this athlete.
          </p>
          <div className="grid-3">
            {["beginner", "intermediate", "advanced"].map((level) => (
              <button
                className="panel path-card"
                aria-pressed={path === level}
                key={level}
                onClick={() => {
                  setPath(level);
                  setTopic("all");
                  setLessonId("");
                }}
              >
                <span>{level[0].toUpperCase() + level.slice(1)} path</span>
                <small>
                  {
                    lessons.filter((l) => (l.level || "beginner") === level)
                      .length
                  }{" "}
                  lessons
                </small>
              </button>
            ))}
          </div>
          {badges.length > 0 && (
            <section className="panel stack">
              <h2>Earned achievements</h2>
              <div className="row">
                {badges.map((b) => (
                  <span className="badge" key={b.name} title={b.description}>
                    {b.name}
                  </span>
                ))}
              </div>
              <p className="muted">
                Earned from your athlete’s recorded progress. Quiz lessons
                require at least 70% to count toward badges.
              </p>
            </section>
          )}
          <label>
            Topic
            <select
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setLessonId("");
              }}
            >
              <option value="all">All topics</option>
              {Array.from(
                new Set(lessons.map((l) => l.topic).filter(Boolean)),
              ).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          {filtered.length > 0 && (
            <nav className="lesson-index" aria-label="Lesson index">
              {filtered.map((l) => (
                <a
                  href={`#lesson-${l.id}`}
                  key={l.id}
                  onClick={() => setLessonId(l.id)}
                  aria-current={currentLesson?.id === l.id ? "step" : undefined}
                >
                  {athleteProgress.some((p) => p.lesson_id === l.id)
                    ? "✓ "
                    : ""}
                  {l.title}
                </a>
              ))}
            </nav>
          )}
          {loaded && lessons.length > 0 && !filtered.length && (
            <p className="notice">
              No published lessons match this path and topic. Choose another
              topic.
            </p>
          )}
          {!loaded ? (
            <p role="status">Loading your lessons…</p>
          ) : lessons.length ? (
            (currentLesson ? [currentLesson] : []).map((l) => (
              <LessonCard
                key={`${l.id}-${athleteId}`}
                lesson={l}
                athlete={athleteId}
                onComplete={refresh}
                completed={data.progress.find(
                  (p) => p.athlete_id === athleteId && p.lesson_id === l.id,
                )}
              />
            ))
          ) : (
            <div className="notice">
              Coach Tae has not published any QB Lab lessons yet. No sample
              lessons or educational content have been invented.
            </div>
          )}
        </>
      ) : (
        <>
          <section className="panel">
            <h2>Inside the Lab</h2>
            {inventory.length ? (
              <div className="stack">
                {inventory.map((l, i) => (
                  <div className="record" key={i}>
                    <span className="badge">
                      {l.category.replaceAll("_", " ")}
                    </span>
                    <h3>{l.title}</h3>
                  </div>
                ))}
              </div>
            ) : (
              <p className="notice">
                The content library is being prepared. Membership purchases stay
                closed until Coach Tae publishes content.
              </p>
            )}
          </section>
          <div className="grid">
            <div className="panel stack">
              <p className="eyebrow">Monthly membership</p>
              <div className="price">
                $9.99<span className="muted"> / month</span>
              </div>
              <p className="muted">
                Access to all published premium lessons. Renews monthly; manage
                cancellation in Stripe.
              </p>
              {inventory.length > 0 && (
                <Purchase product="lab_monthly">
                  Start monthly membership
                </Purchase>
              )}
            </div>
            <div className="panel stack">
              <p className="eyebrow">Annual membership</p>
              <div className="price">
                $79.99<span className="muted"> / year</span>
              </div>
              <p className="muted">
                A full year of access to published premium lessons. Renews
                annually; manage cancellation in Stripe.
              </p>
              {inventory.length > 0 && (
                <Purchase product="lab_annual">
                  Start annual membership
                </Purchase>
              )}
            </div>
          </div>
          {data.memberships.length > 0 && (
            <p className="notice">
              If a subscription needs payment or billing changes, use{" "}
              <Link href="/portal" className="inline-link">
                Manage billing in your family portal
              </Link>{" "}
              to restore access.
            </p>
          )}
          <p className="auth-note">
            Payments are handled by Stripe. New paid subscriptions require verified payment configuration.
          </p>
        </>
      )}
    </div>
  );
}

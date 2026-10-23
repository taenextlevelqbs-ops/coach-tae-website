"use client";
import { useState } from "react";
import Link from "next/link";
import { TrainingHeader } from "./AthleteUI";
import type { TrainingItem } from "./types";
import { useDemo } from "../LabShell";
import { useLocalLab } from "../platform/store";
import { nextStep } from "../platform/next-step";

export function WorkoutLibrary({ categories, drills }: {
  categories: readonly { slug: string; title: string; description: string }[];
  drills: Pick<TrainingItem, "slug" | "title" | "category" | "duration">[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const { profile, pathway } = useDemo();
  const { state } = useLocalLab();
  const next = nextStep(state, pathway, profile.id);
  const category = categories.find((item) => item.slug === selected);
  const items = drills.filter((item) => item.category === category?.title);
  return (
    <div className="train-page">
      <TrainingHeader title="Workouts" subtitle="Let's get some work in." backHref="/qb-lab" backLabel="Home" />
      <div className="train-category-grid" role="group" aria-label="Workout categories">
        {categories.map((item) => (
          <button
            key={item.slug}
            type="button"
            className="train-category"
            aria-pressed={selected === item.slug}
            aria-controls="workout-drills"
            onClick={() => setSelected(item.slug)}
          >
            <span><strong>{item.title}</strong><small className="train-muted">{item.description}</small></span>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <section id="workout-drills" className="train-list" aria-label="Workout drills">
        {category ? <>
          <h2>{category.title}</h2>
          {items.map((item) => (
            <Link key={item.slug} href={`/qb-lab/workouts/${item.slug}`} className="train-drill-link">
              <span><strong>{item.title}</strong><small className="train-muted">{item.duration}</small></span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </> : <p className="train-muted">Choose a category, then open one drill. Every drill has written steps; no video is needed.</p>}
      </section>
      <p className="train-muted">Instruction drafts await Coach Tae&apos;s review. Your coach sets the reps and training time for your age and experience. Start gently, use clear space and stop for pain.</p>
      <details className="train-details">
        <summary>Recommended practice</summary>
        <div>
          <p className="train-eyebrow">{next.label} · browser demo</p>
          <h2>{next.title}</h2>
          <p>{next.why}</p>
          <Link className="train-button" href={next.href}>Open recommended practice</Link>
        </div>
      </details>
      <nav className="train-list" aria-label="More training">
        <Link href="/qb-lab/recovery" className="train-drill-link"><span>Recovery · Stretch &amp; reset</span><span aria-hidden="true">→</span></Link>
        <Link href="/qb-lab/film" className="train-drill-link"><span>Film Room · Coach feedback preview</span><span aria-hidden="true">→</span></Link>
      </nav>
    </div>
  );
}

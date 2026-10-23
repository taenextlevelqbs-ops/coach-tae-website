"use client";
import { useState } from "react";
import Link from "next/link";
import { recoveryCategories, recoveryExercises } from "./recovery";

export function RecoveryLibrary() {
  const [category, setCategory] = useState<string | null>(null);
  const items = recoveryExercises.filter((item) => item.category === category);
  return (
    <div className="train-page">
      <header className="train-header">
        <Link href="/qb-lab/workouts" className="train-back">← Train</Link>
        <h1>Recovery</h1>
        <p>Take care of your body.</p>
      </header>
      <div className="train-category-grid" role="group" aria-label="Recovery categories">
        {recoveryCategories.map((name) => (
          <button key={name} type="button" className="train-category" aria-pressed={category === name} aria-controls="recovery-exercises" onClick={() => setCategory(name)}>
            <strong>{name}</strong><span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <section id="recovery-exercises" className="train-list" aria-label="Recovery exercises">
        {category ? <>
          <h2>{category}</h2>
          {items.map((item) => (
            <Link key={item.slug} href={`/qb-lab/recovery/${item.slug}`} className="train-drill-link">
              <span><strong>{item.title}</strong><small className="train-muted">{item.duration} · Draft movement study</small></span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </> : <p className="train-muted">Choose a category to find a gentle movement study or a recovery conversation.</p>}
      </section>
      <p className="train-muted">Draft content awaiting Coach Tae and qualified exercise review. No rehabilitation or prescribed routine. Younger athletes should review movements with a trusted adult. Stop for pain; tell a parent/guardian and ask a qualified healthcare professional about pain or injury.</p>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useDemo } from "./LabShell";
export function DemoSession() {
  const { profile } = useDemo();
  return (
    <section className="app-profile-page">
      <h1>Let’s read the starting picture.</h1>
      <p>
        Sample session for {profile.name} · About 10 minutes, at your own pace.
      </p>
      <p>
        The dashboard’s Cover 2 assignment is a synthetic preview of future
        coaching. The available Football IQ exercise teaches visible safeties
        and why a two-high shell does not confirm Cover 2. A full coverage
        lesson requires coaching review; it is not published here.
      </p>
      <div className="app-session-steps">
        <article>
          <h2>Look at the safeties</h2>
          <p>
            Explore the existing animated field study. Count the deep defenders
            and notice what changes.
          </p>
          <Link className="app-primary-button" href="/qb-lab/iq">
            Open Football IQ →
          </Link>
        </article>
        <article>
          <h2>Slow down your setup</h2>
          <p>
            Follow the short footwork walkthrough with an adult or coach. No
            prescribed throws, exertion or load.
          </p>
          <Link
            className="app-primary-button"
            href={`/qb-lab/workouts?activity=footwork&profile=${profile.id}`}
          >
            Open footwork drill →
          </Link>
        </article>
      </div>
      <Link href="/qb-lab/progress">See recorded activity →</Link>
    </section>
  );
}

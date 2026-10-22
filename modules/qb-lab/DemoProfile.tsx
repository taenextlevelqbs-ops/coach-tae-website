"use client";
import Link from "next/link";
import { useDemo } from "./LabShell";
export function DemoProfile() {
  const { profile } = useDemo();
  return (
    <section className="app-profile-page">
      <h1>{profile.name}’s profile</h1>
      <p>
        {profile.pathway === "flag" ? "Flag football" : "Tackle football"} · Age{" "}
        {profile.age} · Synthetic demo athlete {profile.id}
      </p>
      <p>
        Change the demo athlete in the top bar. These sample identities are not
        real accounts. Local activity is saved only in this browser; no personal
        information, private uploads or payments.
      </p>
      <div className="app-profile-links">
        {[
          ["progress", "Progress Center"],
          ["family", "Family Hub"],
          ["coach", "Coach demonstration"],
          ["access", "Account and privacy status"],
          ["mechanics", "2D mechanics trainer"],
          ["workouts", "Guided workouts"],
        ].map(([href, label]) => (
          <Link key={href} href={`/qb-lab/${href}`}>
            {label} →
          </Link>
        ))}
      </div>
    </section>
  );
}

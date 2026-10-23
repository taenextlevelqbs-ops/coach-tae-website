"use client";
import Link from "next/link";
import { PathwaySwitch, useDemo } from "./LabShell";
import { demoProfiles } from "./demo-profile-store";
import { PwaInstall } from "./PwaInstall";
export function DemoProfile() {
  const { profile, pathway, selectProfile } = useDemo();
  return (
    <section className="app-profile-page">
      <div className="lab-page-heading"><div><h1>Profile</h1><p className="lab-lede">Your training space.</p></div></div>
      <section className="lab-panel" aria-label="Demonstration profile">
        <h2>{profile.name}</h2>
        <p>{pathway === "flag" ? "Flag football" : "Tackle football"} · Age {profile.age} · Demo athlete</p>
        <label className="lab-profile-select">Choose a demo athlete
          <select aria-label="Choose a demo athlete" value={profile.id} onChange={(e) => selectProfile(e.target.value)}>
            {demoProfiles.map((p) => <option key={p.id} value={p.id}>{p.name} · demo</option>)}
          </select>
        </label>
        <PathwaySwitch />
        <p>These fixed sample profiles are not real accounts. Training history stays in this browser. No personal information, private videos or payments are accepted.</p>
      </section>
      <h2>Your training</h2>
      <div className="app-profile-links">
        {[
          ["progress", "Progress Center"],
          ["workouts", "Workouts"],
          ["recovery", "Recovery"],
          ["film", "Film Room"],
          ["simulator", "QB Simulator"],
          ["family", "Family Hub"],
        ].map(([href, label]) => (
          <Link key={href} href={`/qb-lab/${href}`}>
            {label} →
          </Link>
        ))}
      </div>
      <details className="lab-panel secondary-details">
        <summary>More training tools</summary>
        <div className="app-profile-links">
          <Link href="/qb-lab/iq">Football IQ →</Link>
          <Link href="/qb-lab/playbook">Playbook Studio →</Link>
          <Link href="/qb-lab/mechanics">2D mechanics trainer →</Link>
          <Link href="/qb-lab/coach">Coach demonstration →</Link>
          <Link href="/qb-lab/access">Account and privacy status →</Link>
        </div>
      </details>
      <section className="lab-panel" aria-label="Install QB LAB"><PwaInstall /></section>
    </section>
  );
}

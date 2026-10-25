"use client";
import Link from "next/link";
import { AppIcon } from "../AppIcon";
import { useDemo } from "../LabShell";

const modes = [
  { id: "learn", title: "Learn", description: "Understand what you're seeing.", detail: "Pause, look at the defense, then move through one play at a time.", action: "Start learning" },
  { id: "practice", title: "Practice", description: "Run quarterback scenarios.", detail: "Move, choose a receiver and review what happened. Retry at your own pace.", action: "Start practice" },
  { id: "challenge", title: "Challenge", description: "Test your decision-making.", detail: "Try a continuous rep. Scored challenges and a difficulty curriculum are not available yet.", action: "Try challenge preview" },
] as const;

export function SimulatorHome() {
  const { profile } = useDemo();
  return <div className="train-page">
    <header className="train-header">
      <h1>QB Simulator</h1>
      <p>See the defense. Make the read. Execute the play.</p>
    </header>
    <p className="train-demo-note">Demonstration for {profile.name} · Ages 8–college. Start with Learn if you are new; advanced coverage and protection tools remain available inside each mode. Coach review of these teaching examples is pending.</p>
    <section className="train-mode-grid" aria-label="Simulator modes">
      {modes.map(mode => <Link key={mode.id} className="train-mode-card" href={`/qb-lab/simulator/engine?mode=${mode.id}`} aria-label={mode.action}>
        <AppIcon name="simulator" />
        <h2>{mode.title}{mode.id === "challenge" && <small> Preview</small>}</h2>
        <p>{mode.description}</p>
        <p>{mode.detail}</p>
        <span className="train-button">{mode.action} <span aria-hidden="true">→</span></span>
      </Link>)}
    </section>
    <p className="train-demo-note">The starter rep teaches tackle football. Flag and non-contact passing 7v7 use separate event settings. Confirm the selected rules in Advanced Settings before playing either format.</p>
    <nav className="train-inline-links" aria-label="More football training">
      <Link className="train-back" href="/qb-lab/iq">Study Football IQ</Link>
      <Link className="train-back" href="/qb-lab/playbook">Open Playbook Studio</Link>
      <Link className="train-back" href="/qb-lab/simulator/spacing">Recognition &amp; spacing tools</Link>
    </nav>
  </div>;
}

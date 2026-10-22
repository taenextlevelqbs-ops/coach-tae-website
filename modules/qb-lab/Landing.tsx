"use client";
import { useState } from "react";
import Link from "next/link";
import { Field } from "./Field";
import { PathwaySwitch, useDemo } from "./LabShell";
import { ActivityDesk } from "./platform/ActivityDesk";
export function Landing() {
  const { pathway } = useDemo();
  const [moment, setMoment] = useState(0);
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">THE LAB / SYNTHETIC PRACTICE WORKSPACE</p>
          <h1>Your next rep has a home.</h1>
          <p className="lab-lede">
            Build a play. Test a decision. Review the moment. Keep an honest
            record of the work you complete in this browser.
          </p>
        </div>
        <PathwaySwitch />
      </div>
      <ActivityDesk />
      <div className="lab-home-workspace">
        <section className="lab-panel">
          <p className="lab-kicker">START WITH A FIELD STUDY</p>
          <h2>See the change before you choose.</h2>
          <Field pathway={pathway} progress={moment} routes={false} />
          <label className="lab-slider-label">
            Scrub the observation{" "}
            <input
              aria-label="Cover illustration timeline"
              type="range"
              min="0"
              max="100"
              value={moment}
              onChange={(e) => setMoment(Number(e.target.value))}
            />
          </label>
          <p>
            {moment < 40
              ? "Starting shell. Observe the depth."
              : "02 / Watch the picture change."}
          </p>
          <Link className="lab-button primary" href="/qb-lab/athlete">
            Start your first session →
          </Link>
        </section>
        <section className="lab-app-launcher" aria-label="Practice tools">
          {[
            [
              "/simulator",
              "QB Simulator",
              "Move the QB, run the timeline and choose a target.",
            ],
            [
              "/playbook",
              "Playbook Studio",
              "Edit formations and route points. Run saved plays.",
            ],
            [
              "/workouts",
              "Guided activities",
              "Follow steps and record local completion.",
            ],
            [
              "/mechanics",
              "Mechanics Studio",
              "Inspect an animated 2D sequence, phase by phase.",
            ],
            [
              "/film",
              "Film Room",
              "Tag illustrated moments and assign a correction.",
            ],
            [
              "/progress",
              "Progress Center",
              "Actual local history, goals, export and reset.",
            ],
          ].map(([href, title, text]) => (
            <Link key={href} href={"/qb-lab" + href}>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </section>
      </div>
      <aside className="lab-callout">
        <span aria-hidden="true">→</span>
        <div>
          <h2>Accounts and private film are not open.</h2>
          <p>
            Use only synthetic data in the prototype. Guardian verification,
            consent and private coaching require the secure backend to be
            provisioned and tested.
          </p>
          <Link className="lab-text-link" href="/qb-lab/access">
            Private-service status →
          </Link>
        </div>
      </aside>
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Pathway } from "./demo";

const nav = [
  ["/qb-lab", "Overview", "01"],
  ["/qb-lab/athlete", "Athlete studio", "02"],
  ["/qb-lab/iq", "Football IQ", "03"],
  ["/qb-lab/film", "Film room", "04"],
  ["/qb-lab/family", "Family hub", "05"],
];
const DemoContext = createContext<{
  pathway: Pathway;
  setPathway: (value: Pathway) => void;
} | null>(null);
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("QB LAB demo provider is required");
  return context;
}
export function PathwaySwitch() {
  const { pathway, setPathway } = useDemo();
  return (
    <fieldset className="lab-switch">
      <legend className="lab-sr">Football pathway</legend>
      {(["tackle", "flag"] as const).map((value) => (
        <label key={value} className={pathway === value ? "selected" : ""}>
          <input
            type="radio"
            name="pathway"
            value={value}
            checked={pathway === value}
            onChange={() => setPathway(value)}
          />
          {value === "tackle" ? "Tackle" : "Flag"}
        </label>
      ))}
    </fieldset>
  );
}
export function LabShell({ children }: { children: ReactNode }) {
  const current = usePathname();
  const [pathway, setPathway] = useState<Pathway>("tackle");
  return (
    <DemoContext.Provider value={{ pathway, setPathway }}>
      <div className="qb-lab">
        <a className="lab-skip" href="#lab-main">
          Skip to QB LAB content
        </a>
        <aside className="lab-rail">
          <Link href="/" className="lab-brand">
            <Image
              src="/CTLOGO.jpeg"
              width={46}
              height={46}
              alt="Coach Tae home"
            />
            <span>
              COACH TAE<small>QB LAB</small>
            </span>
          </Link>
          <p className="lab-kicker rail-label">THE DEVELOPMENT STUDIO</p>
          <nav aria-label="QB LAB navigation">
            {nav.map(([href, label, number]) => (
              <Link
                key={href}
                href={href}
                aria-current={current === href ? "page" : undefined}
              >
                <span>{number}</span>
                {label}
                <b aria-hidden="true">→</b>
              </Link>
            ))}
          </nav>
          <div className="lab-rail-bottom">
            <span className="lab-status-dot" /> Your game. Your next level.
            <p>Built for curious quarterbacks.</p>
            <Link href="/#training">Book on-field training →</Link>
            <Link href="/">← Coach Tae website</Link>
          </div>
        </aside>
        <div className="lab-workspace">
          <header className="lab-topbar">
            <span>DEVELOP. COMPETE. LEAD.</span>
            <span className="lab-demo-badge">INTERACTIVE DEMO</span>
          </header>
          <div className="lab-demo-note">
            A preview of the QB LAB experience. Sample athletes and illustrated
            film only. Changes reset when you reload.
          </div>
          <main id="lab-main" tabIndex={-1}>
            {children}
          </main>
          <footer className="lab-footer">
            <span>COACH TAE / QB DEVELOPMENT</span>
            <span>Learn with intention. Train with a coach.</span>
          </footer>
        </div>
      </div>
    </DemoContext.Provider>
  );
}

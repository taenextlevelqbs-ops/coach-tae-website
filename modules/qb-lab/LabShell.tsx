"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Pathway } from "./demo";
const nav = [
  ["/qb-lab", "The Lab"],
  ["/qb-lab/athlete", "Command center"],
  ["/qb-lab/simulator", "Scenario practice"],
  ["/qb-lab/playbook", "Playbook Studio"],
  ["/qb-lab/iq", "Football IQ"],
  ["/qb-lab/workouts", "Workouts"],
  ["/qb-lab/mechanics", "2D QB Trainer"],
  ["/qb-lab/film", "Film room"],
  ["/qb-lab/progress", "Progress"],
  ["/qb-lab/family", "Family hub"],
  ["/qb-lab/coach", "Coach Admin"],
  ["/qb-lab/access", "Account status"],
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [pathway, setPathway] = useState<Pathway>("tackle");
  return (
    <DemoContext.Provider value={{ pathway, setPathway }}>
      <div className="qb-lab">
        <a className="lab-skip" href="#lab-main">
          Skip to QB LAB content
        </a>
        <header className="lab-masthead">
          <Link href="/" className="lab-brand">
            <Image
              src="/CTLOGO.jpeg"
              width={42}
              height={42}
              alt="Coach Tae home"
            />
            <span>
              COACH TAE
              <strong>
                QB LAB<span className="lab-brand-mark">/</span>
              </strong>
            </span>
          </Link>
          <p className="lab-masthead-motto">With you wherever you train.</p>
          <Link href="/#training" className="lab-book-link">
            Train with Coach Tae <span aria-hidden="true">→</span>
          </Link>
        </header>
        <button
          className="lab-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="lab-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          Explore QB LAB <span aria-hidden="true">{menuOpen ? "−" : "+"}</span>
        </button>
        <nav
          id="lab-navigation"
          className={`lab-nav ${menuOpen ? "is-open" : ""}`}
          aria-label="QB LAB navigation"
        >
          {nav.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              aria-current={current === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="lab-demo-note">
          <span className="lab-demo-badge">INTERACTIVE DEMO</span>
          <span>
            Synthetic workspace. Plays and activity can be saved in this
            browser; no accounts or private uploads.
          </span>
        </div>
        <main id="lab-main" tabIndex={-1}>
          {children}
        </main>
        <footer className="lab-footer">
          <span>
            COACH TAE <b>/</b> QB DEVELOPMENT
          </span>
          <span>One athlete. One next step. Wherever you train.</span>
          <Link href="/">Coach Tae website →</Link>
        </footer>
      </div>
    </DemoContext.Provider>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Pathway } from "./demo";
const nav = [
  ["/qb-lab", "The Lab", "01"],
  ["/qb-lab/athlete", "Command center", "02"],
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
          <p className="lab-masthead-motto">
            THE QUARTERBACK
            <br />
            DEVELOPMENT NOTEBOOK
          </p>
          <Link href="/#training" className="lab-book-link">
            On-field training <span aria-hidden="true">→</span>
          </Link>
        </header>
        <nav className="lab-nav" aria-label="QB LAB navigation">
          {nav.map(([href, label, number]) => (
            <Link
              key={href}
              href={href}
              aria-current={current === href ? "page" : undefined}
            >
              <span>{number}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="lab-demo-note">
          <span className="lab-demo-badge">INTERACTIVE DEMO</span>
          <span>
            Synthetic athletes & illustrated film. Nothing saved after reload.
          </span>
        </div>
        <main id="lab-main" tabIndex={-1}>
          {children}
        </main>
        <footer className="lab-footer">
          <span>
            COACH TAE <b>/</b> QB DEVELOPMENT
          </span>
          <span>OBSERVE. UNDERSTAND. TAKE THE NEXT REP.</span>
          <Link href="/">Coach Tae website →</Link>
        </footer>
      </div>
    </DemoContext.Provider>
  );
}

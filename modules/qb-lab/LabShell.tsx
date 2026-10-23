"use client";
import Link from "next/link";
import { PwaSupport } from "./PwaInstall";
import { usePathname } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";
import type { Pathway } from "./demo";
import { AppIcon, type AppIconName } from "./AppIcon";
import {
  demoProfiles,
  useDemoSelection,
  type DemoProfile,
} from "./demo-profile-store";
const DemoContext = createContext<{
  pathway: Pathway;
  setPathway: (value: Pathway) => void;
  profile: DemoProfile;
  selectProfile: (id: string) => void;
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
const navigation: {
  href: string;
  label: string;
  icon: AppIconName;
  routes: string[];
}[] = [
  { href: "/qb-lab", label: "Home", icon: "home", routes: ["/qb-lab"] },
  {
    href: "/qb-lab/workouts",
    label: "Train",
    icon: "train",
    routes: [
      "/qb-lab/athlete",
      "/qb-lab/workouts",
      "/qb-lab/mechanics",
      "/qb-lab/film",
      "/qb-lab/recovery",
      "/qb-lab/session",
    ],
  },
  {
    href: "/qb-lab/simulator",
    label: "Simulator",
    icon: "simulator",
    routes: ["/qb-lab/simulator", "/qb-lab/iq", "/qb-lab/playbook"],
  },
  {
    href: "/qb-lab/profile",
    label: "Profile",
    icon: "profile",
    routes: [
      "/qb-lab/profile",
      "/qb-lab/progress",
      "/qb-lab/family",
      "/qb-lab/coach",
      "/qb-lab/access",
    ],
  },
];
export function LabShell({ children }: { children: ReactNode }) {
  const current = usePathname();
  const home = current === "/qb-lab";
  const { profile, pathway, selectProfile, setPathway } = useDemoSelection("A");
  return (
    <DemoContext.Provider
      value={{ pathway, setPathway, profile, selectProfile }}
    >
      <PwaSupport />
      <div className={`qb-application${home ? " app-athlete-home" : ""}`}>
        <a className="app-skip" href="#lab-main">
          Skip to QB LAB content
        </a>
        <header className="app-header">
          <Link
            href="/qb-lab"
            className="app-wordmark"
            aria-label="QB LAB home"
          >
            <span className="app-brand-coach">COACH TAE</span>
            <span className="app-brand-lab">QB LAB</span>
          </Link>
          <nav className="app-navigation" aria-label="QB LAB navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  item.routes.some(
                    (route) =>
                      current === route ||
                      (route !== "/qb-lab" && current.startsWith(`${route}/`)),
                  )
                    ? "page"
                    : undefined
                }
              >
                <AppIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="app-account-actions">
          <details className="app-notifications">
            <summary aria-label="Training notifications"><AppIcon name="bell" /></summary>
            <div className="app-notification-panel">
              <strong>Your training, in one place.</strong>
              <p>This is a demo. There are no live coaching messages or account notifications.</p>
              <Link href="/qb-lab/session">See your sample session →</Link>
            </div>
          </details>
          <label className="app-profile-picker">
            <span className="app-profile-avatar" aria-hidden="true">
              {profile.name[0]}
            </span>
            <span className="app-visually-hidden">Demo athlete profile</span>
            <select
              aria-label="Demo athlete profile"
              value={profile.id}
              onChange={(e) => selectProfile(e.target.value)}
            >
              {demoProfiles.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name} · demo
                </option>
              ))}
            </select>
          </label>
          </div>
        </header>
        <main
          id="lab-main"
          className={home ? "app-main app-home-main" : "app-main"}
          tabIndex={-1}
        >
          {home ? (
            children
          ) : (
            <div className="qb-lab app-tool-workspace">{children}</div>
          )}
        </main>
        <footer className="app-footer">
          <span>
            Demo experience · Synthetic profiles and draft training.
            No real accounts or private uploads.
          </span>
          <Link href="/">Coach Tae website</Link>
        </footer>
      </div>
    </DemoContext.Provider>
  );
}

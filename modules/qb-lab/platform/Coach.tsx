"use client";
import { useState } from "react";
import Link from "next/link";
import { drills } from "./catalog";
import { updateLab, useLocalLab } from "./store";
export function Coach() {
  const { state } = useLocalLab();
  const [profile, setProfile] = useState<"A" | "B">("A");
  const [drill, setDrill] = useState("observe");
  const [notice, setNotice] = useState("");
  const allowedDrills = drills.filter(
    (d) =>
      (d.pathway === "both" ||
        d.pathway === (profile === "A" ? "tackle" : "flag")) &&
      (d.ages as readonly string[]).includes("11–13"),
  );
  const selectedDrill =
    allowedDrills.find((d) => d.id === drill)?.id ?? allowedDrills[0].id;
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">COACH OPERATIONS / SYNTHETIC SANDBOX</p>
          <h1>Connect the next rep.</h1>
          <p className="lab-lede">
            This is an openly accessible local demo, not a coach login. It has
            no real athletes, privileged access, private reviews or messages.
          </p>
        </div>
      </div>
      <div className="lab-dashboard-grid">
        <section className="lab-panel">
          <h2>Demo directory</h2>
          <div className="lab-app-toolbar">
            {(["A", "B"] as const).map((p) => (
              <button
                className="lab-button"
                aria-pressed={profile === p}
                key={p}
                onClick={() => setProfile(p)}
              >
                Demo athlete {p}
              </button>
            ))}
          </div>
          <p>
            {profile === "A"
              ? "Tackle example, ages 11–13. Assignments and local events are tracked separately for each demo profile."
              : "Flag example, ages 11–13, including girls flag. Only age- and pathway-matching local activities are offered."}
          </p>
          <label>
            Activity assignment
            <select
              aria-label="Assignment activity"
              value={selectedDrill}
              onChange={(e) => setDrill(e.target.value)}
            >
              {allowedDrills.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
          <button
            className="lab-button primary"
            onClick={() => {
              if (
                state.assignments.some(
                  (a) =>
                    a.profile === profile &&
                    a.drill === selectedDrill &&
                    a.status === "assigned",
                )
              ) {
                setNotice(
                  "This activity is already assigned to that demo profile.",
                );
                return;
              }
              updateLab((s) => ({
                ...s,
                assignments: [
                  ...s.assignments,
                  {
                    id: crypto.randomUUID(),
                    drill: selectedDrill,
                    profile,
                    status: "assigned" as const,
                  },
                ].slice(-40),
              }));
              setNotice(
                "Local demo assignment created. No athlete or guardian was notified.",
              );
            }}
          >
            Assign activity locally
          </button>
          <p role="status">{notice}</p>
          <h3>Assignments for demo {profile}</h3>
          {state.assignments.filter((a) => a.profile === profile).length ===
          0 ? (
            <p>No assignments yet.</p>
          ) : (
            state.assignments
              .filter((a) => a.profile === profile)
              .map((a) => (
                <div className="lab-assignment-row" key={a.id}>
                  <span>
                    {drills.find((d) => d.id === a.drill)?.title} · {a.status}
                  </span>
                  <button
                    className="lab-button"
                    aria-label={`Remove assignment ${a.id}`}
                    onClick={() =>
                      updateLab((s) => ({
                        ...s,
                        assignments: s.assignments.filter(
                          (item) => item.id !== a.id,
                        ),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))
          )}
        </section>
        <aside className="lab-panel">
          <h2>Review & operations queue</h2>
          <p>
            No private film submissions or released coach feedback exist. Real
            review operations remain disabled until authenticated accounts,
            guardian consent and private storage are provisioned and tested.
          </p>
          <Link className="lab-button" href="/qb-lab/film">
            Open illustrated review desk →
          </Link>
          <h3>Curriculum review</h3>
          <p>
            Observation, simulator and movement content is versioned in source
            but has no qualified coaching sign-off. No public academy
            completeness or training-outcome claim is made.
          </p>
          <h3>Premium services</h3>
          <p>
            Memberships and film-review entitlements are an architecture
            boundary only. There is no checkout, price approval, billing record
            or payment provider connected.
          </p>
          <Link className="lab-text-link" href="/#training">
            Existing on-field booking →
          </Link>
        </aside>
      </div>
    </>
  );
}

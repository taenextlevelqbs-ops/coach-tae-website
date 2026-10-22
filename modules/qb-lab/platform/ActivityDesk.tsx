"use client";
import Link from "next/link";
import { useDemo } from "../LabShell";
import { useLocalLab } from "./store";
import { drills } from "./catalog";
export function ActivityDesk({ profile = "A" }: { profile?: "A" | "B" }) {
  const { state, message } = useLocalLab();
  const { setPathway, selectProfile } = useDemo();
  const assignments = state.assignments.filter((a) => a.profile === profile);
  return (
    <section
      className="lab-activity-desk"
      aria-label="Persisted prototype activity"
    >
      <div className="lab-app-metrics">
        <div>
          <strong>
            {
              state.activities.filter((a) => (a.profile ?? "A") === profile)
                .length
            }
          </strong>
          <span>{"Recorded local events · demo " + profile}</span>
        </div>
        <div>
          <strong>
            {assignments.filter((a) => a.status === "assigned").length}
          </strong>
          <span>Open local assignments · demo {profile}</span>
        </div>
        <div>
          <strong>{state.plays.length}</strong>
          <span>Local playbook entries</span>
        </div>
      </div>
      <div className="lab-app-queue">
        <h2>Next assigned work</h2>
        {assignments.length === 0 ? (
          <p>
            No local assignments. Choose a guided activity or explore the coach
            sandbox to assign one.
          </p>
        ) : (
          assignments.map((a) => (
            <div className="lab-assignment-row" key={a.id}>
              <span>
                {drills.find((d) => d.id === a.drill)?.title} · {a.status}
              </span>
              {a.status === "assigned" && (
                <Link
                  className="lab-text-link"
                  href={
                    a.drill === "recognition"
                      ? `/qb-lab/iq?lesson=${a.recognition ?? ""}#recognition`
                      : `/qb-lab/workouts?activity=${a.drill}&profile=${profile}`
                  }
                  onClick={() => {
                    selectProfile(profile);
                    const d = drills.find((d) => d.id === a.drill);
                    setPathway(
                      d?.pathway === "flag"
                        ? "flag"
                        : d?.pathway === "tackle"
                          ? "tackle"
                          : profile === "B"
                            ? "flag"
                            : "tackle",
                    );
                  }}
                >
                  Open activity library →
                </Link>
              )}
            </div>
          ))
        )}
        <div className="lab-actions">
          <Link className="lab-button primary" href="/qb-lab/simulator">
            Open 2D simulator →
          </Link>
          <Link className="lab-button" href="/qb-lab/workouts">
            Guided activities
          </Link>
          <Link className="lab-text-link" href="/qb-lab/progress">
            Full history →
          </Link>
        </div>
        {message && <p className="lab-fine">{message}</p>}
      </div>
    </section>
  );
}

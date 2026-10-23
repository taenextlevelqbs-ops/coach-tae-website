"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
type Member = { id: string; role: "adult" | "guardian" | "coach" };
type Athlete = { id: string; pathway: string; age_band: string };
type RecordRow = {
  id: string;
  content_key?: string;
  content_version?: string;
  title?: string;
  kind?: string;
  source?: string;
  completed_at?: string | null;
  created_at: string;
};
async function api(path: string, body?: object) {
  const response = await fetch(`/api/qb-lab/account/${path}`, {
    cache: "no-store",
    credentials: "same-origin",
    ...(body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.code ?? "ACCOUNT_SERVICE_UNAVAILABLE");
  return data;
}
/** Separate from demo identity/store. Never imports synthetic histories or profile selection into account records. */
export function AccountWorkspace({ enabled }: { enabled: boolean }) {
  const [member, setMember] = useState<Member | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selected, setSelected] = useState("");
  const [progress, setProgress] = useState<RecordRow[]>([]);
  const [tasks, setTasks] = useState<RecordRow[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(enabled);
  async function session() {
    const data = await api("session");
    setMember(data.account);
    const directory = await api("athletes");
    setAthletes(directory.athletes);
    setSelected("");
  }
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    api("session")
      .then(async (data) => {
        const directory = await api("athletes");
        if (live) {
          setMember(data.account);
          setAthletes(directory.athletes);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [enabled]);
  useEffect(() => {
    if (!selected) return;
    let live = true;
    const query = `?athlete=${encodeURIComponent(selected)}`;
    Promise.all([api(`progress${query}`), api(`assignments${query}`)])
      .then(([events, assigned]) => {
        if (live) {
          setProgress(events.records);
          setTasks(assigned.records);
        }
      })
      .catch(() => {
        if (live)
          setNotice(
            "Records could not be loaded. Please sign in again if your session expired.",
          );
      });
    return () => {
      live = false;
    };
  }, [selected]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    try {
      await action();
    } catch {
      setNotice(
        "The request could not be completed. Check your access or sign in again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const email = String(values.get("email"));
    const password = String(values.get("password"));
    form.reset();
    await run(async () => {
      await api("login", { email, password });
      await session();
      setNotice("Signed into synthetic staging.");
    });
  }
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">ACCOUNTS & PRIVATE SERVICES</p>
          <h1>Your connected workspace</h1>
          <p className="lab-lede">
            Synthetic staging only. Public demo profiles are separate from
            authenticated accounts.
          </p>
        </div>
      </div>
      <section className="lab-panel lab-account-workspace">
        {!enabled ? (
          <>
            <h2>Private services are not connected</h2>
            <p>
              No real registrations, child information or media are accepted.
              Use the simulator and lessons with synthetic local data.
            </p>
            <Link className="lab-button primary" href="/qb-lab/simulator">
              Use the local simulator →
            </Link>
          </>
        ) : loading ? (
          <p role="status">Checking your session…</p>
        ) : !member ? (
          <form onSubmit={login}>
            <h2>Staging member sign in</h2>
            <p>
              Invitation-only adult, guardian and coach test accounts. Never
              enter real child information.
            </p>
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
              />
            </label>
            <button className="lab-button primary" disabled={busy}>
              Sign in
            </button>
          </form>
        ) : (
          <>
            <h2>
              Signed in ·{" "}
              {member.role === "adult" ? "Adult athlete" : member.role}
            </h2>
            <button
              className="lab-button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await api("logout", {});
                  setMember(null);
                  setAthletes([]);
                  setSelected("");
                  setProgress([]);
                  setTasks([]);
                  setNotice(
                    "Signed out. Account records cleared from this screen.",
                  );
                })
              }
            >
              Sign out on this device
            </button>
            <label>
              Athlete workspace
              <select
                value={selected}
                onChange={(event) => {
                  setSelected(event.target.value);
                  setProgress([]);
                  setTasks([]);
                  setNotice("");
                }}
              >
                <option value="">Choose an authorized athlete</option>
                {athletes.map((athlete, i) => (
                  <option key={athlete.id} value={athlete.id}>
                    Athlete {i + 1} · {athlete.pathway} · {athlete.age_band}
                  </option>
                ))}
              </select>
            </label>
            {!athletes.length && (
              <p>
                No authorized athlete profiles. An administrator must provision
                a verified relationship; a role alone grants no access.
              </p>
            )}
            {selected && (
              <>
                <h3>Assigned work</h3>
                {!tasks.length && <p>No assignments recorded.</p>}
                <ul>
                  {tasks.map((task) => (
                    <li key={task.id}>
                      {task.title} ·{" "}
                      {task.completed_at ? "Complete" : "Assigned"}
                      {!task.completed_at && member.role !== "coach" && (
                        <button
                          className="lab-button"
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              await api(`complete?athlete=${selected}`, {
                                id: task.id,
                              });
                              const data = await api(
                                `assignments?athlete=${selected}`,
                              );
                              setTasks(data.records);
                              setNotice(
                                "Completion saved to the account database.",
                              );
                            })
                          }
                        >
                          Mark complete
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {member.role === "coach" && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = event.currentTarget;
                      const values = new FormData(form);
                      void run(async () => {
                        await api(`assignments?athlete=${selected}`, {
                          title: String(values.get("title")),
                          contentKey: String(values.get("contentKey")),
                        });
                        const data = await api(
                          `assignments?athlete=${selected}`,
                        );
                        setTasks(data.records);
                        form.reset();
                        setNotice("Assignment saved.");
                      });
                    }}
                  >
                    <label>
                      Assignment title
                      <input name="title" required maxLength={160} />
                    </label>
                    <label>
                      Reviewed content identifier
                      <input name="contentKey" required maxLength={120} />
                    </label>
                    <button className="lab-button primary" disabled={busy}>
                      Assign activity
                    </button>
                  </form>
                )}
                <h3>Account activity</h3>
                <p>
                  Up to 100 most recent records. Self-reported completion is not
                  a verified performance rating. Demonstration browser history
                  is never imported.
                </p>
                {!progress.length && <p>No account activity recorded.</p>}
                <ul>
                  {progress.map((event) => (
                    <li key={event.id}>
                      {event.kind} · {event.content_key} · {event.source}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        <p role="status">{notice}</p>
        <h2>Before registration and uploads open</h2>
        <p>
          Self-service signup and all media uploads remain unavailable. Verified
          adult onboarding, guardian verification, private quarantine processing
          and deletion must be integrated and tested first. A checkbox does not
          verify a guardian.
        </p>
        <Link className="lab-text-link" href="/qb-lab/film">
          Open the illustrated Film Room →
        </Link>
      </section>
    </>
  );
}

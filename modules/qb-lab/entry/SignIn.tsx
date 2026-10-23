"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signInMember } from "./login";
export function SignIn({ enabled, destination }: { enabled: boolean; destination: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const email = String(values.get("email") ?? "");
    const password = String(values.get("password") ?? "");
    form.reset(); setBusy(true); setError("");
    try {
      const path = await signInMember(email, password, destination);
      // Full navigation forces a fresh verified server check before the dashboard is rendered.
      window.location.assign(path);
    } catch { setError("We couldn’t sign you in. Check your invitation or try again later."); setBusy(false); }
  }
  return <section className="public-account-page">
    <h1>Sign In</h1><p>Your personal training space starts here.</p>
    {!enabled ? <div className="public-status-panel"><h2>Sign-in is not available yet</h2><p>QB LAB authentication and dedicated staging infrastructure are not approved or connected. No real athlete accounts exist in this preview.</p><p>Personal workouts, history, assignments and film remain locked. We won’t ask for your email, password or a child’s information.</p><button className="train-button" disabled>Sign In unavailable</button></div> : <form className="public-status-panel" onSubmit={login}>
      <h2>Invited synthetic staging members</h2><p>Adult, guardian and coach test invitations only. Never enter real child information.</p>
      <label>Email<input name="email" type="email" autoComplete="username" maxLength={254} required disabled={busy} /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" maxLength={128} required disabled={busy} /></label>
      <button className="train-button" disabled={busy}>{busy ? "Checking your account…" : "Sign In"}</button>
      {error && <p role="alert">{error}</p>}
    </form>}
    <div className="public-account-links"><Link href="/qb-lab/account-help">Password recovery, verification &amp; MFA →</Link><Link href="/qb-lab/create-account">Create Account availability →</Link><Link href="/qb-lab/sample">Explore the public sample →</Link></div>
  </section>;
}

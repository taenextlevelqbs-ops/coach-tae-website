"use client";
import { useEffect, useState } from 'react';
export function AccountHelp({ enabled, emailEnabled }: { enabled: boolean; emailEnabled: boolean }) {
  const [notice, setNotice] = useState('');
  const [secret, setSecret] = useState('');
  const [factor, setFactor] = useState('');
  const [busy, setBusy] = useState(false);
  async function call(input: object) {
    const response = await fetch('/api/qb-lab/auth', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const data = await response.json();
    if (!response.ok) throw new Error('Authentication request failed. Check the link, session or authenticator and try again.');
    return data;
  }
  useEffect(() => {
    if (!enabled) return;
    const url = new URL(window.location.href); const code = url.searchParams.get('code');
    if (!code) return;
    // Remove the one-time code before rendering or navigating to external resources.
    window.history.replaceState(null, '', '/qb-lab/account-help');
    let live = true;
    call({ action: 'exchange', code }).then(() => { if (live) setNotice('Provider link verified. Complete MFA if required, then set your password or sign in.'); }).catch(() => { if (live) setNotice('This provider link is invalid or expired. Request another link.'); });
    return () => { live = false; };
  }, [enabled]);
  async function run(input: object) {
    setBusy(true); setNotice('');
    try { const data = await call(input); if (data.secret) { setSecret(data.secret); setFactor(data.factor); } else { setSecret(''); setFactor(''); } setNotice(data.message ?? (data.updated ? 'Password updated. Sign in again.' : data.verified ? 'Second factor verified. You can open your dashboard.' : 'Enter this secret in your authenticator, then verify a code.')); }
    catch (error) { setNotice((error as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="membership-workspace"><h1>Account security</h1><p>Invited synthetic adult, guardian and staff staging accounts only. Never enter children’s information.</p>
    {!enabled ? <p>Authentication, email and account recovery are not connected. No credentials are collected.</p> : <>
      <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); e.currentTarget.reset(); void run({ action: data.get('action'), email: data.get('email') }); }}><h2>Email verification & recovery</h2><p>{emailEnabled ? 'Provider email is available for approved synthetic invitations only.' : 'Email delivery is disabled pending SMTP, redirects and abuse-control review.'}</p>{emailEnabled && <><label>Invited email<input type="email" name="email" required autoComplete="email" maxLength={254} /></label><label>Request<select name="action"><option value="recover">Password recovery</option><option value="verification">Resend verification</option></select></label><button className="lab-button" disabled={busy}>Request provider email</button></>}</form>
      <section><h2>Authenticator verification</h2><p>Coach and owner/admin accounts require a second factor before private access. Sign in with your password first.</p><button className="lab-button" disabled={busy} onClick={() => void run({ action: 'mfa-enroll' })}>Set up authenticator</button>{secret && <p>Authenticator setup secret (only visible now): <code>{secret}</code></p>}<form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); e.currentTarget.reset(); void run({ action: 'mfa-verify', code: data.get('code'), ...(factor ? { factor } : {}) }); }}><label>Six-digit authenticator code<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" /></label><button className="lab-button" disabled={busy}>Verify second factor</button></form></section>
      <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); e.currentTarget.reset(); void run({ action: 'password', password: data.get('password') }); }}><h2>Set a new password</h2><p>A verified provider session is required. Staff must complete MFA first.</p><label>New password<input type="password" name="password" minLength={12} maxLength={128} required autoComplete="new-password" /></label><button className="lab-button" disabled={busy}>Update password & sign out</button></form>
    </>}
    <p role="status">{notice}</p><a href="/qb-lab">Open protected dashboard</a><a href="/qb-lab/sign-in">Return to Sign In</a></section>;
}

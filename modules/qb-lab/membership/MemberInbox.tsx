"use client";
import { useEffect, useState, type FormEvent } from 'react';
type Athlete = { id: string; pathway: string; age_band: string; minor: boolean };
type Message = { id: string; body: string; publish_at: string; task_id: string | null; receipt: { read_by_me: boolean; read_count: number | null } | null };
type Session = { id: string; title: string; location: string; starts_at: string; ends_at: string; status: string; revision: number };
async function call(path: string, input?: object) {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...(input ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error('Request unavailable. Check your session and permissions.');
  return data;
}
export function MemberInbox({ enabled }: { enabled: boolean }) {
  const [role, setRole] = useState('');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athlete, setAthlete] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [schedule, setSchedule] = useState<Session[]>([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [group, setGroup] = useState<string[]>([]);
  const [age, setAge] = useState('all');
  const [pathway, setPathway] = useState('all');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    Promise.all([call('/api/qb-lab/account/session'), call('/api/qb-lab/account/athletes')]).then(([session, directory]) => {
      if (live) { setRole(session.account.role); setAthletes(directory.athletes); }
    }).catch(() => { if (live) setNotice('Your session or membership could not be verified. Sign in again.'); });
    return () => { live = false; };
  }, [enabled]);
  useEffect(() => {
    if (!athlete) return;
    let live = true;
    call(`/api/qb-lab/membership?athlete=${encodeURIComponent(athlete)}`).then(data => { if (live) { setMessages(data.messages); setSchedule(data.schedule); } }).catch(() => { if (live) setNotice('Messages could not be loaded. No cached account data is displayed.'); });
    return () => { live = false; };
  }, [athlete, revision]);
  async function run(input: object) {
    if (busy) return;
    setBusy(true); setNotice('');
    try { await call('/api/qb-lab/membership', input); setNotice('Saved to the account database. In-app only; no email sent.'); setRevision(v => v + 1); }
    catch { setNotice('Could not save. Check authorization, MFA, consent and any conflicting schedule changes.'); }
    finally { setBusy(false); }
  }
  function compose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const time = String(data.get('publishAt') || '');
    void run({ action: 'message', athletes: group, body: data.get('body'), publishAt: time ? new Date(time).toISOString() : new Date().toISOString(), contentKey: data.get('contentKey') || null });
  }
  if (!enabled) return <section className="lab-panel"><h1>Messages & schedule</h1><p>Dedicated staging accounts are not connected. No private records are loaded and no messages can be sent.</p></section>;
  const filtered = athletes.filter(a => (age === 'all' || a.age_band === age) && (pathway === 'all' || a.pathway === pathway));
  return <section className="membership-workspace"><h1>Messages & schedule</h1><p>Account data only. Browser demonstration histories are never imported. Minor profiles remain guardian-managed; replies and external email are disabled.</p>
    <p role="status">{notice}</p>
    <label>Authorized athlete<select value={athlete} onChange={e => { setAthlete(e.target.value); setMessages([]); setSchedule([]); }}><option value="">Choose an authorized profile</option>{athletes.map(a => <option key={a.id} value={a.id}>{a.id.slice(-6)} · {a.age_band} · {a.pathway} · {a.minor ? 'Guardian-managed' : 'Adult'}</option>)}</select></label>
    {role === 'coach' && <section className="lab-panel"><h2>Coach messaging center</h2><p>Only assigned, currently authorized athletes are listed. A group announcement targets your explicit selection, never every platform account. Guardian-managed messages are visible to authorized linked guardians.</p>
      <label>Age filter<select value={age} onChange={e => setAge(e.target.value)}><option value="all">All ages</option>{[...new Set(athletes.map(a => a.age_band))].map(a => <option key={a}>{a}</option>)}</select></label>
      <label>Pathway filter<select value={pathway} onChange={e => setPathway(e.target.value)}><option value="all">All pathways</option>{[...new Set(athletes.map(a => a.pathway))].map(a => <option key={a}>{a}</option>)}</select></label>
      <fieldset><legend>Announcement recipients ({group.length})</legend>{filtered.map(a => <label key={a.id}><input type="checkbox" checked={group.includes(a.id)} onChange={e => setGroup(g => e.target.checked ? [...g, a.id] : g.filter(id => id !== a.id))} />{a.id.slice(-6)} · {a.pathway} · {a.age_band}</label>)}</fieldset>
      <form onSubmit={compose}><label>Coaching message<textarea name="body" required maxLength={2000} /></label><label>Deliver at (your local time; blank means now)<input type="datetime-local" name="publishAt" /></label><label>Optional reviewed workout identifier<input name="contentKey" maxLength={120} /></label><button className="lab-button primary" disabled={busy || !group.length}>Send in-app message</button></form>
      {athlete && <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void run({ action: 'schedule', athlete, title: data.get('title'), location: data.get('location'), startsAt: new Date(String(data.get('starts'))).toISOString(), endsAt: new Date(String(data.get('ends'))).toISOString() }); }}><h2>Create training session</h2><p>No booking or payment is created.</p><label>Title<input name="title" required maxLength={160} /></label><label>Location<input name="location" required maxLength={200} /></label><label>Start (local time)<input name="starts" type="datetime-local" required /></label><label>End (local time)<input name="ends" type="datetime-local" required /></label><button className="lab-button" disabled={busy}>Create session</button></form>}
    </section>}
    {athlete && <><section className="lab-panel"><h2>{role === 'coach' ? 'Sent history' : 'A Note From Coach Tae'}</h2>{!messages.length && <p>No messages available.</p>}{messages.map(m => <article className="membership-message" key={m.id}><p>{m.body}</p><small>{new Date(m.publish_at).toLocaleString()} · {m.receipt?.read_by_me ? 'Read' : 'Unread'}{role === 'coach' && m.receipt?.read_count != null ? ` · ${m.receipt.read_count} account acknowledgement(s)` : ''}</small>{m.task_id && <p>Includes a saved assignment. Open Account activity to review it.</p>}{role !== 'coach' && !m.receipt?.read_by_me && <button className="lab-button" disabled={busy} onClick={() => void run({ action: 'read', id: m.id })}>Mark read</button>}</article>)}</section>
    <section className="lab-panel"><h2>Training schedule</h2>{!schedule.length && <p>No sessions recorded.</p>}{schedule.map(s => <article key={s.id}><h3>{s.title}</h3><p>{s.location} · {new Date(s.starts_at).toLocaleString()} · {s.status}</p>{role === 'coach' && s.status !== 'cancelled' && <button className="lab-button" disabled={busy} onClick={() => void run({ action: 'schedule', athlete, id: s.id, revision: s.revision, title: s.title, location: s.location, startsAt: s.starts_at, endsAt: s.ends_at, cancel: true })}>Cancel session & notify</button>}</article>)}</section></>}
  </section>;
}

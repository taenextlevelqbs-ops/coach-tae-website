"use client";
import { useState } from 'react';
import Link from 'next/link';
import { demoAthletes, emptyDemo, inboxDemo, messageTemplates, sendDemo, type DemoState } from './demo';
export function WorkflowDemo() {
  const [state, setState] = useState<DemoState>(emptyDemo);
  const [role, setRole] = useState('coach');
  const [athlete, setAthlete] = useState('demo-jordan');
  const [template, setTemplate] = useState(0);
  const [group, setGroup] = useState(false);
  const [later, setLater] = useState(false);
  const [assignment, setAssignment] = useState(false);
  const [clock, setClock] = useState(0);
  const [notice, setNotice] = useState('');
  const selected = demoAthletes.find(a => a.id === athlete)!;
  const targets = group ? demoAthletes.map(a => a.id) : [athlete];
  const messages = role === 'coach' ? state.messages : inboxDemo(state, role === 'guardian' ? 'demo-jordan' : athlete, clock);
  const visibleAthlete = role === 'guardian' ? 'demo-jordan' : athlete;
  return <section className="membership-workspace" aria-label="Synthetic coaching workflows">
    <h1>Coaching, connected.</h1>
    <p>Interactive synthetic walkthrough. No accounts, personal information, storage or messages leave this page. Refresh resets everything. Role switching is a demonstration, never authentication.</p>
    <div className="lab-app-toolbar"><label>Preview perspective<select value={role} onChange={e => setRole(e.target.value)}><option value="coach">Coach demonstration</option><option value="athlete">Athlete demonstration</option><option value="guardian">Guardian demonstration</option></select></label>
    {role !== 'guardian' && <label>Synthetic athlete<select value={athlete} onChange={e => setAthlete(e.target.value)}>{demoAthletes.map(a => <option key={a.id} value={a.id}>{a.name} · {a.age} · {a.pathway}</option>)}</select></label>}</div>
    <p>{role === 'guardian' || selected.guardian ? 'Jordan is guardian-managed. Coaching notices are visible to the guardian; unsupervised replies are unavailable.' : 'Alex represents an independent adult athlete.'}</p>
    {role === 'coach' && <section className="lab-panel"><h2>Messaging center</h2>
      <label>Synthetic message<select value={template} onChange={e => setTemplate(Number(e.target.value))}>{messageTemplates.map((t, i) => <option key={t} value={i}>{t}</option>)}</select></label>
      <label><input type="checkbox" checked={group} onChange={e => setGroup(e.target.checked)} /> Announce to both assigned synthetic athletes</label>
      <label><input type="checkbox" checked={later} onChange={e => setLater(e.target.checked)} /> Schedule for tomorrow in the demo clock</label>
      <label><input type="checkbox" checked={assignment} onChange={e => setAssignment(e.target.checked)} /> Include a draft footwork assignment</label>
      <button className="lab-button primary" onClick={() => { setState(s => sendDemo(s, targets, template, clock, later ? 86400000 : 0, assignment)); setNotice('Synthetic in-app message queued. No email or real notification sent.'); }}>Send synthetic message</button>
      <h2>Training schedule</h2><p>Example field · one hour · demonstration only, never a booking.</p>
      <button className="lab-button" onClick={() => { setState(s => ({ ...s, sessions: [...s.sessions.filter(x => x.athlete !== athlete), { athlete, startsAt: clock + 86400000, cancelled: false }], audit: [...s.audit, 'Synthetic session created'] })); setNotice('Synthetic session added.'); }}>Create synthetic session</button>
      <button className="lab-button" disabled={!state.sessions.some(s => s.athlete === athlete && !s.cancelled)} onClick={() => setState(s => ({ ...s, sessions: s.sessions.map(x => x.athlete === athlete ? { ...x, cancelled: true } : x), audit: [...s.audit, 'Synthetic session cancelled'] }))}>Cancel synthetic session</button>
    </section>}
    <section className="lab-panel"><h2>{role === 'coach' ? 'Sent messages & delivery' : 'A Note From Coach Tae'}</h2>
      {messages.length === 0 && <p>No synthetic messages yet. Use the coach perspective to send one.</p>}
      {messages.map(m => <article className="membership-message" key={m.id}><p>{m.body}</p><small>{role === 'coach' ? `${demoAthletes.find(a => a.id === m.athlete)?.name} · ` : ''}{m.publishAt > clock ? 'Scheduled; not yet visible in recipient inbox' : m.read ? 'Read in demonstration' : 'Available in demonstration'}</small>
        {m.assignment && <p><Link href="/qb-lab/sample">Open assigned draft footwork sample</Link></p>}
        {role !== 'coach' && !m.read && <button className="lab-button" onClick={() => setState(s => ({ ...s, messages: s.messages.map(x => x.id === m.id ? { ...x, read: true } : x) }))}>Mark read</button>}
      </article>)}
    </section>
    <section className="lab-panel"><h2>Upcoming synthetic sessions</h2>{state.sessions.filter(s => role === 'coach' || s.athlete === visibleAthlete).length === 0 && <p>No sessions scheduled.</p>}{state.sessions.filter(s => role === 'coach' || s.athlete === visibleAthlete).map(s => <p key={s.athlete}>{demoAthletes.find(a => a.id === s.athlete)?.name} · Example field · {s.cancelled ? 'Cancelled' : s.startsAt > clock ? 'Upcoming' : 'Demo time reached'}</p>)}</section>
    <details><summary>Demonstration clock & audit trail</summary><button className="lab-button" onClick={() => setClock(t => t + 86400000)}>Advance demo clock one day</button><p>Day {clock / 86400000}. No automatic background delivery is claimed.</p><ul>{state.audit.map((item, i) => <li key={i}>{item}</li>)}</ul></details>
    <p role="status">{notice}</p>
  </section>;
}

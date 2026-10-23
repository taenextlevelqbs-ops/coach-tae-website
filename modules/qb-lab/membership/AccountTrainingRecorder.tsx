"use client";
import { useEffect, useRef, useState } from 'react';
type Athlete = { id: string; pathway: string; age_band: string };
/** Explicit account writes, independent of every demo profile, local history and completion button. */
export function AccountTrainingRecorder({ contentKey, kind }: { contentKey: string; kind: 'workout' | 'recovery' }) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selected, setSelected] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const attempt = useRef<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/qb-lab/account/athletes', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal }).then(async r => {
      if (!r.ok) throw new Error();
      const data = await r.json(); setAthletes(data.athletes);
    }).catch(() => { if (!controller.signal.aborted) setNotice('Account profiles unavailable. No personal completion can be saved.'); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    fetch(`/api/qb-lab/account/progress?athlete=${selected}`, { cache: 'no-store', credentials: 'same-origin', signal: controller.signal }).then(async r => {
      if (!r.ok) throw new Error();
      const data = await r.json();
      if (controller.signal.aborted) return;
      const match = data.records.find((row: { content_key: string; kind: string }) => row.content_key === contentKey && row.kind === kind);
      setCompletedAt(match?.created_at ?? ''); setLoaded(true);
    }).catch(() => { if (!controller.signal.aborted) setNotice('Could not load account history. Saving remains disabled.'); });
    return () => controller.abort();
  }, [selected, contentKey, kind]);
  async function save() {
    if (!selected || !loaded || busy || completedAt) return;
    setBusy(true); setNotice('');
    attempt.current ??= crypto.randomUUID();
    try {
      const response = await fetch(`/api/qb-lab/account/progress?athlete=${selected}`, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: attempt.current, kind, contentKey, durationSeconds: 0 }),
      });
      if (!response.ok) throw new Error();
      // Read the authoritative server timestamp; never manufacture a completion date.
      const read = await fetch(`/api/qb-lab/account/progress?athlete=${selected}`, { credentials: 'same-origin', cache: 'no-store' });
      if (!read.ok) throw new Error();
      const data = await read.json(); const record = data.records.find((row: { id: string }) => row.id === attempt.current);
      if (!record) throw new Error();
      setCompletedAt(record.created_at); setNotice('Self-reported completion saved to the account database. Not a coach-verified performance.');
    } catch { setNotice('Could not confirm saved progress. Retry uses the same event identifier; no success is assumed.'); }
    finally { setBusy(false); }
  }
  return <section className="lab-panel membership-workspace" aria-label="Account training record"><h2>Your account training record</h2><p>Separate from the synthetic drill demonstration above. No browser history is imported. Record only work actually completed; draft activities still require coach review. No duration or performance score is inferred.</p>
    <label>Authorized account profile<select value={selected} disabled={busy} onChange={e => { setSelected(e.target.value); setCompletedAt(''); setLoaded(false); setNotice(''); attempt.current = null; }}><option value="">Choose a profile</option>{athletes.map(a => <option key={a.id} value={a.id}>{a.id.slice(-6)} · {a.pathway} · {a.age_band}</option>)}</select></label>
    {completedAt ? <p>Self-reported completion: <time dateTime={completedAt}>{new Date(completedAt).toLocaleString()}</time></p> : <button className="lab-button" disabled={!selected || !loaded || busy} onClick={() => void save()}>Save actual completion to account</button>}
    <p role="status">{notice}</p>
  </section>;
}

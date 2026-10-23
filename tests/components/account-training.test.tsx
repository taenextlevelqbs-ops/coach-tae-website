import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { AccountTrainingRecorder } from '@/modules/qb-lab/membership/AccountTrainingRecorder';
it('loads verified account history and confirms real server timestamps without importing local demonstrations', async () => {
 let savedId = '';
 const fetcher = vi.fn(async (path: string, options?: RequestInit) => {
  if (path.endsWith('/athletes')) return { ok: true, json: async () => ({ athletes: [{ id: 'synthetic-id', pathway: 'tackle', age_band: 'college' }] }) };
  if (options?.method === 'POST') { const body = JSON.parse(String(options.body)); savedId = body.id; expect(body).toMatchObject({ kind: 'workout', contentKey: 'reset-your-feet', durationSeconds: 0 }); return { ok: true }; }
  return { ok: true, json: async () => ({ records: savedId ? [{ id: savedId, content_key: 'reset-your-feet', kind: 'workout', created_at: '2026-10-23T12:00:00Z' }] : [] }) };
 });
 vi.stubGlobal('fetch', fetcher); localStorage.clear();
 const user = userEvent.setup(); render(<AccountTrainingRecorder contentKey="reset-your-feet" kind="workout" />);
 await screen.findByRole('option', { name: /tackle/ });
 await user.selectOptions(screen.getByLabelText('Authorized account profile'), 'synthetic-id');
 const button = await screen.findByRole('button', { name: 'Save actual completion to account' });
 await vi.waitFor(() => expect(button).toBeEnabled());
 await user.click(button);
 expect(await screen.findByText(/Self-reported completion saved to the account database/)).toBeVisible();
 expect(document.querySelector('time')).toHaveAttribute('datetime', '2026-10-23T12:00:00Z');
 expect(localStorage.length).toBe(0); vi.unstubAllGlobals();
});
it('does not claim success or fabricate a date when persistence fails', async () => {
 const fetcher = vi.fn(async (path: string, options?: RequestInit) => {
  if (path.endsWith('/athletes')) return { ok: true, json: async () => ({ athletes: [{ id: 'synthetic-id', pathway: 'flag5', age_band: '8-10' }] }) };
  if (options?.method === 'POST') return { ok: false };
  return { ok: true, json: async () => ({ records: [] }) };
 });
 vi.stubGlobal('fetch', fetcher); const user = userEvent.setup(); render(<AccountTrainingRecorder contentKey="mobility" kind="recovery" />);
 await screen.findByRole('option', { name: /flag5/ });
 await user.selectOptions(screen.getByLabelText('Authorized account profile'), 'synthetic-id');
 const button = screen.getByRole('button', { name: 'Save actual completion to account' }); await vi.waitFor(() => expect(button).toBeEnabled()); await user.click(button);
 expect(await screen.findByText(/Could not confirm saved progress/)).toBeVisible(); expect(document.querySelector('time')).toBeNull();
 vi.unstubAllGlobals();
});

import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ config: vi.fn(), client: vi.fn(), verify: vi.fn(), base: vi.fn() }));
vi.mock('@/server/qb-lab/accounts/config', () => ({ accountConfig: m.config }));
vi.mock('@/server/qb-lab/accounts/session', () => ({ accountClient: m.client, verifiedAccount: m.verify, verifiedMembership: m.base }));
import { POST, GET } from '@/app/api/qb-lab/membership/route';
import { POST as auth } from '@/app/api/qb-lab/auth/route';
import { AccountError } from '@/server/qb-lab/accounts/http';
const id = '00000000-0000-4000-8000-000000000102';
const origin = 'https://staging.example';
const req = (body: object, trusted = true) => new Request(origin + '/api/qb-lab/membership', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(trusted ? { origin } : {}) }, body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); m.config.mockReturnValue({ origin }); m.verify.mockResolvedValue({ id, role: 'coach' }); m.base.mockResolvedValue({ id, role: 'coach' }); });
it('fails closed before reading credentials or constructing provider clients', async () => {
 m.config.mockReturnValue(null);
 for (const handler of [POST, auth]) { const r = req({ password: 'never read' }); expect((await handler(r)).status).toBe(503); expect(r.bodyUsed).toBe(false); }
 expect(m.client).not.toHaveBeenCalled();
});
it('rejects CSRF and missing identities, including privileged role claims', async () => {
 expect((await POST(req({}, false))).status).toBe(403);
 expect(m.client).not.toHaveBeenCalled();
 m.client.mockResolvedValue({}); m.verify.mockRejectedValue(new AccountError(403, 'MFA_REQUIRED'));
 expect((await GET(new Request(origin + '?athlete=' + id))).status).toBe(403);
});
it('uses atomic authorized fanout and rejects duplicates, forged sender, bad dates and athlete writes', async () => {
 const rpc = vi.fn().mockResolvedValue({ data: 1 }); m.client.mockResolvedValue({ rpc });
 const input = { action: 'message', athletes: [id], body: 'Synthetic coaching note', publishAt: '2026-10-25T12:00:00Z' };
 expect((await POST(req(input))).status).toBe(201);
 expect(rpc).toHaveBeenCalledWith('qb_send_message', { targets: [id], message: input.body, delivery: input.publishAt.replace('Z','.000Z'), content_key: null });
 for (const body of [{ ...input, athletes: [id,id] }, { ...input, author: id }, { ...input, publishAt: 'tomorrow' }]) expect((await POST(req(body))).status).toBe(422);
 m.verify.mockResolvedValue({ role: 'guardian' }); expect((await POST(req(input))).status).toBe(403);
 expect((await POST(req({ action: 'read', id }))).status).toBe(200);
});
it('requires schedule revision and passes cancellation as a database transaction', async () => {
 const rpc = vi.fn().mockResolvedValue({ data: id }); m.client.mockResolvedValue({ rpc });
 const input = { action: 'schedule', athlete: id, id, title: 'Synthetic training', location: 'Example field', startsAt: '2026-10-25T12:00:00Z', endsAt: '2026-10-25T13:00:00Z', cancel: true };
 expect((await POST(req(input))).status).toBe(422);
 expect((await POST(req({ ...input, revision: 2 }))).status).toBe(201);
 expect(rpc).toHaveBeenCalledWith('qb_schedule_session', expect.objectContaining({ expected_revision: 2, cancel: true }));
});
it('keeps email disabled separately and returns identical eligibility messages', async () => {
 const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: new Error('Missing user') }); m.client.mockResolvedValue({ auth: { resetPasswordForEmail } });
 expect((await auth(req({ action: 'recover', email: 'synthetic@example.test' }))).status).toBe(503);
 expect(resetPasswordForEmail).not.toHaveBeenCalled();
 vi.stubEnv('QB_LAB_AUTH_EMAIL_STAGE', 'synthetic-staging');
 const response = await auth(req({ action: 'recover', email: 'synthetic@example.test' })); expect(response.status).toBe(200);
 expect(await response.json()).toEqual({ message: 'If eligible, a provider email will be sent.' });
});
it('never changes a password before verified membership and staff MFA', async () => {
 const updateUser = vi.fn(); m.client.mockResolvedValue({ auth: { updateUser } }); m.verify.mockRejectedValue(new AccountError(403, 'MFA_REQUIRED'));
 expect((await auth(req({ action: 'password', password: 'synthetic-password' }))).status).toBe(403);
 expect(updateUser).not.toHaveBeenCalled();
});
it('rejects failed MFA and never returns a successful private session', async () => {
 const challengeAndVerify = vi.fn().mockResolvedValue({ error: new Error('bad code') });
 m.client.mockResolvedValue({ auth: { mfa: { listFactors: async () => ({ data: { totp: [{ id, status: 'verified' }] } }), challengeAndVerify } } });
 expect((await auth(req({ action: 'mfa-verify', code: '123456' }))).status).toBe(401);
 expect(m.verify).not.toHaveBeenCalled();
});
it('exchanges only a provider PKCE code and signs out memberships that fail verification', async () => {
 const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null }); const signOut = vi.fn();
 m.client.mockResolvedValue({ auth: { exchangeCodeForSession, signOut } });
 expect((await auth(req({ action: 'exchange', code: 'synthetic-pkce-code' }))).status).toBe(200);
 expect(exchangeCodeForSession).toHaveBeenCalledWith('synthetic-pkce-code');
 m.base.mockRejectedValue(new AccountError(403, 'VERIFIED_MEMBERSHIP_REQUIRED'));
 expect((await auth(req({ action: 'exchange', code: 'synthetic-pkce-code' }))).status).toBe(403);
 expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
});
it('requires provider MFA verification before reporting success and returns no private records', async () => {
 const rpc = vi.fn().mockResolvedValue({ error: null });
 m.client.mockResolvedValue({ rpc, auth: { mfa: { listFactors: async () => ({ data: { totp: [{ id, status: 'verified' }] } }), challengeAndVerify: async () => ({ error: null }) } } });
 const response = await auth(req({ action: 'mfa-verify', code: '123456' }));
 expect(await response.json()).toEqual({ verified: true });
 expect(m.verify).toHaveBeenCalled();
 expect(rpc).not.toHaveBeenCalled();
});
it('updates the authenticated password and requests global provider revocation', async () => {
 const updateUser = vi.fn().mockResolvedValue({ error: null }); const signOut = vi.fn().mockResolvedValue({ error: null }); const rpc = vi.fn().mockResolvedValue({ error: null });
 m.client.mockResolvedValue({ rpc, auth: { updateUser, signOut } });
 expect((await auth(req({ action: 'password', password: 'synthetic-password-only' }))).status).toBe(200);
 expect(updateUser).toHaveBeenCalledWith({ password: 'synthetic-password-only' });
 expect(signOut).toHaveBeenCalledWith({ scope: 'global' });
 expect(rpc).not.toHaveBeenCalled();
});
it('does not claim password-change success when provider revocation fails', async () => {
 m.client.mockResolvedValue({ rpc: async () => ({ error: new Error('unavailable') }), auth: { updateUser: async () => ({ error: null }), signOut: async () => ({ error: new Error('provider unavailable') }) } });
 const response = await auth(req({ action: 'password', password: 'synthetic-password-only' }));
 expect(response.status).toBe(503);
 expect(await response.json()).toEqual({ code: 'PASSWORD_CHANGED_REAUTH_REQUIRED' });
});

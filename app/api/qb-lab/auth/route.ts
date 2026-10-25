import { accountConfig } from '@/server/qb-lab/accounts/config';
import { accountClient, verifiedMembership, verifiedAccount } from '@/server/qb-lab/accounts/session';
import { AccountError, accountResponse, boundedJson, fields, requireOrigin, text, uuid } from '@/server/qb-lab/accounts/http';
export async function POST(request: Request) {
  const config = accountConfig();
  if (!config) return accountResponse({ code: 'ACCOUNTS_NOT_CONFIGURED' }, 503);
  try {
    requireOrigin(request, config.origin);
    const input = await boundedJson(request);
    const client = await accountClient(config);
    if (input.action === 'recover' || input.action === 'verification') {
      fields(input, ['action', 'email']);
      // Separate, default-off email gate: provider rate limits/SMTP/redirects must be reviewed first.
      if (process.env.QB_LAB_AUTH_EMAIL_STAGE !== 'synthetic-staging') return accountResponse({ code: 'EMAIL_NOT_CONFIGURED' }, 503);
      const email = text(input.email, 254);
      const redirect = `${config.origin}/qb-lab/account-help`;
      if (input.action === 'recover') await client.auth.resetPasswordForEmail(email, { redirectTo: redirect });
      else await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirect } });
      // Identical result for missing users/provider rejection; never enumerate membership.
      return accountResponse({ message: 'If eligible, a provider email will be sent.' });
    }
    if (input.action === 'verify-link') {
      fields(input, ['action', 'tokenHash', 'type']);
      const type=input.type;
      if (type !== 'invite' && type !== 'recovery' && type !== 'signup' && type !== 'email') throw new AccountError(422, 'INVALID_LINK_TYPE');
      const { error }=await client.auth.verifyOtp({token_hash:text(input.tokenHash,2048),type});
      if(error)throw new AccountError(401,'INVALID_OR_EXPIRED_LINK');
      try{await verifiedMembership(client);}catch(error){await client.auth.signOut({scope:'local'});throw error;}
      return accountResponse({verified:true});
    }
    if (input.action === 'exchange') {
      fields(input, ['action', 'code']);
      const { error } = await client.auth.exchangeCodeForSession(text(input.code, 2048));
      if (error) throw new AccountError(401, 'INVALID_OR_EXPIRED_LINK');
      try { await verifiedMembership(client); }
      catch (error) { await client.auth.signOut({ scope: 'local' }); throw error; }
      return accountResponse({ exchanged: true });
    }
    // Bootstrap identity is used only for MFA enrollment/challenge, never private records.
    const account = await verifiedMembership(client);
    if (input.action === 'mfa-enroll') {
      fields(input, ['action']);
      const factors = await client.auth.mfa.listFactors();
      if (factors.error) throw new AccountError(503, 'MFA_UNAVAILABLE');
      if (factors.data.totp.some(f => f.status === 'verified')) throw new AccountError(403, 'MFA_ALREADY_ENROLLED');
      const { data, error } = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'QB LAB authenticator' });
      if (error) throw new AccountError(503, 'MFA_UNAVAILABLE');
      return accountResponse({ factor: data.id, secret: data.totp.secret });
    }
    if (input.action === 'mfa-verify') {
      fields(input, ['action', 'factor', 'code']);
      if (typeof input.code !== 'string' || !/^\d{6}$/.test(input.code)) throw new AccountError(422, 'INVALID_MFA_CODE');
      const factors = await client.auth.mfa.listFactors();
      if (factors.error) throw new AccountError(503, 'MFA_UNAVAILABLE');
      const factor = input.factor ? uuid(input.factor) : factors.data.totp.find(f => f.status === 'verified')?.id;
      if (!factor) throw new AccountError(403, 'MFA_ENROLLMENT_REQUIRED');
      const { error } = await client.auth.mfa.challengeAndVerify({ factorId: factor, code: input.code });
      if (error) throw new AccountError(401, 'MFA_FAILED');
      await verifiedAccount(client);
      return accountResponse({ verified: true });
    }
    if (input.action === 'password') {
      fields(input, ['action', 'password']);
      await verifiedAccount(client);
      if (typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128) throw new AccountError(422, 'INVALID_PASSWORD');
      const { error } = await client.auth.updateUser({ password: input.password });
      if (error) throw new AccountError(503, 'PASSWORD_UPDATE_UNAVAILABLE');
      const logout = await client.auth.signOut({ scope: 'global' });
      if (logout.error) throw new AccountError(503, 'PASSWORD_CHANGED_REAUTH_REQUIRED');
      return accountResponse({ updated: true, signInRequired: true });
    }
    // Owner/admin membership never implies access to athletes, film or other families.
    return accountResponse({ code: 'UNKNOWN_ACTION', role: account.role }, 422);
  } catch (error) {
    return error instanceof AccountError ? accountResponse({ code: error.code }, error.status) : accountResponse({ code: 'AUTH_SERVICE_UNAVAILABLE' }, 503);
  }
}

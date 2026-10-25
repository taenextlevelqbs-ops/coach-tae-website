/** Additional activation gates. Accounts themselves already reject Vercel Production. */
export function mvpGates(env: Record<string,string|undefined> = process.env) {
  const staging = env.QB_LAB_ACCOUNTS_STAGE === 'synthetic-staging' && env.VERCEL_ENV !== 'production';
  return { media: staging && env.QB_LAB_MEDIA_STAGE === 'approved-synthetic', onboarding: staging && env.QB_LAB_MINOR_ONBOARDING === 'approved-synthetic' };
}

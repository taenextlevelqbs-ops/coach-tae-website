/** Explicit staging-only switch. No service-role key is used by account routes. */
export function accountConfig(
  env: Record<string, string | undefined> = process.env,
) {
  if (
    env.QB_LAB_ACCOUNTS_STAGE !== "synthetic-staging" ||
    env.VERCEL_ENV === "production"
  )
    return null;
  try {
    const origin = new URL(env.QB_LAB_ACCOUNT_ORIGIN ?? "");
    const provider = new URL(env.QB_LAB_SUPABASE_URL ?? "");
    if (
      origin.origin !== env.QB_LAB_ACCOUNT_ORIGIN ||
      origin.protocol !== "https:" ||
      provider.protocol !== "https:" ||
      !provider.hostname.endsWith(".supabase.co") ||
      provider.pathname !== "/" ||
      provider.search ||
      provider.username ||
      provider.password
    )
      return null;
    const key = env.QB_LAB_SUPABASE_PUBLISHABLE_KEY;
    // Only the managed provider's publishable key; reject service-role / legacy JWT secrets.
    if (!key?.startsWith("sb_publishable_") || key.length > 250) return null;
    return { origin: origin.origin, provider: provider.origin, key };
  } catch {
    return null;
  }
}

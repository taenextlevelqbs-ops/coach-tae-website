import { createServerClient } from "@supabase/ssr";
import { accountCookieOptions } from "./cookie-policy";
import { cookies } from "next/headers";
import { AccountError } from "./http";
import type { accountConfig } from "./config";
export async function accountClient(
  config: NonNullable<ReturnType<typeof accountConfig>>,
) {
  const jar = await cookies();
  return createServerClient(config.provider, config.key, {
    cookieOptions: accountCookieOptions,
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (changes) => {
        for (const { name, value, options } of changes)
          jar.set(name, value, {
            ...options,
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: accountCookieOptions.path,
          });
      },
    },
  });
}
export async function verifiedMembership(
  client: Awaited<ReturnType<typeof accountClient>>,
) {
  // Network verification, never getSession() or browser-supplied role metadata.
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || !data.user.email_confirmed_at)
    throw new AccountError(401, "SIGN_IN_REQUIRED");
  const { data: account, error: denied } = await client
    .from("qb_accounts")
    .select("id,role,adult_verified")
    .eq("id", data.user.id)
    .single();
  if (
    denied ||
    !account ||
    !["adult", "guardian", "athlete", "coach", "administrator"].includes(account.role) ||
    (account.role !== "athlete" && !account.adult_verified)
  )
    throw new AccountError(403, "VERIFIED_MEMBERSHIP_REQUIRED");
  if (account.role === "athlete") {
    const linked = await client.rpc("qb_identity_ready");
    if (linked.error || linked.data !== true) throw new AccountError(403, "VERIFIED_GUARDIAN_LINK_REQUIRED");
  }
  return account as {
    id: string;
    role: "adult" | "guardian" | "athlete" | "coach" | "administrator";
    adult_verified: boolean;
  };
}

/** Full authorization gate; bootstrap identity alone never permits private operations. */
export async function verifiedAccount(client: Awaited<ReturnType<typeof accountClient>>) {
  const account = await verifiedMembership(client);
  if (["coach", "administrator"].includes(account.role)) {
    const { data, error } = await client.auth.getClaims();
    if (error || data?.claims.sub !== account.id || data?.claims.aal !== "aal2")
      throw new AccountError(403, "MFA_REQUIRED");
  }
  return account;
}

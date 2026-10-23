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
export async function verifiedAccount(
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
    !account?.adult_verified ||
    !["adult", "guardian", "coach"].includes(account.role)
  )
    throw new AccountError(403, "VERIFIED_MEMBERSHIP_REQUIRED");
  return account as {
    id: string;
    role: "adult" | "guardian" | "coach";
    adult_verified: true;
  };
}

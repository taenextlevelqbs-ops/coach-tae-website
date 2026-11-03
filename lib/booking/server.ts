import "server-only";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { cookies } from "next/headers";
export function required(name: string) {
  const v =
    process.env[name] ??
    (name === "SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : name === "BOOKING_FROM_EMAIL"
        ? process.env.EMAIL_FROM
        : name === "COACH_TAE_STRIPE_ACCOUNT_ID"
          ? "acct_1UVeHrQGpLTTSzQv"
          : name === "BOOKING_SITE_URL"
            ? "https://coachtaeqb.com"
            : undefined);
  if (!v) throw new Error(`Booking configuration missing: ${name}`);
  return v;
}
export function db() {
  return createClient(
    required("SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export function stripe() {
  return new Stripe(required("STRIPE_SECRET_KEY"));
}
export async function verifiedStripe() {
  const client = stripe();
  const account = await client.accounts.retrieveCurrent();
  if (account.id !== "acct_1UVeHrQGpLTTSzQv")
    throw new Error("Stripe account mismatch");
  return client;
}
export async function coach() {
  const token = (await cookies()).get("coach_session")?.value;
  if (!token) throw new Error("Unauthorized");
  const { data, error } = await db().auth.getUser(token);
  if (
    error ||
    !data.user ||
    data.user.id !== required("COACH_SUPABASE_USER_ID")
  )
    throw new Error("Unauthorized");
  return data.user;
}
export function sameOrigin(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(required("BOOKING_SITE_URL")).origin
  )
    throw new Error("Invalid origin");
}
export function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "Unauthorized")
    return Response.json({ error: "Sign-in required." }, { status: 401 });
  if (message === "Native booking not enabled")
    return Response.json(
      {
        error:
          "Native booking is not available yet. Please use the existing booking links.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  console.error(
    "Booking operation failed:",
    message.replace(/(?:sk|re)_[a-zA-Z0-9_]+/g, "[redacted]"),
  );
  return Response.json(
    {
      error:
        "Unable to complete this request. Please try again or contact Coach Tae.",
    },
    { status: 400 },
  );
}

export function publicBookingEnabled() {
  if (process.env.NEXT_PUBLIC_BOOKING_ENABLED !== "true")
    throw new Error("Native booking not enabled");
}

import "server-only";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { z } from "zod";
import { catalog, type ProductKey, validPrice } from "./catalog";
import { liveAccount } from "./live-catalog";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function required(name: string) {
  const value = process.env[name];
  if (!value)
    throw new HttpError(
      503,
      "This service is temporarily unavailable. Please contact Coach Tae.",
    );
  return value;
}
export function db() {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export function siteUrl() {
  const value = new URL(required("APP_URL"));
  if (
    value.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(value.hostname)
  )
    throw new HttpError(503, "APP_URL must use HTTPS.");
  return value.origin;
}
export function payments() {
  const key = required("STRIPE_SECRET_KEY");
  const testKey = key.startsWith("sk_test_") || key.startsWith("rk_test_");
  // Fulfillment currently rejects live events; Checkout must enforce the same mode.
  if (!testKey || process.env.STRIPE_LIVE_ENABLED === "true")
    throw new HttpError(
      503,
      "Live website payments are disabled pending hosted validation.",
    );
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 20000 });
}
export function bookingEnabled() {
  if (process.env.PLATFORM_BOOKING_ENABLED !== "true")
    throw new HttpError(
      503,
      "Online booking is not open yet. Please contact Coach Tae.",
    );
}
export function checkOrigin(req: Request) {
  if (req.headers.get("origin") !== siteUrl())
    throw new HttpError(403, "Request origin not allowed.");
}
export async function identity(req: Request, coach = false) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new HttpError(401, "Please sign in.");
  const client = db();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.email)
    throw new HttpError(401, "Your session expired. Please sign in again.");
  const user = data.user;
  const { data: role, error: roleError } = await client
    .from("ct_coaches")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (roleError)
    throw new HttpError(503, "Database setup is not available yet.");
  if (coach && !role) throw new HttpError(403, "Coach access required.");
  const { error: profileError } = await client
    .from("ct_families")
    .upsert(
      { id: user.id, email: user.email },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (profileError)
    throw new HttpError(503, "Family profile could not be loaded.");
  return { client, user, isCoach: !!role };
}
export function checked<T>(result: {
  data: T;
  error: { message: string; code?: string } | null;
}): T {
  if (result.error) {
    if (result.error.code === "23P01")
      throw new HttpError(
        409,
        "This time overlaps an existing session or its buffer. Choose another window.",
      );
    if (result.error.code === "P0001")
      throw new HttpError(409, result.error.message);
    console.error("platform_database_error", { code: result.error.code });
    throw new HttpError(503, "The request could not be saved. Please retry.");
  }
  return result.data;
}
export async function json(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 50000)
    throw new HttpError(413, "Request too large.");
  const raw = await req.text();
  if (raw.length > 50000) throw new HttpError(413, "Request too large.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
export function failure(error: unknown) {
  if (error instanceof z.ZodError)
    return Response.json(
      {
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error("platform_request_failed", {
    type: error instanceof Error ? error.name : "unknown",
  });
  return Response.json(
    { error: "Something went wrong. Please retry or contact Coach Tae." },
    { status: 500 },
  );
}
export const uuid = z.string().uuid();
export const kind = z.enum(["private", "group"]);
export async function assertCoachTaeAccount(stripe: Stripe) {
  const account = await stripe.accounts.retrieve(null);
  if (account.id !== liveAccount)
    throw new HttpError(
      503,
      "Stripe credentials do not belong to the approved CoachTae account.",
    );
}
export async function verifiedPrice(key: ProductKey) {
  const id = required(catalog[key].env);
  if (!/^price_[A-Za-z0-9]+$/.test(id))
    throw new HttpError(503, "A verified Stripe Price ID is required.");
  const stripe = payments();
  await assertCoachTaeAccount(stripe);
  const price = await stripe.prices.retrieve(id, { expand: ["product"] });
  if (
    price.livemode ||
    !validPrice(key, price) ||
    typeof price.product === "string" ||
    price.product.deleted ||
    !price.product.active
  )
    throw new HttpError(
      503,
      "Stripe price does not match the configured catalog or payment mode.",
    );
  return price.id;
}
export async function customer(familyId: string, email: string) {
  const client = db();
  const family = checked(
    await client
      .from("ct_families")
      .select("stripe_customer_id")
      .eq("id", familyId)
      .single(),
  );
  if (family!.stripe_customer_id) return family!.stripe_customer_id as string;
  const result = await payments().customers.create(
    { email, metadata: { family_id: familyId } },
    { idempotencyKey: `ct-customer-${familyId}` },
  );
  checked(
    await client
      .from("ct_families")
      .update({ stripe_customer_id: result.id })
      .eq("id", familyId)
      .is("stripe_customer_id", null),
  );
  return result.id;
}

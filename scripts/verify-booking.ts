// Read-only inventory. Run only with securely injected Vercel project variables.
// Never prints key values or customer / athlete records.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw Error(`Missing variable: ${name}`);
  return value;
};
async function main() {
  const stripe = new Stripe(required("STRIPE_SECRET_KEY"));
  const account = await stripe.accounts.retrieveCurrent();
  if (account.id !== "acct_1UVeHrQGpLTTSzQv")
    throw Error("Stripe account mismatch. Stopping.");
  console.log("Verified expected Coach Tae Stripe account.");
  for (const name of Object.keys(process.env).filter(
    (n) => n.includes("STRIPE") && n.includes("PRICE"),
  )) {
    const id = required(name);
    if (!id.startsWith("price_")) throw Error(`Invalid Price ID in ${name}`);
    const price = await stripe.prices.retrieve(id, { expand: ["product"] });
    console.log({
      variable: name,
      id: price.id,
      active: price.active,
      currency: price.currency,
      amount: price.unit_amount,
      recurring: price.recurring?.interval ?? null,
      product:
        typeof price.product === "object" && !("deleted" in price.product)
          ? price.product.name
          : price.product,
    });
  }
  const db = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
  // Count-only queries never retrieve existing parent or athlete data.
  for (const table of [
    "ct_session_types",
    "ct_offers",
    "ct_sessions",
    "ct_native_bookings",
    "ct_package_credits",
    "ct_notifications",
  ]) {
    const { error, count } = await db
      .from(table)
      .select("*", { count: "exact", head: true });
    console.log({
      table,
      available: !error,
      count: count ?? null,
      errorCode: error?.code ?? null,
    });
  }
  console.log(
    "Schema inventory and RLS inspection still require authorized SQL access. This script does not apply migrations, activate prices, send email, or make a payment.",
  );
}
main().catch(() => {
  console.error(
    "Service verification failed. Check secure variable bindings and service permissions; no secrets were logged.",
  );
  process.exitCode = 1;
});

import type Stripe from "stripe";
import { catalog, validPrice, type ProductKey } from "./catalog";
import { liveAccount } from "./live-catalog";

/** Read-only preflight. Never inspect another business's catalog or select live prices. */
export async function auditTestCatalog(
  stripe: Stripe,
  env: Partial<NodeJS.ProcessEnv>,
) {
  const account = await stripe.accounts.retrieveCurrent();
  if (account.id !== liveAccount) throw new Error("CoachTaeAccountMismatch");
  const prices = await stripe.prices
    .list({ active: true, limit: 100, expand: ["data.product"] })
    .autoPagingToArray({ limit: 1000 });
  const mappings: Record<string, unknown> = {};
  const blockers: string[] = [];
  for (const key of Object.keys(catalog) as ProductKey[]) {
    const item = catalog[key];
    const matches = prices.filter((price) => {
      if (
        price.livemode ||
        !validPrice(key, price) ||
        typeof price.product === "string" ||
        price.product.deleted ||
        !price.product.active
      )
        return false;
      const name = price.product.name.toLowerCase();
      return key.startsWith("private")
        ? name.includes("private")
        : key.startsWith("group")
          ? name.includes("group")
          : name.includes("qb") && name.includes("lab");
    });
    const configured = env[item.env];
    const exact = configured
      ? matches.filter((price) => price.id === configured)
      : matches;
    mappings[item.env] =
      exact.length === 1
        ? {
            status: configured
              ? "verified configured test price"
              : "verified candidate; runtime binding required",
            id: exact[0].id,
          }
        : {
            status: exact.length ? "ambiguous" : "missing or mismatched",
            candidate_ids: matches.map((price) => price.id),
          };
    if (exact.length !== 1 || !configured)
      blockers.push(
        `Bind the existing matching test Price ID for ${item.env}; no product was created`,
      );
  }
  return { account: account.id, mappings, blockers };
}

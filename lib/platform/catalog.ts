export const catalog = {
  group: {
    name: "Group training",
    amount: 6000,
    credits: 1,
    kind: "group",
    env: "STRIPE_PRICE_GROUP",
  },
  private: {
    name: "Private training",
    amount: 8500,
    credits: 1,
    kind: "private",
    env: "STRIPE_PRICE_PRIVATE",
  },
  group_pack: {
    name: "3 group sessions",
    amount: 15000,
    credits: 3,
    kind: "group",
    env: "STRIPE_PRICE_GROUP_PACK",
  },
  private_pack: {
    name: "3 private sessions",
    amount: 24000,
    credits: 3,
    kind: "private",
    env: "STRIPE_PRICE_PRIVATE_PACK",
  },
  lab_monthly: {
    name: "QB Lab monthly",
    amount: 999,
    interval: "month",
    env: "STRIPE_PRICE_LAB_MONTHLY",
  },
  lab_annual: {
    name: "QB Lab annual",
    amount: 7999,
    interval: "year",
    env: "STRIPE_PRICE_LAB_ANNUAL",
  },
} as const;
export type ProductKey = keyof typeof catalog;
export function isProductKey(value: string): value is ProductKey {
  return Object.hasOwn(catalog, value);
}
export function entitled(status: string, until: string, now = Date.now()) {
  return ["active", "trialing"].includes(status) && Date.parse(until) > now;
}
export type PriceShape = {
  active: boolean;
  currency: string;
  unit_amount: number | null;
  type: string;
  recurring: {
    interval: string;
    interval_count: number;
    usage_type?: string;
  } | null;
};
export function validPrice(key: ProductKey, price: PriceShape) {
  const item = catalog[key];
  return (
    price.active &&
    price.currency === "usd" &&
    price.unit_amount === item.amount &&
    ("interval" in item
      ? price.type === "recurring" &&
        price.recurring?.interval === item.interval &&
        price.recurring?.interval_count === 1 &&
        price.recurring?.usage_type !== "metered"
      : price.type === "one_time" && price.recurring === null)
  );
}

/** Training credits have no verified redemption bridge into Calendly. */
export function requiresNativeBooking(key: ProductKey) {
  return !key.startsWith("lab_");
}

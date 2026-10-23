import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), create: vi.fn() }));
vi.mock("stripe", () => ({
  default: class {
    prices = { retrieve: mocks.retrieve };
    checkout = { sessions: { create: mocks.create } };
  },
}));
import { monthlyCheckout } from "@/server/qb-lab/billing/stripe";
const input = {
  account: "synthetic-adult",
  athlete: "synthetic-athlete",
  attempt: "synthetic-attempt",
  origin: "https://stage.example",
};
const config = { secret: "sk_test_synthetic", price: "price_approved" };
const price = {
  id: "price_approved",
  livemode: false,
  active: true,
  type: "recurring",
  currency: "usd",
  unit_amount: 1000,
  billing_scheme: "per_unit",
  recurring: { interval: "month", interval_count: 1, usage_type: "licensed" },
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.retrieve.mockResolvedValue(price);
  mocks.create.mockResolvedValue({
    livemode: false,
    url: "https://checkout.stripe.com/c/pay/synthetic",
  });
});
it("creates only configured monthly test subscriptions with account-derived pairing and an idempotency key", async () => {
  await expect(monthlyCheckout(input, config)).resolves.toEqual({
    url: "https://checkout.stripe.com/c/pay/synthetic",
  });
  expect(mocks.retrieve).toHaveBeenCalledWith("price_approved");
  expect(mocks.create).toHaveBeenCalledWith(
    expect.objectContaining({
      mode: "subscription",
      line_items: [{ price: "price_approved", quantity: 1 }],
      client_reference_id: "synthetic-adult",
      metadata: {
        account_id: "synthetic-adult",
        athlete_id: "synthetic-athlete",
      },
    }),
    {
      idempotencyKey:
        "qb-monthly:synthetic-adult:synthetic-athlete:synthetic-attempt",
    },
  );
});
it("refuses live, annual, metered or inactive prices before creating a checkout", async () => {
  for (const invalid of [
    { ...price, livemode: true },
    { ...price, active: false },
    { ...price, recurring: { ...price.recurring, interval: "year" } },
    { ...price, recurring: { ...price.recurring, usage_type: "metered" } },
  ]) {
    mocks.retrieve.mockResolvedValue(invalid);
    await expect(monthlyCheckout(input, config)).rejects.toThrow(
      "MONTHLY_TEST_PRICE_REQUIRED",
    );
  }
  expect(mocks.create).not.toHaveBeenCalled();
});
it("never returns an external or live checkout redirect", async () => {
  mocks.create.mockResolvedValue({
    livemode: true,
    url: "https://checkout.stripe.com/live",
  });
  await expect(monthlyCheckout(input, config)).rejects.toThrow(
    "CHECKOUT_UNAVAILABLE",
  );
  mocks.create.mockResolvedValue({
    livemode: false,
    url: "https://evil.example",
  });
  await expect(monthlyCheckout(input, config)).rejects.toThrow(
    "CHECKOUT_UNAVAILABLE",
  );
});

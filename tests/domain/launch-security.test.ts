import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  client: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("@/server/qb-lab/accounts/config", () => ({
  accountConfig: mocks.config,
}));
vi.mock("@/server/qb-lab/accounts/session", () => ({
  accountClient: mocks.client,
  verifiedAccount: mocks.verify,
}));
import { guardedCoach } from "@/server/qb-lab/accounts/coach-guard";
import { AccountError } from "@/server/qb-lab/accounts/http";
import {
  billingConfig,
  receiveStripeEvent,
} from "@/server/qb-lab/billing/stripe";
import { operationalError } from "@/server/qb-lab/operations/errors";
import { POST as webhook } from "@/app/api/qb-lab/billing/webhook/route";
import Stripe from "stripe";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.config.mockReturnValue({ origin: "https://stage.example" });
  mocks.client.mockResolvedValue({});
});
describe("coach route authorization", () => {
  it("fails closed and never reads bodies without infrastructure", async () => {
    mocks.config.mockReturnValue(null);
    const request = new Request("https://stage.example/api", {
      method: "POST",
      body: "synthetic",
    });
    expect((await guardedCoach(request)).status).toBe(503);
    expect(request.bodyUsed).toBe(false);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("denies athlete/guardian roles and unauthenticated identities, even with forged headers", async () => {
    const request = new Request("https://stage.example/api", {
      headers: { "x-role": "coach" },
    });
    for (const role of ["adult", "guardian"]) {
      mocks.verify.mockResolvedValue({ id: "synthetic", role });
      expect((await guardedCoach(request)).status).toBe(403);
    }
    mocks.verify.mockRejectedValue(new AccountError(401, "SIGN_IN_REQUIRED"));
    expect((await guardedCoach(request)).status).toBe(401);
  });
  it("requires Origin on writes and keeps even verified coach services disabled", async () => {
    mocks.verify.mockResolvedValue({ id: "synthetic", role: "coach" });
    expect(
      (await guardedCoach(new Request("https://stage.example/api"))).status,
    ).toBe(503);
    expect(
      (
        await guardedCoach(
          new Request("https://stage.example/api", { method: "POST" }),
        )
      ).status,
    ).toBe(403);
  });
});
it("billing rejects live keys and production, and the unprovisioned webhook never reads/acknowledges events", async () => {
  const env = {
    QB_LAB_BILLING_STAGE: "synthetic-test",
    QB_LAB_STRIPE_SECRET_KEY: "sk_test_synthetic",
    QB_LAB_STRIPE_MONTHLY_PRICE_ID: "price_synthetic",
  };
  expect(billingConfig({})).toBeNull();
  expect(billingConfig(env)).not.toBeNull();
  expect(billingConfig({ ...env, VERCEL_ENV: "production" })).toBeNull();
  expect(
    billingConfig({ ...env, QB_LAB_STRIPE_SECRET_KEY: "sk_live_never" }),
  ).toBeNull();
  expect((await webhook()).status).toBe(503);
});
it("verifies webhook signatures, rejects live/replayed stale envelopes and fails delivery if durable acceptance fails", async () => {
  const secret = "whsec_synthetic_only";
  const now = Math.floor(Date.now() / 1000);
  const raw = JSON.stringify({
    id: "evt_synthetic",
    type: "customer.subscription.updated",
    livemode: false,
    data: { object: {} },
  });
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload: raw,
    secret,
    timestamp: now,
  });
  const sink = { accept: vi.fn().mockResolvedValue(undefined) };
  await expect(
    receiveStripeEvent(raw, signature, secret, sink, now),
  ).resolves.toEqual({ accepted: true });
  expect(sink.accept).toHaveBeenCalledTimes(1);
  await expect(
    receiveStripeEvent(raw + " ", signature, secret, sink, now),
  ).rejects.toThrow();
  await expect(
    receiveStripeEvent(raw, signature, secret, sink, now + 301),
  ).rejects.toThrow();
  const live = raw.replace('"livemode":false', '"livemode":true');
  await expect(
    receiveStripeEvent(
      live,
      Stripe.webhooks.generateTestHeaderString({
        payload: live,
        secret,
        timestamp: now,
      }),
      secret,
      sink,
      now,
    ),
  ).rejects.toThrow("Live billing disabled");
  sink.accept.mockRejectedValue(new Error("Synthetic persistence failure"));
  await expect(
    receiveStripeEvent(raw, signature, secret, sink, now),
  ).rejects.toThrow("Synthetic persistence failure");
});
it("redacted diagnostics contain only allowlisted operational dimensions", () => {
  const event = operationalError(
    { routeType: "secret query token", routerKind: "athlete-name" },
    "secret",
  );
  expect(event).toMatchObject({
    routeType: "unknown",
    router: "unknown",
    runtime: "node",
  });
  expect(JSON.stringify(event)).not.toMatch(/secret|athlete-name/);
});
it('error hook is off by default, excludes the public site, and never logs sensitive error/request fields', async () => {
  const { onRequestError } = await import('@/instrumentation');
  const log = vi.spyOn(console,'error').mockImplementation(() => {});
  const context = { routerKind: 'App Router', routeType: 'route', routePath: '/api/qb-lab/[private]', revalidateReason: undefined };
  const request = { path: '/api/qb-lab/account?token=secret', method: 'POST', headers: { authorization: 'secret' } };
  try {
    vi.stubEnv('QB_LAB_ERROR_LOGGING','');
    await onRequestError(new Error('child-name-secret'),request,context as never);expect(log).not.toHaveBeenCalled();
    vi.stubEnv('QB_LAB_ERROR_LOGGING','redacted-console');
    await onRequestError(new Error('child-name-secret'),{...request,path:'/'},context as never);expect(log).not.toHaveBeenCalled();
    await onRequestError(new Error('child-name-secret'),request,context as never);
    expect(log).toHaveBeenCalledTimes(1);expect(log.mock.calls[0][0]).not.toMatch(/secret|token|authorization|private|child/);
  } finally { log.mockRestore();vi.unstubAllEnvs(); }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { runJobs } from "../lib/platform/jobs";
function fixture(kind = "booking_confirmed", version = 1) {
  const writes: { path: string; body: Record<string, unknown> }[] = [],
    sent: { to: string; subject: string; body: string; key: string }[] = [];
  const client = createClient(
    "https://supabase.example.invalid",
    "fixture-key",
    {
      global: {
        fetch: async (url, init) => {
          const path = String(url);
          if (init?.body)
            writes.push({ path, body: JSON.parse(String(init.body)) });
          let data: unknown = null;
          if (path.includes("ct_claim_jobs"))
            data = [
              {
                id: "job_fixture",
                kind,
                family_id: "family_fixture",
                attempts: 1,
                dedupe_key: "booking_fixture",
                payload:
                  kind === "refund"
                    ? { order_id: "order_fixture" }
                    : { booking_id: "booking_fixture", version },
              },
            ];
          else if (path.includes("ct_families"))
            data = { email: "parent@example.invalid" };
          else if (path.includes("ct_settings"))
            data = {
              timezone: "America/New_York",
              location: "Staging test field",
            };
          else if (path.includes("ct_bookings") && init?.method !== "PATCH")
            data = {
              id: "booking_fixture",
              status: "confirmed",
              version: 1,
              ct_slots: {
                kind: "private",
                starts_at: new Date(Date.now() + 96 * 3600000).toISOString(),
              },
            };
          else if (path.includes("ct_orders"))
            data = {
              id: "order_fixture",
              status: "refund_pending",
              payment_intent_id: "pi_fixture",
              amount: 8500,
            };
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
      },
    },
  );
  const send = async (
    to: string,
    subject: string,
    body: string,
    key: string,
  ) => {
    sent.push({ to, subject, body, key });
  };
  return {
    client,
    send,
    writes,
    sent,
    refund: async () => ({ status: "succeeded", settledAmount: 8500 }),
  };
}
test("confirmation delivery contains correct booking and reuses a stable provider idempotency key", async () => {
  process.env.APP_URL = "https://staging.example.invalid";
  const f = fixture();
  const r = await runJobs(f);
  assert.equal(r.succeeded, 1);
  assert.equal(f.sent[0].to, "parent@example.invalid");
  assert.match(f.sent[0].subject, /Booking confirmed/);
  assert.match(f.sent[0].body, /Staging test field/);
  assert.match(f.sent[0].body, /booking_fixture/);
  assert.equal(f.sent[0].key, "ct-job_fixture-family");
  assert.ok(
    f.writes.some((w) => w.path.includes("ct_outbox") && w.body.completed_at),
  );
});
test("delivery failure schedules backoff and does not mark a job complete", async () => {
  const f = fixture();
  const r = await runJobs({
    ...f,
    send: async () => {
      throw new Error("EmailProvider429");
    },
  });
  assert.equal(r.failed, 1);
  assert.ok(
    f.writes.some(
      (w) => w.body.last_error === "EmailProvider429" && w.body.run_at,
    ),
  );
  assert.equal(
    f.writes.some((w) => w.body.completed_at),
    false,
  );
});
test("outdated reminders are skipped after rescheduling", async () => {
  const f = fixture("reminder", 2);
  assert.equal((await runJobs(f)).succeeded, 1);
  assert.equal(f.sent.length, 0);
});
test("failed late-payment fulfillment retries a refund using an order-scoped idempotency key", async () => {
  const f = fixture("refund");
  const refunds: { intent: string; key: string }[] = [];
  await runJobs({
    ...f,
    refund: async (intent, key) => {
      refunds.push({ intent, key });
      return { status: "succeeded", settledAmount: 8500 };
    },
  });
  assert.deepEqual(refunds, [
    { intent: "pi_fixture", key: "ct-refund-order_fixture" },
  ]);
  assert.ok(f.writes.some((w) => w.path.includes("/rpc/ct_apply_refund")));
});

test("a pending automatic refund remains queued and is never marked settled", async () => {
  const f = fixture("refund");
  const result = await runJobs({
    ...f,
    refund: async () => ({ status: "pending" }),
  });
  assert.equal(result.failed, 1);
  assert.equal(
    f.writes.some((w) => w.path.includes("/rpc/ct_apply_refund")),
    false,
  );
  assert.equal(
    f.writes.some((w) => w.body.completed_at),
    false,
  );
  assert.ok(f.writes.some((w) => w.body.last_error === "RefundNotSettled"));
});

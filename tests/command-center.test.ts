import { test } from "node:test";
import assert from "node:assert/strict";
import {
  authorized,
  signedRequest,
  handle,
  snapshot,
} from "../lib/integrations/command-center.mjs";
const secret = "test-only-command-center-key-".repeat(3),
  origin = "https://coachtaeqb.com",
  path = "/api/command-center";
test("business bridge rejects unsigned, expired and cross-origin signatures before any provider read", async () => {
  const signed = signedRequest(origin, path, secret);
  const request = new Request(origin + path, {
    headers: { authorization: `DCC ${signed.timestamp}:${signed.signature}` },
  });
  assert.equal(authorized(request, secret), true);
  assert.equal(
    authorized(
      new Request("https://wrong.example" + path, { headers: request.headers }),
      secret,
    ),
    false,
  );
  assert.equal(authorized(request, secret, Date.now() + 70000), false);
  const denied = await handle(
    new Request(origin + path),
    { business: "coach-tae", tables: {}, payments: true },
    { NODE_ENV: "test", COMMAND_CENTER_SECRET: secret },
    async () => {
      throw Error("must not read");
    },
  );
  assert.equal(denied.status, 401);
});
test("bridge reads only allowlisted fields and withholds partial pagination as unavailable", async () => {
  const config = {
    business: "coach-tae",
    urlKey: "DB_URL",
    dbKey: "DB_KEY",
    payments: false,
    tables: { athletes: ["ct_athletes", "id,name"] },
  };
  let calls = 0;
  const r = await snapshot(
    config,
    {
      NODE_ENV: "test",
      DB_URL: "https://test.supabase.co",
      DB_KEY: "test-only",
    },
    async (url) => {
      assert.match(String(url), /select=id%2Cname/);
      calls++;
      return Response.json([{ id: "athlete", name: "Test only" }]);
    },
  );
  assert.equal(r.records.athletes.status, "Connected");
  assert.equal(calls, 1);
  const failed = await snapshot(
    config,
    {
      NODE_ENV: "test",
      DB_URL: "https://test.supabase.co",
      DB_KEY: "test-only",
    },
    async () => new Response("", { status: 403 }),
  );
  assert.equal(failed.records.athletes.status, "Unavailable");
  assert.equal(failed.records.athletes.measuredAt, null);
});
test("DMV bridge refuses Coach Tae financial account and never reads its payments", async () => {
  let calls = 0;
  const r = await snapshot(
    { business: "dmv-attack", tables: {}, payments: true },
    { NODE_ENV: "test", STRIPE_SECRET_KEY: "test-only" },
    async () => {
      calls++;
      return Response.json({ id: "acct_1UVeHrQGpLTTSzQv" });
    },
  );
  assert.equal(calls, 1);
  assert.equal(r.payments.status, "Unavailable");
  assert.match(r.payments.reason, /isolation/);
});

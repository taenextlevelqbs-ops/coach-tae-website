import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { liveAccount, livePrices } from "../lib/platform/live-catalog";
import { catalog } from "../lib/platform/catalog";

test("existing live price audit uses GET only, verifies account/intervals and never activates payments", () => {
  const folder = mkdtempSync(join(tmpdir(), "coach-price-audit-"));
  const mock = join(folder, "stripe.mjs");
  writeFileSync(
    mock,
    `
    import assert from 'node:assert/strict';
    const prices=${JSON.stringify(livePrices)}, catalog=${JSON.stringify(catalog)};
    globalThis.fetch=async(url,options)=>{
      assert.equal(options.method,'GET');
      if(url==='https://api.stripe.com/v1/account') return Response.json({id:process.env.AUDIT_SCENARIO==='wrong-account'?'acct_unrelated':${JSON.stringify(liveAccount)}});
      const entry=Object.entries(prices).find(([,id])=>url==='https://api.stripe.com/v1/prices/'+id+'?expand%5B%5D=product');
      assert.ok(entry,'Only the six supplied price resources may be read');
      const [name]=entry, item=catalog[name];
      return Response.json({active:true,livemode:true,currency:'usd',unit_amount:item.amount,product:{active:true},type:item.interval?'recurring':'one_time',recurring:item.interval?{interval:process.env.AUDIT_SCENARIO==='wrong-interval'?'week':item.interval,interval_count:1}:null});
    };
  `,
  );
  try {
    for (const scenario of ["matching", "wrong-account", "wrong-interval"]) {
      const result = spawnSync(
        process.execPath,
        ["--import", mock, "--import", "tsx", "scripts/check-live-prices.ts"],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            STRIPE_LIVE_READ_KEY: "rk_live_fixture_read_only",
            AUDIT_SCENARIO: scenario,
          },
        },
      );
      assert.equal(
        result.status,
        scenario === "matching" ? 0 : 1,
        result.stderr,
      );
      assert.ok(!result.stdout.includes("rk_live_fixture_read_only"));
      if (scenario === "matching") {
        assert.equal(result.stdout.trim().split("\n").length, 6);
        assert.match(result.stdout, /payments not enabled/);
      }
      if (scenario === "wrong-account")
        assert.match(result.stderr, /does not match CoachTae/);
      if (scenario === "wrong-interval")
        assert.match(result.stdout, /MISMATCH/);
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("occupied-time dry run does not contact Supabase or print appointment identifiers", () => {
  const folder = mkdtempSync(join(tmpdir(), "coach-import-"));
  const file = join(folder, "appointments.json"),
    mock = join(folder, "network.mjs");
  writeFileSync(
    mock,
    "globalThis.fetch=()=>{throw new Error('No network allowed in dry run')};",
  );
  writeFileSync(
    file,
    JSON.stringify([
      {
        external_id: "private-appointment-identifier",
        starts_at: "2030-01-03T16:00:00-05:00",
        ends_at: "2030-01-03T17:00:00-05:00",
      },
    ]),
  );
  try {
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        mock,
        "--import",
        "tsx",
        "scripts/import-busy-times.ts",
        `--input=${file}`,
      ],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Validated 1 occupied intervals/);
    assert.ok(!result.stdout.includes("private-appointment-identifier"));
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("production build guard blocks unaccepted commits, missing configuration and live Stripe without printing secrets", () => {
  const sha = "a".repeat(40);
  const run = (env: Partial<NodeJS.ProcessEnv>) =>
    spawnSync(process.execPath, ["scripts/check-production-cutover.mjs"], {
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
  const fixture: Partial<NodeJS.ProcessEnv> = {
    VERCEL_ENV: "production",
    VERCEL_GIT_COMMIT_SHA: sha,
    BOOKING_CUTOVER_VERIFIED_COMMIT: sha,
    PLATFORM_BOOKING_ENABLED: "true",
    APP_URL: "https://coachtaeqb.com",
    NEXT_PUBLIC_SUPABASE_URL: "https://fqmojknpqhogotyvxyie.supabase.co",
    STRIPE_LIVE_ENABLED: "false",
    STRIPE_SECRET_KEY: "sk_test_fixture_no_real_credential",
    CRON_SECRET: "fixture-not-a-secret-".repeat(3),
  };
  for (const name of [
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_PRIVATE",
    "STRIPE_PRICE_GROUP",
    "STRIPE_PRICE_PRIVATE_PACK",
    "STRIPE_PRICE_GROUP_PACK",
    "STRIPE_PRICE_LAB_MONTHLY",
    "STRIPE_PRICE_LAB_ANNUAL",
    "RESEND_API_KEY",
    "EMAIL_FROM",
  ])
    fixture[name] = "fixture-value-not-a-secret";
  assert.equal(run(fixture).status, 0);
  for (const overrides of [
    { BOOKING_CUTOVER_VERIFIED_COMMIT: "b".repeat(40) },
    {
      STRIPE_SECRET_KEY: "sk_live_fixture_unauthorized",
      STRIPE_LIVE_ENABLED: "true",
    },
    { SUPABASE_SERVICE_ROLE_KEY: "" },
  ]) {
    const result = run({ ...fixture, ...overrides });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /cutover blocked/);
    assert.ok(!result.stderr.includes("sk_live_fixture_unauthorized"));
    assert.ok(!result.stderr.includes("fixture-value-not-a-secret"));
  }
  assert.equal(run({ VERCEL_ENV: "preview" }).status, 0);
  assert.equal(
    run({
      VERCEL_ENV: "production",
      PLATFORM_BOOKING_ENABLED: "false",
      STRIPE_LIVE_ENABLED: "false",
    }).status,
    1,
  );
  assert.equal(
    run({
      VERCEL_ENV: "production",
      PLATFORM_BOOKING_ENABLED: "false",
      STRIPE_LIVE_ENABLED: "true",
    }).status,
    1,
  );
});

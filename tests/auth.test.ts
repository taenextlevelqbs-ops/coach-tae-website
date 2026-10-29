import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { authMessage, OTP_COOLDOWN_SECONDS } from "../lib/platform/auth";
import { identity, HttpError } from "../lib/platform/server";

test("auth errors explain limits without exposing upstream messages", () => {
  assert.equal(OTP_COOLDOWN_SECONDS, 60);
  assert.match(authMessage({ status: 429 }), /Wait a few minutes/);
  assert.match(authMessage({ code: "over_email_send_rate_limit" }), /Too many/);
  assert.match(authMessage({ code: "otp_expired" }), /expired/);
  assert.ok(
    !authMessage({ message: "sensitive upstream details" }).includes(
      "sensitive",
    ),
  );
});
test("branded email uses OTP and offers no magic link", () => {
  const html = readFileSync("supabase/templates/email-otp.html", "utf8");
  assert.match(html, /Coach Tae/);
  assert.match(html, /{{ \.Token }}/);
  assert.ok(!html.includes("ConfirmationURL"));
});
test("server identity rejects invalid sessions and parent coach access; allows authorized coach", async () => {
  const originalFetch = globalThis.fetch;
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://auth-fixture.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fixture-not-a-secret";
  let coach = false,
    valid = true,
    profileWrites = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/auth/v1/user"))
      return Response.json(
        valid
          ? {
              id: "11111111-1111-4111-8111-111111111111",
              email: "parent@example.invalid",
            }
          : { message: "Invalid JWT" },
        { status: valid ? 200 : 401 },
      );
    if (url.includes("/rest/v1/ct_coaches"))
      return Response.json(
        coach ? { user_id: "11111111-1111-4111-8111-111111111111" } : null,
      );
    if (url.includes("/rest/v1/ct_families")) {
      profileWrites++;
      return new Response(null, { status: 201 });
    }
    throw new Error("Unexpected upstream request");
  };
  const req = (method = "GET") =>
    new Request("https://example.invalid/api/platform/admin", {
      method,
      headers: { Authorization: "Bearer fixture-token" },
    });
  try {
    await assert.rejects(
      identity(new Request("https://example.invalid"), true),
      (e: unknown) => e instanceof HttpError && e.status === 401,
    );
    for (const method of ["GET", "POST"])
      await assert.rejects(
        identity(req(method), true),
        (e: unknown) => e instanceof HttpError && e.status === 403,
      );
    assert.equal(profileWrites, 0);
    assert.equal((await identity(req())).isCoach, false);
    assert.equal(profileWrites, 1);
    coach = true;
    assert.equal((await identity(req(), true)).isCoach, true);
    valid = false;
    await assert.rejects(
      identity(req(), true),
      (e: unknown) => e instanceof HttpError && e.status === 401,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  }
});

test("Auth configuration tool audits safely and only patches SMTP and OTP templates", async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const folder = mkdtempSync(join(tmpdir(), "coach-auth-"));
  const mock = join(folder, "upstream.mjs");
  writeFileSync(
    mock,
    `
    import assert from 'node:assert/strict';
    let writes=0;
    let configured={};
    globalThis.fetch=async (url,options)=>{
      assert.equal(url,'https://api.supabase.com/v1/projects/fqmojknpqhogotyvxyie/config/auth');
      if(options.method==='PATCH') {
        writes++;
        const body=JSON.parse(options.body);
        configured=body;
        assert.equal(body.smtp_host,'smtp.resend.com');
        assert.equal(body.smtp_pass,'fixture-resend-key');
        assert.equal(body.mailer_otp_length,6);
        assert.match(body.mailer_templates_confirmation_content,/{{ \\.Token }}/);
        assert.equal(body.mailer_templates_confirmation_content,body.mailer_templates_magic_link_content);
        assert.deepEqual(Object.keys(body).sort(),['smtp_host','smtp_port','smtp_user','smtp_pass','smtp_admin_email','smtp_sender_name','mailer_otp_length','mailer_subjects_confirmation','mailer_templates_confirmation_content','mailer_subjects_magic_link','mailer_templates_magic_link_content'].sort());
      }
      return Response.json({smtp_pass:'must-never-appear',smtp_host:'smtp.resend.com',rate_limit_email_sent:2,disable_signup:false,mailer_otp_length:6,...configured});
    };
    process.on('exit',()=>{assert.equal(writes,process.argv.includes('--apply')?1:0)});
  `,
  );
  try {
    for (const args of [[], ["--apply"]]) {
      const output = execFileSync(
        process.execPath,
        [
          "--import",
          mock,
          "--import",
          "tsx",
          "scripts/configure-auth.ts",
          ...args,
        ],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            SUPABASE_ACCESS_TOKEN: "fixture-management-token",
            RESEND_API_KEY: "fixture-resend-key",
            AUTH_EMAIL_FROM: "auth@example.invalid",
          },
        },
      );
      assert.match(output, /rate_limit_email_sent/);
      for (const secret of [
        "must-never-appear",
        "fixture-resend-key",
        "fixture-management-token",
      ])
        assert.ok(!output.includes(secret));
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

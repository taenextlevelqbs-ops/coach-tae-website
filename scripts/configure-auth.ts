/** Run with node --env-file-if-exists=.env.local --import tsx scripts/configure-auth.ts [--apply]. */
import { readFileSync } from "node:fs";
const project = "fqmojknpqhogotyvxyie";
const endpoint = `https://api.supabase.com/v1/projects/${project}/config/auth`;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const apply = process.argv.includes("--apply");
async function request(method: string, body?: unknown) {
  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  // Never log response bodies: configuration responses can contain SMTP passwords.
  if (!response.ok)
    throw new Error(
      `Supabase Management API ${method} returned HTTP ${response.status}`,
    );
  return (await response.json()) as Record<string, unknown>;
}
function summary(config: Record<string, unknown>) {
  const fields = [
    "site_url",
    "external_email_enabled",
    "disable_signup",
    "mailer_autoconfirm",
    "mailer_otp_length",
    "mailer_otp_exp",
    "smtp_host",
    "smtp_port",
    "smtp_admin_email",
    "smtp_sender_name",
    "smtp_max_frequency",
    "rate_limit_email_sent",
    "rate_limit_verify",
    "rate_limit_otp",
  ];
  return Object.fromEntries(
    fields
      .map((key) => [key, config[key] ?? null])
      .concat([
        [
          "confirmation_has_otp",
          String(config.mailer_templates_confirmation_content || "").includes(
            "{{ .Token }}",
          ),
        ],
        [
          "magic_link_has_otp",
          String(config.mailer_templates_magic_link_content || "").includes(
            "{{ .Token }}",
          ),
        ],
      ]),
  );
}
async function main() {
  if (!token)
    throw new Error(
      "Missing SUPABASE_ACCESS_TOKEN with Auth configuration access to project fqmojknpqhogotyvxyie.",
    );
  console.log(
    "Current Auth configuration (safe fields only):",
    summary(await request("GET")),
  );
  if (!apply) return;
  const password = process.env.RESEND_API_KEY;
  const sender = process.env.AUTH_EMAIL_FROM;
  if (!password || !sender || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(sender))
    throw new Error(
      "Apply requires RESEND_API_KEY and AUTH_EMAIL_FROM (bare verified sender email). Confirm the sender's Resend domain is verified first.",
    );
  const content = readFileSync(
    new URL("../supabase/templates/email-otp.html", import.meta.url),
    "utf8",
  );
  await request("PATCH", {
    smtp_host: "smtp.resend.com",
    smtp_port: "465",
    smtp_user: "resend",
    smtp_pass: password,
    smtp_admin_email: sender,
    smtp_sender_name: "Coach Tae QB Training",
    mailer_otp_length: 6,
    mailer_subjects_confirmation: "Your Coach Tae sign-in code",
    mailer_templates_confirmation_content: content,
    mailer_subjects_magic_link: "Your Coach Tae sign-in code",
    mailer_templates_magic_link_content: content,
  });
  const updated = await request("GET");
  if (
    updated.smtp_host !== "smtp.resend.com" ||
    String(updated.smtp_port) !== "465" ||
    updated.smtp_admin_email !== sender ||
    updated.mailer_otp_length !== 6 ||
    updated.mailer_templates_confirmation_content !== content ||
    updated.mailer_templates_magic_link_content !== content
  )
    throw new Error(
      "Auth configuration read-back did not match the requested SMTP/template settings. Inspect the project before testing delivery.",
    );
  console.log(
    "Updated Auth configuration (safe fields only):",
    summary(updated),
  );
  console.log(
    "SMTP and templates updated. Email delivery, registration, and login still require a real inbox test. Existing rate limits and security settings were preserved.",
  );
}
main().catch((error) => {
  // Fetch exceptions must not dump request headers or bodies.
  console.error(
    error instanceof Error && !/fetch|network/i.test(error.message)
      ? error.message
      : "Auth configuration request failed; check network access.",
  );
  process.exitCode = 1;
});

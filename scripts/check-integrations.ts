/** Read-only account discovery. Never deploys, creates products, sends mail, or changes a remote schema. */
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { writeFile } from "node:fs/promises";
import { auditTestCatalog } from "../lib/platform/test-catalog-audit";
const report: {
  checked_at: string;
  assessment_scope: string;
  checks: Record<string, unknown>;
  blockers: string[];
  hosted_acceptance: string;
} = {
  checked_at: new Date().toISOString(),
  assessment_scope:
    "Current execution environment only. Missing local bindings do not prove missing Vercel production variables; production settings require an authorized remote inspection.",
  checks: {},
  blockers: [],
  hosted_acceptance:
    "NOT VERIFIED — account reads do not replace end-to-end hosted testing",
};
const has = (name: string) => !!process.env[name];
function missing(names: string[]) {
  const absent = names.filter((n) => !has(n));
  report.blockers.push(
    ...absent.map(
      (n) =>
        `Unavailable in this execution environment: ${n}; production configuration not inspected`,
    ),
  );
  return absent.length > 0;
}
async function run(name: string, operation: () => Promise<unknown>) {
  try {
    report.checks[name] = await operation();
  } catch (error) {
    report.checks[name] = {
      status: "failed",
      type: error instanceof Error ? error.name : "unknown",
    };
    report.blockers.push(
      `${name}: authorized service check failed; inspect account permissions and network access`,
    );
  }
}
async function main() {
  if (
    !missing([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ])
  )
    await run("Supabase", async () => {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL !==
        "https://fqmojknpqhogotyvxyie.supabase.co"
      )
        throw new Error("CoachTaeProjectMismatch");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
        service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
          auth: { persistSession: false },
        }),
        anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          auth: { persistSession: false },
        });
      for (const [table, columns] of [
        ["ct_rules", "id,local_end,superseded_by"],
        ["ct_lessons", "id,slug,level"],
        ["ct_credit_recovery", "family_id,kind,units"],
        ["ct_legacy_busy_times", "source_ref,block_id,imported_at"],
      ]) {
        const r = await service.from(table).select(columns).limit(1);
        if (r.error) throw new Error("StagingSchemaNotReady");
      }
      const auth = await fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        signal: AbortSignal.timeout(15000),
      });
      if (!auth.ok) throw new Error("AuthSettingsUnavailable");
      const denied = await anon.from("ct_families").select("id").limit(1);
      if (!denied.error) throw new Error("AnonymousTableAccessMustBeDenied");
      return {
        status: "read-only checks passed",
        schema:
          "window, learning, recovery and legacy busy-time columns present; migration history and closure RPC not yet verified",
        legacy_calendar_reconciled:
          "unverified; table presence is not appointment reconciliation",
        anonymous_family_reads: "denied",
        actual_parent_login: "unverified",
        actual_family_RLS: "unverified",
      };
    });
  if (!missing(["STRIPE_SECRET_KEY"]))
    await run("Stripe", async () => {
      const key = process.env.STRIPE_SECRET_KEY!;
      if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_"))
        throw new Error("TestKeyRequired");
      const stripe = new Stripe(key, { timeout: 15000, maxNetworkRetries: 1 });
      const audit = await auditTestCatalog(stripe, process.env);
      report.blockers.push(...audit.blockers);
      return {
        status: "catalog read",
        account: audit.account,
        prices: audit.mappings,
        real_checkout: "unverified",
        real_webhook_delivery: "unverified",
      };
    });
  missing([
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "CRON_SECRET",
    "APP_URL",
  ]);
  if (has("RESEND_API_KEY"))
    await run("Email provider", async () => {
      const r = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw new Error("EmailDomainAccess");
      const d = await r.json();
      return {
        status: "account read",
        domains: (d.data || []).map((v: { name: string; status: string }) => ({
          name: v.name,
          status: v.status,
        })),
        real_delivery: "unverified — no messages sent by this read-only check",
      };
    });
  if (!missing(["VERCEL_TOKEN", "VERCEL_PROJECT_ID"]))
    await run("Vercel", async () => {
      const project = encodeURIComponent(process.env.VERCEL_PROJECT_ID!),
        query = has("VERCEL_TEAM_ID")
          ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID!)}`
          : "";
      const headers = { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` };
      const response = await fetch(
        `https://api.vercel.com/v9/projects/${project}${query}`,
        { headers, signal: AbortSignal.timeout(15000) },
      );
      if (!response.ok) throw new Error("VercelProjectAccess");
      const p = await response.json();
      const domains = await fetch(
        `https://api.vercel.com/v9/projects/${project}/domains${query}`,
        { headers, signal: AbortSignal.timeout(15000) },
      );
      if (!domains.ok) throw new Error("VercelDomainAccess");
      const list = await domains.json();
      if (
        !list.domains?.some((d: { name: string }) =>
          ["coachtaeqb.com", "www.coachtaeqb.com"].includes(d.name),
        )
      )
        throw new Error("ExistingProductionDomainNotLinked");
      return {
        status: "existing project verified",
        name: p.name,
        id: p.id,
        domain: "coachtaeqb.com",
        deployed_by_this_check: false,
      };
    });
  await writeFile(
    "docs/INTEGRATION-STATUS.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  if (report.blockers.length) process.exitCode = 1;
}
main().catch((error) => {
  console.error(
    "Integration check failed:",
    error instanceof Error ? error.name : "unknown",
  );
  process.exitCode = 1;
});

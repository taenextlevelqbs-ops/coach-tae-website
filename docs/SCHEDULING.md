# Hobby-compatible scheduling

The Vercel deployment configuration contains a single daily cron: `GET /api/jobs`, `0 6 * * *` (06:00 UTC). It refreshes availability, expires stale holds and recovers due outbox work. It satisfies Hobby's once-daily restriction. It is not a real-time reminder service, and Vercel cron does not run on preview deployments.

## Confirmations and payment safety

Successful booking changes and verified Stripe webhooks register an `after()` callback to process due work following the response. Database fulfillment, credit changes and notification enqueueing remain transactional and idempotent. Email delivery failures do not undo a paid booking or turn a verified webhook into a failed payment. The callback does not run daily schedule maintenance. Vercel may terminate background work at the route's 60-second duration limit; the durable outbox and external ticks are required for recovery.

Stripe verification, event handling, package credits, subscription checks, refund reconciliation, Calendly links and the public activation flag are unchanged. No production configuration has been applied by this change.

## Minute-based preview reminders and retries

An external minute tick is needed for future reminders, retries, queue backlog and callbacks interrupted by a timeout. Use the existing **staging** Supabase project's Cron, pg_net and Vault services. No GitHub Actions schedule is used for delivery: Actions schedules can be delayed or dropped and are unsuitable as a timing guarantee.

1. Deploy the `coach-tae-platform` preview first. Verify its deployment URL and configure that preview's service variables, including a strong `CRON_SECRET` (at least 32 characters). Keep live Stripe keys and the production cutover disabled.
2. In the staging Supabase project, enable Cron (`pg_cron`), pg_net and Vault if not already enabled. Inspect existing extension permissions. Vault decrypted secrets and the pg_net request queue must not be readable by `anon` or `authenticated`, including through PUBLIC grants. The installation fails closed if they are readable. Review privileges without changing unrelated applications' access blindly.
3. Enter these secrets securely in the staging project's Vault UI:

   | Vault name                      | Value                                                                                                |
   | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
   | `coach_tae_preview_jobs_url`    | The verified HTTPS `*.vercel.app` preview deployment URL ending in `/api/jobs`, with no query string |
   | `coach_tae_preview_cron_secret` | The exact preview deployment's `CRON_SECRET`                                                         |
   | `coach_tae_preview_bypass`      | Optional Vercel Deployment Protection automation bypass secret, if the preview is protected          |

4. Review and execute [the preview scheduler SQL](../supabase/operations/preview-notification-scheduler.sql) in that **staging** project. It registers one named minute job, `coach-tae-preview-notifications`. Reapplying it updates that named job; it does not duplicate jobs or unschedule any other application. The cron command contains only a fixed function call; credentials are read from Vault at execution and placed in headers, not command text or URLs. Responses contain only processed/succeeded/failed counts.
5. Verify actual execution and email delivery against the preview. The endpoint is `POST /api/jobs` and validates its bearer secret on every request. The scheduler sets `x-coach-tae-environment: preview`; production instances reject that marker. A deployment-protection bypass is passed in its designated header, never a query parameter.

Update the Vault URL when the verified preview changes. Do not point this preview job at coachtaeqb.com. Production scheduling is outside this fix and must be separately approved and configured before a future launch.

This repository implements the scheduling integration but cannot configure a hosted Supabase scheduler without the project's authorized access. Until the minute scheduler and actual email delivery are verified, timely reminders/retries are **not operationally certified**. Minute cadence also is not exact-second delivery: due jobs are claimed on the next tick, run in batches of five, and provider latency, retries and backlogs can add delay. Monitor queue age and failures.

## Verify and monitor (privileged staging SQL only)

```sql
select jobname, schedule, active
from cron.job
where jobname = 'coach-tae-preview-notifications';

-- Check recent ticks and their HTTP result without selecting request headers,
-- Vault values, email payloads or other credentials.
select ticks.requested_at, response.status_code, response.timed_out
from public.ct_preview_scheduler_runs ticks
left join net._http_response response on response.id = ticks.request_id
order by ticks.requested_at desc
limit 20;

select kind, count(*) as queued, min(run_at) as oldest_due,
       max(attempts) as most_attempts
from public.ct_outbox
where completed_at is null and run_at <= now()
group by kind;
```

Watch for a missing tick for more than a few minutes, HTTP 401 (secret mismatch), 403 (environment/protection mismatch), failed/time-out responses, old due jobs and jobs at 12 attempts. Resolve configuration/provider issues, then retry terminal jobs from the coach dashboard. pg_net retains responses for a limited time, so old missing responses do not prove success. The small tick history retains seven days. Do not log secret-bearing request headers.

To stop only this preview scheduler:

```sql
select cron.unschedule('coach-tae-preview-notifications');
```

## Local validation scope

Automated tests execute the actual operations SQL with test-only Cron/pg_net/Vault stand-ins in disposable PostgreSQL. They verify repeatable registration, Vault resolution, headers, preview targeting, secret-table protection and anonymous execution denial. No external HTTP request is sent by those SQL tests. Additional tests cover exact worker authentication, deferred event dispatch, existing outbox behavior, and Hobby-compatible Vercel schedules. Hosted cron execution and actual provider delivery still require the configuration above.

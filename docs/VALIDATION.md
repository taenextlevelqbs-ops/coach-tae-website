# Final integration validation — October 28, 2026

Historical checkpoint: current native-booking cutover changes and verification boundaries are recorded in [CUTOVER.md](CUTOVER.md).

This record covers the final-integration request. No production or preview deployment was created, no hosted schema was changed, and no live payments or booking cutover was activated.

| Check                        | Result                         | What this establishes                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`               | Passed                         | Repository lint checks                                                                                                                                                                                                              |
| `npm run typecheck`          | Passed                         | TypeScript, run after build generation completed                                                                                                                                                                                    |
| `npm test`                   | 49 passed; zero failed/skipped | All four actual migrations on isolated PostgreSQL; independent concurrent connections; booking/credit/refund/RLS protections; original curriculum; grading/achievements; Stripe SDK boundary mocks; notification retries            |
| `npm run test:e2e`           | 33 passed                      | Chromium at 375px, 820px and 1440px: parent/coach interfaces, visual schedule editing, original lesson/diagram/quiz rendering, mobile overflow checks and real HTTP rejection checks. Signed-in service flows use explicit fixtures |
| `npm run build -- --webpack` | Passed                         | Optimized production compilation, TypeScript and static generation                                                                                                                                                                  |
| Built-app smoke checks       | Passed                         | `/`, `/book`, `/portal`, `/coach`, `/coach/schedule`, `/lab` return 200 locally. Production defaults retain Calendly, hide unfinished homepage platform links, and leave integrated booking disabled                                |
| `git diff --check`           | Passed                         | No whitespace errors                                                                                                                                                                                                                |
| `npm run check:integrations` | Blocked; exits nonzero         | No Supabase, Stripe, email or Vercel bindings exist. No hosted account checks could run. Exact missing names are in `INTEGRATION-STATUS.json`                                                                                       |

## Added and exercised

The availability tests cover multi-day recurring windows, multiple windows on a day, buffered session generation, editing without cancelling existing bookings, one-time session conflicts, vacation blocks, coach rescheduling inside the parent cutoff, cancellation of entire sessions without cron reopening them, and immediate aggregate public availability.

The credit/refund tests cover private/group separation, simultaneous last-credit redemption, exact package fulfillment, duplicate event handling, eligible cancellation restoration, nonnegative available balances, explicit recovery of spent/refunded credits, cumulative partial refunds at whole-credit thresholds, settled versus pending refunds, and an immutable audit ledger.

QB Lab includes 41 original lessons and 41 scenario questions with explanations, totaling 8,673 body-text words across fundamentals, defensive recognition, passing concepts, quarterback IQ and athlete development. Learning paths contain 21 beginner, 15 intermediate and 5 advanced lessons. Schematic SVG diagrams are available for coverages, rotations, pocket movement and passing concepts. Achievements derive from actual recorded passing progress, not invented accomplishments. Tests verify content coverage, seed repeatability, preservation of coach edits, grading and badge rules. No videos, testimonials or certifications were invented.

## Unverified external requirements

No real Supabase registration/login or family permission test, Stripe test Checkout/webhook delivery, membership test clock, email delivery, Vercel preview, or scheduled job execution was possible. Existing hosted schema compatibility and existing Calendly commitments remain unverified. No actual Stripe Price IDs could be retrieved without account access. The original curriculum exists in the repository and has been exercised locally; it is not deployed into a live paid-member library.

The production domain `https://coachtaeqb.com` was supplied by the user. This run did not certify its remote deployment state. There is no new preview URL.

**The platform is not cleared for real customers.** Supply the existing service bindings securely, review/apply migrations on staging, complete actual hosted acceptance, and obtain the required live-payment/cutover approval. See [the runbook](PLATFORM.md) and [configuration names](platform.env.example). Fixture tests are not hosted signoff.

## Hobby preview cron fix — October 29, 2026

- Inspected the only Vercel cron and changed it from every five minutes to `0 6 * * *`, once daily at 06:00 UTC. Daily execution is maintenance/recovery, not timely reminders.
- Added post-response dispatch after successful booking changes and verified payment webhooks. Delivery failures do not undo fulfillment. Added authenticated POST support for minute-level preview queue processing.
- Added the optional staging Supabase Cron/pg_net/Vault integration in `supabase/operations/preview-notification-scheduler.sql`, with preview targeting, idempotent registration, protected secret queues, leases and existing retry handling. It has not been installed against a hosted project. See `SCHEDULING.md`; minute reminders require actual configuration and delivery verification.
- Lint, type checking, optimized production build, 56 backend tests and 33 browser checks passed. Scheduler SQL tests use test-only pg_net/Cron/Vault stand-ins and send no HTTP requests.
- `main`, production deployments, live payments and Calendly were not changed. GitHub API deployment-status reads were blocked by this cloud environment's network policy; local build success is not proof of Vercel preview success.

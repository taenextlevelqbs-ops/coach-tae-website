import { failure, HttpError, required } from "@/lib/platform/server";
import { runJobs } from "@/lib/platform/jobs";
import {
  authorizedJobRequest,
  matchesJobEnvironment,
} from "@/lib/platform/job-auth";
export const runtime = "nodejs";
export const maxDuration = 60;
async function handle(req: Request, maintenance: boolean) {
  try {
    if (
      !authorizedJobRequest(
        req.headers.get("authorization"),
        required("CRON_SECRET"),
      )
    )
      throw new HttpError(401, "Unauthorized.");
    if (
      !matchesJobEnvironment(
        req.headers.get("x-coach-tae-environment"),
        process.env.VERCEL_ENV,
      )
    )
      throw new HttpError(403, "Scheduler environment mismatch.");
    const result = await runJobs(undefined, { maintenance });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return failure(e);
  }
}
/** Hobby-compatible daily maintenance and queue recovery, not timely reminders. */
export async function GET(req: Request) {
  return handle(req, true);
}
/** Authenticated external minute scheduler: due notifications/refunds only. */
export async function POST(req: Request) {
  return handle(req, false);
}

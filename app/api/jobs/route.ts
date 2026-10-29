import { timingSafeEqual } from "node:crypto";
import { failure, HttpError, required } from "@/lib/platform/server";
import { runJobs } from "@/lib/platform/jobs";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req: Request) {
  try {
    const expected = Buffer.from(`Bearer ${required("CRON_SECRET")}`),
      actual = Buffer.from(req.headers.get("authorization") || "");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      throw new HttpError(401, "Unauthorized.");
    return Response.json(await runJobs(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}

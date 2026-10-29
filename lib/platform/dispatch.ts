import "server-only";
import { after } from "next/server";
import { runJobs } from "./jobs";
/** Fulfillment is already committed. Email/refund work must not delay or undo it. */
export function dispatchNotifications(
  schedule: (task: () => Promise<void>) => void = after,
  process: () => Promise<unknown> = () =>
    runJobs(undefined, { maintenance: false }),
) {
  try {
    schedule(async () => {
      try {
        await process();
      } catch (error) {
        console.error("notification_dispatch_failed", {
          type: error instanceof Error ? error.name : "unknown",
        });
      }
    });
  } catch (error) {
    console.error("notification_dispatch_failed", {
      type: error instanceof Error ? error.name : "unknown",
    });
  }
}
export function createsNotifications(path: string) {
  return new Set([
    "book",
    "bookings/manage",
    "admin/booking",
    "admin/cancel-session",
    "admin/retry",
  ]).has(path);
}

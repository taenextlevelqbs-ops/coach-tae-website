import "server-only";
import { db, required } from "./server";
import { calendarInvite, ZONE } from "./core";
import { DateTime } from "luxon";
export async function sendNotifications() {
  const d = db();
  const { data: upcoming, error: upcomingError } = await d
    .from("ct_native_bookings")
    .select("id,session_id,ct_sessions!inner(starts_at)")
    .eq("status", "confirmed")
    .gte("ct_sessions.starts_at", new Date().toISOString())
    .lte(
      "ct_sessions.starts_at",
      new Date(Date.now() + 86400000).toISOString(),
    );
  if (upcomingError) throw upcomingError;
  if (upcoming?.length) {
    const { error } = await d.from("ct_notifications").upsert(
      upcoming.map((b) => ({
        booking_id: b.id,
        kind: `reminder-${b.session_id}`,
      })),
      { onConflict: "booking_id,kind", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
  const { data: pending, error } = await d
    .from("ct_notifications")
    .select("*,ct_native_bookings(*,ct_sessions(*))")
    .is("delivered_at", null)
    .order("created_at")
    .limit(50);
  if (error) throw error;
  for (const n of pending ?? []) {
    const current = n.ct_native_bookings;
    const b = n.payload;
    const s = b.ct_sessions;
    if (
      (n.kind === "confirmation" || n.kind.startsWith("reminder-")) &&
      (current.status !== "confirmed" ||
        (n.kind.startsWith("reminder-") && current.session_id !== b.session_id))
    ) {
      const { error } = await d
        .from("ct_notifications")
        .update({ delivered_at: new Date().toISOString() })
        .eq("id", n.id);
      if (error) throw error;
      continue;
    }
    const cancelled = n.kind.startsWith("cancelled-");
    const rescheduled = n.kind.startsWith("rescheduled-");
    const reminder = n.kind.startsWith("reminder-");
    const when = DateTime.fromISO(s.starts_at)
      .setZone(ZONE)
      .toFormat("ccc, LLL d yyyy h:mm a");
    const subject = cancelled
      ? "Coach Tae appointment cancelled"
      : rescheduled
        ? "Coach Tae appointment rescheduled"
        : reminder
          ? "Coach Tae training reminder"
          : n.kind === "payment_review"
            ? "Payment needs coach review"
            : "Coach Tae booking confirmed";
    const text = cancelled
      ? `Your appointment for ${when} Eastern has been cancelled. Cancellation does not automatically issue a refund. Contact Coach Tae about payment and refunds.`
      : n.kind === "payment_review"
        ? "A payment arrived outside its booking hold. Contact Coach Tae to arrange the session or refund."
        : `Your training appointment ${rescheduled ? "has been rescheduled to" : reminder ? "is coming up on" : "is confirmed for"} ${when} Eastern. ${b.credit_id ? "Payment: prepaid package credit." : `Payment received: $${(b.amount / 100).toFixed(2)}. Payment reference: ${b.stripe_payment_id}.`} Parent: ${b.parent_name}. Athlete: ${b.athlete_name}. Parent contact: ${b.email}, ${b.phone}. ${b.offer_id ? "Your package includes this appointment plus two remaining session credits. Visit the booking page and verify your purchase email to redeem them." : ""} Contact Coach Tae for schedule changes.`;
    // One durable row per booking/kind; Resend's idempotency key covers worker retries.
    const { error: attemptError } = await d
      .from("ct_notifications")
      .update({ attempts: n.attempts + 1 })
      .eq("id", n.id);
    if (attemptError) throw attemptError;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${required("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `ct-${n.id}`,
      },
      body: JSON.stringify({
        from: required("BOOKING_FROM_EMAIL"),
        to: [b.email],
        bcc: [required("COACH_NOTIFICATION_EMAIL")],
        subject,
        text,
        attachments:
          n.kind === "confirmation" || rescheduled || reminder
            ? [
                {
                  filename: "training.ics",
                  content: Buffer.from(
                    calendarInvite(b.id, s.starts_at, s.ends_at, n.created_at),
                  ).toString("base64"),
                },
              ]
            : [],
      }),
    });
    if (!response.ok) throw new Error("Email delivery failed");
    const { error: save } = await d
      .from("ct_notifications")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", n.id);
    if (save) throw save;
  }
  return pending?.length ?? 0;
}

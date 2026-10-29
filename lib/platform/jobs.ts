import "server-only";
import { checked, db, payments, required, siteUrl } from "./server";

type Job = {
  id: string;
  kind: string;
  family_id: string;
  dedupe_key: string;
  attempts: number;
  payload: {
    booking_id?: string;
    order_id?: string;
    version?: number;
    status?: string;
  };
};
async function email(to: string, subject: string, text: string, key: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${required("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify({
      from: required("EMAIL_FROM"),
      to: [to],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`EmailProvider${response.status}`);
}
export type JobServices = {
  client: ReturnType<typeof db>;
  send: typeof email;
  refund: (
    intent: string,
    key: string,
  ) => Promise<{ status?: string | null; settledAmount?: number }>;
};
export async function runJobs(
  services: JobServices = {
    client: db(),
    send: email,
    refund: async (intent, key) => {
      const stripe = payments();
      const refund = await stripe.refunds.create(
        { payment_intent: intent },
        { idempotencyKey: key },
      );
      const current =
        refund.status === "pending"
          ? await stripe.refunds.retrieve(refund.id)
          : refund;
      const refunds = await stripe.refunds
        .list({ payment_intent: intent, limit: 100 })
        .autoPagingToArray({ limit: 1000 });
      return {
        status: current.status,
        settledAmount: refunds
          .filter((r) => r.status === "succeeded")
          .reduce((sum, r) => sum + r.amount, 0),
      };
    },
  },
) {
  const { client, send, refund } = services;
  checked(
    await client
      .from("ct_bookings")
      .update({ status: "expired" })
      .eq("status", "held")
      .lt("hold_until", new Date().toISOString()),
  );
  // Extend the rolling schedule; never changes booked slots.
  checked(await client.rpc("ct_publish", { p_days: 60 }));
  const jobs = checked(
    await client.rpc("ct_claim_jobs", { p_limit: 5 }),
  ) as Job[];
  let sent = 0,
    failed = 0;
  await Promise.all(
    jobs.map(async (job) => {
      try {
        if (job.kind === "refund") {
          const order = checked(
            await client
              .from("ct_orders")
              .select("*")
              .eq("id", job.payload.order_id)
              .single(),
          );
          if (order.status === "refund_pending") {
            if (!order.payment_intent_id)
              throw new Error("MissingPaymentIntent");
            const result = await refund(
              order.payment_intent_id,
              `ct-refund-${order.id}`,
            );
            if (
              result.status !== "succeeded" ||
              result.settledAmount !== order.amount
            )
              throw new Error("RefundNotSettled");
            checked(
              await client.rpc("ct_apply_refund", {
                p_event: `automatic-refund:${order.id}`,
                p_intent: order.payment_intent_id,
              }),
            );
          }
        } else {
          const family = checked(
            await client
              .from("ct_families")
              .select("email")
              .eq("id", job.family_id)
              .single(),
          );
          let subject = "Coach Tae · Training update",
            text = "";
          let skip = false;
          if (job.payload.booking_id) {
            const b = checked(
              await client
                .from("ct_bookings")
                .select("*,ct_slots(*)")
                .eq("id", job.payload.booking_id)
                .single(),
            );
            if (
              job.kind === "reminder" &&
              (b.status !== "confirmed" ||
                b.version !== job.payload.version ||
                Date.parse(b.ct_slots.starts_at) <= Date.now())
            )
              skip = true;
            if (
              ["booking_confirmed", "booking_rescheduled"].includes(job.kind) &&
              b.status !== "confirmed"
            )
              skip = true;
            const settings = checked(
              await client.from("ct_settings").select("*").single(),
            );
            const when = new Date(b.ct_slots.starts_at).toLocaleString(
              "en-US",
              {
                timeZone: settings.timezone,
                dateStyle: "full",
                timeStyle: "short",
              },
            );
            subject =
              job.kind === "booking_cancelled"
                ? "Coach Tae · Booking cancelled"
                : job.kind === "reminder"
                  ? "Coach Tae · Training reminder"
                  : job.kind === "booking_rescheduled"
                    ? "Coach Tae · Booking rescheduled"
                    : "Coach Tae · Booking confirmed";
            text = `${subject}\n\n${b.ct_slots.kind === "private" ? "Private" : "Group"} QB training\n${when} (${settings.timezone})\n${settings.location}\n\nBooking reference: ${b.id}\nManage sessions and review the cancellation policy: ${siteUrl()}/portal`;
          } else if (job.payload.order_id) {
            const order = checked(
              await client
                .from("ct_orders")
                .select("*")
                .eq("id", job.payload.order_id)
                .single(),
            );
            subject =
              job.kind === "payment_refunded"
                ? "Coach Tae · Payment refunded"
                : "Coach Tae · Payment received";
            text = `${subject}\n\n${job.kind === "payment_refunded" ? "Total settled refund to date:" : "Payment amount:"} ${new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency || "usd" }).format((job.kind === "payment_refunded" ? order.refunded_amount || 0 : order.amount || 0) / 100)}\nReference: ${order.id}\nStatus: ${order.status}\n${order.status === "refund_pending" ? "The session could not be confirmed. Your refund is queued; no booking is confirmed." : ""}\nView payments, credits and receipts: ${siteUrl()}/portal`;
          } else if (job.kind === "membership_updated") {
            subject = "Coach Tae · QB Lab membership update";
            text = `Your QB Lab subscription was updated. Stripe status at this update: ${job.payload.status}. View current access and manage billing at ${siteUrl()}/portal. Access requires an active paid membership or trial and ends at the paid-through date.`;
          } else throw new Error("UnknownNotification");
          if (!skip) {
            await send(family!.email, subject, text, `ct-${job.id}-family`);
            if (process.env.COACH_NOTIFICATION_EMAIL && job.kind !== "reminder")
              await send(
                process.env.COACH_NOTIFICATION_EMAIL,
                subject,
                `${text}\n\nFamily: ${family!.email}`,
                `ct-${job.id}-coach`,
              );
          }
        }
        checked(
          await client
            .from("ct_outbox")
            .update({
              completed_at: new Date().toISOString(),
              locked_until: null,
              last_error: null,
            })
            .eq("id", job.id),
        );
        sent++;
      } catch (error) {
        const code =
          error instanceof Error
            ? /^(EmailProvider[0-9]{3}|MissingPaymentIntent|UnknownNotification|RefundNotSettled)$/.test(
                error.message,
              )
              ? error.message
              : error.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 60)
            : "UnknownError";
        checked(
          await client
            .from("ct_outbox")
            .update({
              locked_until: null,
              last_error: code,
              run_at: new Date(
                Date.now() + Math.min(21600, 30 * 2 ** job.attempts) * 1000,
              ).toISOString(),
            })
            .eq("id", job.id),
        );
        failed++;
      }
    }),
  );
  return { processed: jobs.length, succeeded: sent, failed };
}

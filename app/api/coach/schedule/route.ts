import { after } from "next/server";
import { sendNotifications } from "@/lib/booking/notifications";
import { coach, db, failure, sameOrigin } from "@/lib/booking/server";
import { DateTime } from "luxon";
import { localSlot } from "@/lib/booking/core";
export async function GET() {
  try {
    await coach();
    const d = db();
    const results = await Promise.all(
      [
        "ct_sessions",
        "ct_native_bookings",
        "ct_availability_exceptions",
        "ct_session_types",
        "ct_availability_rules",
      ].map((t) => d.from(t).select("*")),
    );
    if (results.some((r) => r.error)) throw new Error("Schedule unavailable");
    return Response.json(
      Object.fromEntries(
        ["sessions", "bookings", "blocks", "types", "rules"].map((k, i) => [
          k,
          results[i].data,
        ]),
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await coach();
    const b = await req.json();
    const d = db();
    if (b.action === "session" || b.action === "edit") {
      const start = localSlot(b.date, b.time);
      const minutes = Number(b.minutes);
      const capacity = Number(b.capacity);
      if (
        !Number.isInteger(minutes) ||
        minutes < 15 ||
        minutes > 240 ||
        !Number.isInteger(capacity) ||
        capacity < 1 ||
        capacity > 30
      )
        throw new Error("Invalid session");
      const { data: type } = await d
        .from("ct_session_types")
        .select("kind")
        .eq("id", b.type)
        .single();
      if (!type || (type.kind === "private" && capacity !== 1))
        throw new Error("Invalid capacity");
      if (b.action === "edit") {
        const { error } = await d.rpc("ct_edit", {
          p_id: b.id,
          p_start: start,
          p_end: new Date(Date.parse(start) + minutes * 60000).toISOString(),
          p_capacity: capacity,
          p_type: b.type,
        });
        if (error) throw error;
      } else if (b.weeks) {
        const weeks = Number(b.weeks);
        if (!Number.isInteger(weeks) || weeks < 1 || weeks > 12)
          throw new Error("Invalid recurrence");
        const dates = Array.from({ length: weeks }, (_, i) => {
          const date = DateTime.fromISO(b.date).plus({ weeks: i }).toISODate()!;
          const start = localSlot(date, b.time);
          return {
            start,
            end: new Date(Date.parse(start) + minutes * 60000).toISOString(),
          };
        });
        const endTime = DateTime.fromISO(dates[0].end)
          .setZone("America/New_York")
          .toFormat("HH:mm");
        const { error } = await d.rpc("ct_recurring", {
          p_weekday: DateTime.fromISO(b.date).weekday % 7,
          p_start: b.time,
          p_end: endTime,
          p_type: b.type,
          p_capacity: capacity,
          p_dates: dates,
        });
        if (error) throw error;
      } else {
        const { error } = await d.from("ct_sessions").insert({
          starts_at: start,
          ends_at: new Date(Date.parse(start) + minutes * 60000).toISOString(),
          capacity,
          session_type_id: b.type,
        });
        if (error) throw error;
      }
    } else if (["close", "delete", "cancel", "reschedule"].includes(b.action)) {
      // Closing stops sales only; confirmed appointments remain intact.
      const { error } = await d.rpc("ct_manage", {
        p_action: b.action,
        p_id: b.id,
        p_target: b.target ?? null,
      });
      if (error) throw error;
    } else if (b.action === "block") {
      const starts = localSlot(b.date, "00:00");
      const end = localSlot(b.endDate, "00:00");
      if (
        end <= starts ||
        typeof b.reason !== "string" ||
        b.reason.length > 200
      )
        throw new Error("Invalid block");
      const { error } = await d
        .from("ct_availability_exceptions")
        .insert({ starts_at: starts, ends_at: end, reason: b.reason });
      if (error) throw error;
    } else if (b.action === "unblock") {
      const { error } = await d
        .from("ct_availability_exceptions")
        .delete()
        .eq("id", b.id);
      if (error) throw error;
    } else throw new Error("Unsupported action");
    after(async () => {
      try {
        await sendNotifications();
      } catch {
        console.error("Booking notification queued for retry");
      }
    });
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

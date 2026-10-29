import { expireAndCloseCheckout } from "@/lib/platform/close-checkout";
import {
  createsNotifications,
  dispatchNotifications,
} from "@/lib/platform/dispatch";
import { z } from "zod";
import { DateTime, IANAZone } from "luxon";
import { gradeQuiz } from "@/lib/platform/grading";
import { checkoutParams } from "@/lib/platform/checkout";
import { isProductKey, requiresNativeBooking } from "@/lib/platform/catalog";
import {
  bookingEnabled,
  checked,
  checkOrigin,
  customer,
  db,
  failure,
  HttpError,
  identity,
  json,
  kind,
  payments,
  siteUrl,
  uuid,
  verifiedPrice,
} from "@/lib/platform/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const reply = (data: unknown) =>
  Response.json(data, { headers: { "Cache-Control": "no-store" } });
export async function GET(req: Request, ctx: Context) {
  try {
    const path = (await ctx.params).path.join("/");
    if (path === "status")
      return reply({
        configured: !!(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
          process.env.SUPABASE_SERVICE_ROLE_KEY
        ),
        bookingEnabled: process.env.PLATFORM_BOOKING_ENABLED === "true",
        paymentsConfigured: !!process.env.STRIPE_SECRET_KEY,
      });
    if (path === "library") {
      return reply({
        lessons: checked(
          await db()
            .from("ct_lessons")
            .select("title,category,level,topic,sort_order")
            .eq("published", true)
            .order("sort_order"),
        ),
      });
    }
    const { client, user, isCoach } = await identity(
      req,
      path === "admin" || path.startsWith("admin/"),
    );
    if (path === "me") {
      const results = await Promise.all([
        client
          .from("ct_athletes")
          .select("*")
          .eq("family_id", user.id)
          .order("created_at"),
        client
          .from("ct_bookings")
          .select("*,ct_slots(*)")
          .eq("family_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200),
        client.from("ct_credits").select("kind,delta").eq("family_id", user.id),
        client
          .from("ct_orders")
          .select(
            "id,product_key,status,amount,refunded_amount,currency,created_at,booking_id",
          )
          .eq("family_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        client.from("ct_memberships").select("*").eq("family_id", user.id),
        client.from("ct_settings").select("*").single(),
        client
          .from("ct_progress")
          .select("*,ct_athletes!inner(family_id)")
          .eq("ct_athletes.family_id", user.id),
      ]);
      const [
        athletes,
        bookings,
        ledger,
        orders,
        memberships,
        settings,
        progress,
      ] = results.map((r) => checked(r)) as unknown as [
        unknown,
        unknown,
        { kind: "private" | "group"; delta: number }[],
        unknown,
        unknown,
        unknown,
        unknown,
      ];
      void ledger;
      const balanceRows =
        checked(await client.rpc("ct_balances", { p_family: user.id })) || [];
      const credits = { private: 0, group: 0 },
        recovery = { private: 0, group: 0 };
      for (const row of balanceRows) {
        const key = kind.parse(row.kind);
        credits[key] = Number(row.available);
        recovery[key] = row.recovery;
      }
      return reply({
        athletes,
        bookings,
        credits,
        recovery,
        orders,
        memberships,
        settings,
        progress,
        isCoach,
        recordSource: "native",
        calendlySync: "not_connected",
      });
    }
    if (path === "availability") {
      bookingEnabled();
      const query = new URL(req.url).searchParams;
      const date = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .parse(query.get("date"));
      const zone = query.get("zone") || "America/New_York";
      if (!IANAZone.isValidZone(zone))
        throw new HttpError(400, "Choose a valid timezone.");
      const day = DateTime.fromISO(date, { zone });
      if (
        !day.isValid ||
        day.startOf("day") < DateTime.now().setZone(zone).startOf("day") ||
        day > DateTime.now().plus({ days: 90 })
      )
        throw new HttpError(400, "Choose a date in the next 90 days.");
      const trainingKind = kind.parse(query.get("kind"));
      const settings = checked(
        await client.from("ct_settings").select("*").single(),
      );
      return reply({
        slots: checked(
          await client.rpc("ct_availability", {
            p_from: day.toUTC().toISO(),
            p_until: day.plus({ days: 1 }).toUTC().toISO(),
            p_kind: trainingKind,
          }),
        ),
        settings,
      });
    }

    if (path === "lessons") {
      const memberships = checked(
        await client
          .from("ct_memberships")
          .select("*")
          .eq("family_id", user.id)
          .in("status", ["active", "trialing"])
          .gt("access_until", new Date().toISOString()),
      );
      if (!isCoach && !(memberships || []).length)
        throw new HttpError(403, "An active QB Lab membership is required.");
      const lessons = checked(
        await client
          .from("ct_lessons")
          .select("*")
          .eq("published", true)
          .order("sort_order"),
      );
      return reply({
        lessons: (lessons || []).map((l) => ({
          ...l,
          questions: l.questions.map(
            (q: { prompt: string; options: string[] }) => ({
              prompt: q.prompt,
              options: q.options,
            }),
          ),
        })),
      });
    }
    if (path === "admin/calendar") {
      const date = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .parse(new URL(req.url).searchParams.get("date"));
      const start = DateTime.fromISO(date, {
        zone: "America/New_York",
      }).startOf("month");
      if (!start.isValid) throw new HttpError(400, "Invalid calendar month");
      const end = start.plus({ months: 1 });
      const queries = await Promise.all([
        client
          .from("ct_rules")
          .select("*")
          .is("superseded_by", null)
          .order("weekday")
          .order("local_start"),
        client
          .from("ct_slots")
          .select("*")
          .gte("starts_at", start.toUTC().toISO())
          .lt("starts_at", end.toUTC().toISO())
          .order("starts_at")
          .limit(1000),
        client
          .from("ct_bookings")
          .select("*,ct_slots!inner(*),ct_athletes(name),ct_families(email)")
          .gte("ct_slots.starts_at", start.toUTC().toISO())
          .lt("ct_slots.starts_at", end.toUTC().toISO())
          .order("created_at")
          .limit(1000),
        client
          .from("ct_blocks")
          .select("*")
          .lt("starts_at", end.toUTC().toISO())
          .gt("ends_at", start.toUTC().toISO())
          .order("starts_at"),
      ]);
      const [rules, slots, bookings, blocks] = queries.map((r) => checked(r));
      const settings = checked(
        await client.from("ct_settings").select("*").single(),
      );
      return reply({
        settings,
        rules,
        slots,
        bookings,
        blocks,
        timezone: "America/New_York",
        limited: slots?.length === 1000 || bookings?.length === 1000,
      });
    }
    if (path === "admin") {
      const tables = [
        "ct_athletes",
        "ct_families",
        "ct_bookings",
        "ct_slots",
        "ct_rules",
        "ct_blocks",
        "ct_orders",
        "ct_invoices",
        "ct_credits",
        "ct_credit_recovery",
        "ct_memberships",
        "ct_lessons",
        "ct_outbox",
        "ct_settings",
      ] as const;
      const values = await Promise.all(
        tables.map((t) =>
          client
            .from(t)
            .select(
              t === "ct_bookings"
                ? "*,ct_slots(*),ct_athletes(name)"
                : t === "ct_families"
                  ? "id,email"
                  : "*",
            )
            .limit(1000),
        ),
      );
      return reply(
        Object.fromEntries(tables.map((t, i) => [t, checked(values[i])])),
      );
    }
    throw new HttpError(404, "Not found.");
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request, ctx: Context) {
  try {
    checkOrigin(req);
    const path = (await ctx.params).path.join("/");
    const reply = (data: unknown) => {
      if (createsNotifications(path)) dispatchNotifications();
      return Response.json(data, { headers: { "Cache-Control": "no-store" } });
    };
    const { client, user } = await identity(req, path.startsWith("admin/"));
    const input = await json(req);
    checked(await client.rpc("ct_rate_limit", { p_family: user.id }));
    if (path === "athletes") {
      const body = z
        .object({
          name: z.string().trim().min(1).max(100),
          graduation_year: z.number().int().min(2020).max(2050).nullable(),
        })
        .parse(input);
      const count = checked(
        await client.from("ct_athletes").select("id").eq("family_id", user.id),
      );
      if ((count || []).length >= 12)
        throw new HttpError(409, "Contact Coach Tae to add more athletes.");
      return reply({
        athlete: checked(
          await client
            .from("ct_athletes")
            .insert({ ...body, family_id: user.id })
            .select()
            .single(),
        ),
      });
    }
    if (path === "book") {
      bookingEnabled();
      const b = z
        .object({
          athlete_id: uuid,
          slot_id: uuid,
          credit: z.boolean(),
          request_id: uuid,
        })
        .parse(input);
      if (!b.credit) {
        await verifiedPrice(
          kind.parse(
            checked(
              await client
                .from("ct_slots")
                .select("kind")
                .eq("id", b.slot_id)
                .single(),
            )!.kind,
          ),
        );
      }
      const booking = checked(
        await client.rpc("ct_book", {
          p_family: user.id,
          p_athlete: b.athlete_id,
          p_slot: b.slot_id,
          p_credit: b.credit,
          p_request: b.request_id,
        }),
      );
      return reply({ booking });
    }
    if (path === "bookings/manage") {
      const b = z
        .object({ booking_id: uuid, target_slot_id: uuid.nullable() })
        .parse(input);
      return reply({
        booking: checked(
          await client.rpc("ct_manage_booking", {
            p_family: user.id,
            p_booking: b.booking_id,
            p_target: b.target_slot_id,
          }),
        ),
      });
    }
    if (path === "checkout/cancel") {
      const b = z.object({ order_id: uuid }).parse(input);
      const order = checked(
        await client
          .from("ct_orders")
          .select("*")
          .eq("id", b.order_id)
          .eq("family_id", user.id)
          .maybeSingle(),
      );
      if (!order) throw new HttpError(404, "Checkout not found.");
      if (["cancelled", "expired", "failed"].includes(order.status))
        return reply({ released: true });
      if (order.status !== "pending")
        throw new HttpError(
          409,
          "Payment is already processed. Refresh your portal.",
        );
      if (!order.session_id)
        throw new HttpError(
          409,
          "Checkout is still being prepared. Retry shortly; the unpaid hold still expires automatically.",
        );
      const released = await expireAndCloseCheckout(
        order.session_id,
        `cancel:${order.id}`,
        "cancelled",
        { client, stripe: payments() },
      );
      return reply({ released });
    }
    if (path === "checkout") {
      const b = z
        .object({
          product: z.string(),
          request_id: uuid,
          booking_id: uuid.optional(),
        })
        .parse(input);
      if (!isProductKey(b.product))
        throw new HttpError(400, "Unknown product.");
      const key = b.product;
      if (requiresNativeBooking(key)) bookingEnabled();
      if (key.startsWith("lab_")) {
        const lessons = checked(
          await client
            .from("ct_lessons")
            .select("id")
            .eq("published", true)
            .limit(1),
        );
        if (!(lessons || []).length)
          throw new HttpError(
            409,
            "Membership purchases open when Coach Tae publishes content.",
          );
      }
      const price = await verifiedPrice(key);
      const stripe = payments();
      const existing = checked(
        await client
          .from("ct_orders")
          .select("*")
          .eq("id", b.request_id)
          .maybeSingle(),
      );
      if (
        existing &&
        (existing.family_id !== user.id ||
          existing.product_key !== key ||
          existing.booking_id !== (b.booking_id || null))
      )
        throw new HttpError(409, "Request already used.");
      if (existing?.session_id) {
        const session = await stripe.checkout.sessions.retrieve(
          existing.session_id,
        );
        if (session.status === "open" && session.url)
          return reply({ url: session.url });
        throw new HttpError(
          409,
          "This checkout is already complete or expired. Check your portal.",
        );
      }
      if (b.booking_id) {
        bookingEnabled();
        const booking = checked(
          await client
            .from("ct_bookings")
            .select("*,ct_slots(kind)")
            .eq("id", b.booking_id)
            .eq("family_id", user.id)
            .single(),
        );
        if (
          booking.status !== "held" ||
          Date.parse(booking.hold_until) < Date.now() + 31 * 60000 ||
          booking.ct_slots.kind !== key
        )
          throw new HttpError(
            409,
            "Reservation expired or does not match this purchase. Start again.",
          );
      } else if (key === "group" || key === "private")
        throw new HttpError(400, "Choose a training session first.");
      if (b.booking_id) {
        const previous = checked(
          await client
            .from("ct_orders")
            .select("id")
            .eq("booking_id", b.booking_id)
            .neq("id", b.request_id),
        );
        if ((previous || []).length)
          throw new HttpError(
            409,
            "A checkout already exists for this reservation.",
          );
      }
      if (key.startsWith("lab_") && !existing) {
        const active = checked(
          await client
            .from("ct_memberships")
            .select("subscription_id")
            .eq("family_id", user.id)
            .in("status", [
              "active",
              "trialing",
              "past_due",
              "unpaid",
              "paused",
            ]),
        );
        if ((active || []).length)
          throw new HttpError(
            409,
            "Manage your existing membership through billing.",
          );
      }
      const customerId = await customer(user.id, user.email!);
      checked(
        await client.rpc("ct_create_order", {
          p_id: b.request_id,
          p_family: user.id,
          p_product: key,
          p_price: price,
          p_booking: b.booking_id || null,
        }),
      );
      const saved = checked(
        await client
          .from("ct_orders")
          .select("created_at")
          .eq("id", b.request_id)
          .single(),
      )!;
      const session = await stripe.checkout.sessions.create(
        checkoutParams({
          id: b.request_id,
          customer: customerId,
          price,
          product: key,
          origin: siteUrl(),
          createdAt: saved.created_at,
        }),
        { idempotencyKey: `ct-checkout-${b.request_id}` },
      );
      checked(
        await client
          .from("ct_orders")
          .update({ session_id: session.id })
          .eq("id", b.request_id)
          .eq("family_id", user.id),
      );
      if (!session.url) throw new HttpError(502, "Checkout is not available.");
      return reply({ url: session.url });
    }
    if (path === "receipt") {
      const b = z.object({ order_id: uuid }).parse(input);
      const order = checked(
        await client
          .from("ct_orders")
          .select("*")
          .eq("id", b.order_id)
          .eq("family_id", user.id)
          .single(),
      );
      if (!order.session_id || order.status !== "paid")
        throw new HttpError(409, "No paid receipt available.");
      const session = await payments().checkout.sessions.retrieve(
        order.session_id,
        { expand: ["invoice", "payment_intent.latest_charge"] },
      );
      let url: string | null = null;
      if (session.invoice && typeof session.invoice !== "string")
        url = session.invoice.hosted_invoice_url || null;
      if (
        !url &&
        session.payment_intent &&
        typeof session.payment_intent !== "string"
      ) {
        const charge = session.payment_intent.latest_charge;
        if (charge && typeof charge !== "string") url = charge.receipt_url;
      }
      if (!url)
        throw new HttpError(
          409,
          "The receipt is still being prepared. Check billing shortly.",
        );
      return reply({ url });
    }
    if (path === "billing") {
      const family = checked(
        await client
          .from("ct_families")
          .select("stripe_customer_id")
          .eq("id", user.id)
          .single(),
      );
      if (!family!.stripe_customer_id)
        throw new HttpError(409, "No billing account yet.");
      return reply({
        url: (
          await payments().billingPortal.sessions.create({
            customer: family!.stripe_customer_id,
            return_url: `${siteUrl()}/portal`,
          })
        ).url,
      });
    }
    if (path === "progress") {
      const b = z
        .object({
          athlete_id: uuid,
          lesson_id: uuid,
          answers: z.array(z.number().int().min(0).max(9)).max(30),
        })
        .parse(input);
      const membership = checked(
        await client
          .from("ct_memberships")
          .select("subscription_id")
          .eq("family_id", user.id)
          .in("status", ["active", "trialing"])
          .gt("access_until", new Date().toISOString()),
      );
      if (!(membership || []).length)
        throw new HttpError(403, "An active QB Lab membership is required.");
      const athlete = checked(
        await client
          .from("ct_athletes")
          .select("id")
          .eq("id", b.athlete_id)
          .eq("family_id", user.id)
          .maybeSingle(),
      );
      if (!athlete) throw new HttpError(404, "Athlete not found.");
      const lesson = checked(
        await client
          .from("ct_lessons")
          .select("*")
          .eq("id", b.lesson_id)
          .eq("published", true)
          .single(),
      );
      const questions = lesson.questions as {
        answer: number;
        prompt: string;
        options: string[];
        explanation?: string;
      }[];
      if (questions.length !== b.answers.length)
        throw new HttpError(400, "Answer every question.");
      let graded;
      try {
        graded = gradeQuiz(questions, b.answers);
      } catch {
        throw new HttpError(400, "Answer every question with a valid choice.");
      }
      const score = graded.score;
      checked(
        await client.from("ct_progress").upsert({
          athlete_id: b.athlete_id,
          lesson_id: b.lesson_id,
          score,
          completed_at: new Date().toISOString(),
        }),
      );
      return reply(graded);
    }
    if (path === "admin/windows") {
      const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
      const b = z
        .object({
          id: uuid.nullable(),
          data: z
            .object({
              weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
              kind,
              timezone: z.literal("America/New_York"),
              local_start: time,
              local_end: time,
              duration_minutes: z.number().int().min(15).max(180),
              buffer_minutes: z.number().int().min(0).max(60),
              capacity: z.number().int().min(1).max(30),
            })
            .refine(
              (v) => v.kind !== "private" || v.capacity === 1,
              "Private capacity must be 1",
            ),
        })
        .parse(input);
      return reply({
        created: checked(
          await client.rpc("ct_save_windows", { p_id: b.id, p_data: b.data }),
        ),
      });
    }
    if (path === "admin/one-time") {
      const b = z
        .object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          local_start: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
          kind,
          duration_minutes: z.number().int().min(15).max(180),
          buffer_minutes: z.number().int().min(0).max(60),
          capacity: z.number().int().min(1).max(30),
        })
        .refine(
          (v) => v.kind !== "private" || v.capacity === 1,
          "Private capacity must be 1",
        )
        .parse(input);
      const start = DateTime.fromISO(`${b.date}T${b.local_start}`, {
        zone: "America/New_York",
      });
      if (!start.isValid || start.toFormat("HH:mm") !== b.local_start)
        throw new HttpError(
          400,
          "This local time does not exist because of daylight saving. Choose another time.",
        );
      return reply({
        id: checked(
          await client.rpc("ct_one_time", {
            p_data: {
              kind: b.kind,
              capacity: b.capacity,
              buffer_minutes: b.buffer_minutes,
              starts_at: start.toUTC().toISO(),
              ends_at: start
                .plus({ minutes: b.duration_minutes })
                .toUTC()
                .toISO(),
            },
          }),
        ),
      });
    }
    if (path === "admin/booking") {
      const b = z
        .object({ booking_id: uuid, target_slot_id: uuid.nullable() })
        .parse(input);
      checked(
        await client.rpc("ct_coach_booking", {
          p_coach: user.id,
          p_booking: b.booking_id,
          p_target: b.target_slot_id,
        }),
      );
      return reply({ saved: true });
    }
    if (path === "admin/cancel-session") {
      const b = z.object({ slot_id: uuid }).parse(input);
      checked(
        await client.rpc("ct_cancel_session", {
          p_coach: user.id,
          p_slot: b.slot_id,
        }),
      );
      return reply({ saved: true });
    }
    if (path === "admin/schedule") {
      const zone = z
        .string()
        .refine(IANAZone.isValidZone, "Use an IANA timezone");
      const b = z
        .discriminatedUnion("action", [
          z.object({
            action: z.literal("rule"),
            data: z
              .object({
                kind,
                weekday: z.number().int().min(0).max(6),
                local_start: z.string().regex(/^\d{2}:\d{2}$/),
                timezone: zone,
                duration_minutes: z.number().int().min(15).max(180),
                buffer_minutes: z.number().int().min(0).max(60),
                capacity: z.number().int().min(1).max(30),
              })
              .refine(
                (v) => v.kind !== "private" || v.capacity === 1,
                "Private capacity must be 1",
              ),
          }),
          z.object({
            action: z.literal("rule_toggle"),
            data: z.object({ id: uuid, active: z.boolean() }),
          }),
          z.object({
            action: z.literal("block"),
            data: z
              .object({
                starts_at: z.string().datetime(),
                ends_at: z.string().datetime(),
                reason: z.string().max(300),
              })
              .refine(
                (v) => Date.parse(v.ends_at) > Date.parse(v.starts_at),
                "End must be after start",
              ),
          }),
          z.object({
            action: z.literal("unblock"),
            data: z.object({ id: uuid }),
          }),
          z.object({
            action: z.literal("capacity"),
            data: z.object({
              id: uuid,
              capacity: z.number().int().min(1).max(30),
            }),
          }),
        ])
        .parse(input);
      checked(
        await client.rpc("ct_calendar_action", {
          p_action: b.action,
          p_data: b.data,
        }),
      );
      return reply({ saved: true });
    }
    if (path === "admin/publish")
      return reply({
        created: checked(await client.rpc("ct_publish", { p_days: 60 })),
      });
    if (path === "admin/settings") {
      const b = z
        .object({
          timezone: z.string().refine(IANAZone.isValidZone),
          cancellation_hours: z.number().int().min(0).max(168),
          reschedule_hours: z.number().int().min(0).max(168),
          notice_hours: z.number().int().min(0).max(168),
          location: z.string().trim().min(1).max(300),
        })
        .parse(input);
      checked(await client.from("ct_settings").update(b).eq("id", true));
      return reply({ saved: true });
    }
    if (path === "admin/lesson") {
      const b = z
        .object({
          id: uuid.optional(),
          title: z.string().trim().min(1).max(160),
          category: z.enum([
            "football_iq",
            "stretching",
            "development",
            "quiz",
          ]),
          body: z.string().trim().min(1).max(20000),
          published: z.boolean(),
          slug: z
            .string()
            .regex(/^[a-z0-9-]+$/)
            .optional(),
          level: z
            .enum(["beginner", "intermediate", "advanced"])
            .default("beginner"),
          topic: z.string().min(1).max(80).default("Fundamentals"),
          diagram: z.string().max(40).nullable().optional(),
          sort_order: z.number().int().min(0).max(10000).default(0),
          questions: z
            .array(
              z
                .object({
                  prompt: z.string().min(1).max(500),
                  options: z.array(z.string().min(1).max(300)).min(2).max(10),
                  answer: z.number().int().min(0),
                  explanation: z.string().max(2000).optional(),
                })
                .refine((q) => q.answer < q.options.length),
            )
            .max(30),
        })
        .refine(
          (v) => v.category !== "quiz" || v.questions.length > 0,
          "A quiz must include questions",
        )
        .parse(input);
      return reply({
        lesson: checked(
          await client.from("ct_lessons").upsert(b).select().single(),
        ),
      });
    }
    if (path === "admin/retry") {
      const b = z.object({ id: uuid }).parse(input);
      checked(
        await client
          .from("ct_outbox")
          .update({
            attempts: 0,
            run_at: new Date().toISOString(),
            locked_until: null,
            last_error: null,
          })
          .eq("id", b.id)
          .is("completed_at", null)
          .or(
            `locked_until.is.null,locked_until.lt.${new Date().toISOString()}`,
          ),
      );
      return reply({ saved: true });
    }
    throw new HttpError(404, "Not found.");
  } catch (e) {
    return failure(e);
  }
}

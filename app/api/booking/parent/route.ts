import { after } from "next/server";
import { sendNotifications } from "@/lib/booking/notifications";
import { cookies } from "next/headers";
import {
  publicBookingEnabled,
  db,
  failure,
  sameOrigin,
} from "@/lib/booking/server";
import { validateParent } from "@/lib/booking/core";
async function parent() {
  const token = (await cookies()).get("parent_session")?.value;
  if (!token) throw new Error("Unauthorized");
  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user?.email || !data.user.email_confirmed_at)
    throw new Error("Unauthorized");
  return data.user.email.toLowerCase();
}
export async function GET() {
  try {
    publicBookingEnabled();
    const email = await parent();
    const { data, error } = await db()
      .from("ct_package_credits")
      .select("id,session_type_id,remaining")
      .eq("parent_email", email)
      .gt("remaining", 0);
    if (error) throw error;
    return Response.json(
      { credits: data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    publicBookingEnabled();
    sameOrigin(req);
    const b = await req.json();
    const d = db();
    if (b.action === "send") {
      if (
        typeof b.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) ||
        b.email.length > 254
      )
        throw new Error("Invalid email");
      const { error } = await d.auth.signInWithOtp({
        email: b.email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      return Response.json({ ok: true });
    }
    if (b.action === "verify") {
      if (
        typeof b.email !== "string" ||
        typeof b.code !== "string" ||
        b.code.length > 20
      )
        throw new Error("Invalid code");
      const { data, error } = await d.auth.verifyOtp({
        email: b.email,
        token: b.code,
        type: "email",
      });
      if (error || !data.session) throw new Error("Unauthorized");
      (await cookies()).set("parent_session", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: data.session.expires_in,
      });
      return Response.json({ ok: true });
    }
    if (b.action === "redeem") {
      const email = await parent();
      const p = validateParent({ ...b, email });
      const { error } = await d.rpc("ct_redeem", {
        p_credit: b.credit,
        p_session: b.session,
        p_parent: p.parent,
        p_athlete: p.athlete,
        p_email: email,
        p_phone: p.phone,
      });
      if (error) throw error;
      after(async () => {
        try {
          await sendNotifications();
        } catch {
          console.error("Booking notification queued for retry");
        }
      });
      return Response.json({ ok: true });
    }
    throw new Error("Unsupported action");
  } catch (e) {
    return failure(e);
  }
}

import { cookies } from "next/headers";
import { db, failure, required, sameOrigin } from "@/lib/booking/server";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { email, password } = await req.json();
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      password.length > 256
    )
      throw new Error("Invalid credentials");
    const { data, error } = await db().auth.signInWithPassword({
      email,
      password,
    });
    if (
      error ||
      !data.session ||
      data.user.id !== required("COACH_SUPABASE_USER_ID")
    )
      throw new Error("Unauthorized");
    (await cookies()).set("coach_session", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: data.session.expires_in,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    (await cookies()).delete("coach_session");
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

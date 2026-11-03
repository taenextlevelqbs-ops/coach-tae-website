import { publicBookingEnabled, db, failure } from "@/lib/booking/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    publicBookingEnabled();
    // Aggregate within PostgreSQL so PostgREST's row limit cannot undercount seats.
    const { data, error } = await db().rpc("ct_public_availability");
    if (error) throw error;
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return failure(e);
  }
}

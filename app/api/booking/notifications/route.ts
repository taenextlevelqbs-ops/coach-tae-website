import { required } from "@/lib/booking/server";
import { sendNotifications } from "@/lib/booking/notifications";
export async function GET(req: Request) {
  try {
    if (
      req.headers.get("authorization") !== `Bearer ${required("CRON_SECRET")}`
    )
      return new Response("Unauthorized", { status: 401 });
    return Response.json({ processed: await sendNotifications() });
  } catch {
    return Response.json(
      { error: "Notification processing failed" },
      { status: 500 },
    );
  }
}

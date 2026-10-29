import { handle } from "@/lib/integrations/command-center.mjs";
import { config } from "@/lib/integrations/command-config.mjs";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  return handle(request, config);
}

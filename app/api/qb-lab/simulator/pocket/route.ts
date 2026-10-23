import { defaultConfig } from "@/modules/qb-lab/live-engine/defaults";
import { createEngine, snap, advanceTicks } from "@/modules/qb-lab/live-engine/engine";
import { pocketWindow } from "@/modules/qb-lab/live-engine/assessment";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
/** Stateless synthetic fixture only. Does not accept identity, media, arbitrary plays or persisted results. */
export async function POST(request: Request) {
  const reply = (body: object, status = 200) => Response.json(body, { status, headers });
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const source = new URL(origin);
      // Next's internal URL can use localhost behind a proxy; Host is the browser-facing authority.
      const host = request.headers.get("host") ?? new URL(request.url).host;
      const forwarded = request.headers.get("x-forwarded-proto");
      const protocol = forwarded ? `${forwarded.split(",")[0].trim()}:` : new URL(request.url).protocol;
      if (!["http:", "https:"].includes(source.protocol) || source.protocol !== protocol || source.host !== host) return reply({ error: "Same-origin requests only." }, 403);
    } catch { return reply({ error: "Invalid origin." }, 403); }
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ error: "JSON required." }, 415);
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "Configuration required." }, 400);
  let raw = "";
  let bytes = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2048) { await reader.cancel(); return reply({ error: "Configuration too large." }, 413); }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).some(k => !["rushers", "matchup", "blitzTempo", "help", "ticks"].includes(k))) throw new Error();
    const { rushers = 4, matchup = "balanced", blitzTempo = 0, help = "none", ticks = 0 } = data;
    if (!Number.isInteger(rushers) || rushers < 2 || rushers > 6 || !["balanced", "offense-edge", "defense-edge"].includes(matchup) || !["none", "RB", "TE", "RB+TE"].includes(help) || !Number.isFinite(blitzTempo) || blitzTempo < 0 || blitzTempo > 0.25 || !Number.isInteger(ticks) || ticks < 0 || ticks > 120) throw new Error();
    const config = defaultConfig();
    config.rules.rushers = rushers;
    config.matchup = matchup;
    config.blitzTempo = blitzTempo;
    config.help = help;
    const state = advanceTicks(snap(createEngine(config)), ticks);
    return reply({ remainingSeconds: state.phase === "done" ? 0 : pocketWindow(state), phase: state.phase, synthetic: true, advisory: "Standard tackle fixture only. Not a sack deadline or athlete rating; live geometry decides contact." });
  } catch { return reply({ error: "Invalid bounded synthetic configuration." }, 400); }
}

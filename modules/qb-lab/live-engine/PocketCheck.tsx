"use client";
import { useState } from "react";
import type { EngineConfig } from "./types";
export function PocketCheck({ config }: { config: EngineConfig }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function check() {
    setPending(true);
    try {
      const response = await fetch("/api/qb-lab/simulator/pocket", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ rushers: config.rules.rushers, matchup: config.matchup ?? "balanced", blitzTempo: config.blitzTempo ?? 0, help: config.help }),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (!Number.isFinite(result.remainingSeconds)) throw new Error();
      setMessage(`Standard tackle example: ${result.remainingSeconds.toFixed(1)} seconds estimated pocket window. Advisory only; your saved formation and live positioning can change the rep.`);
    } catch { setMessage("Pocket estimate unavailable. You can still play this rep."); }
    finally { setPending(false); }
  }
  return <div className="engine-pocket-check"><button type="button" disabled={pending} onClick={check}>{pending ? "Checking…" : "Estimate pocket window"}</button><p role="status">{message}</p></div>;
}

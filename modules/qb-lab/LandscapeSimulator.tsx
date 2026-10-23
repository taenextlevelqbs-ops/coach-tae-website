"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
const query = "(max-width: 1100px) and (orientation: portrait)";
const portrait = () => window.matchMedia(query).matches;
const server = () => false;
function subscribe(update: () => void) { const media = window.matchMedia(query); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }
export function LandscapeSimulator({ children }: { children: ReactNode }) {
  const rotate = useSyncExternalStore(subscribe, portrait, server);
  const [message, setMessage] = useState("");
  const ownsFullscreen = useRef(false);
  useEffect(() => { if (rotate) window.dispatchEvent(new Event("qb-lab:pause-simulator")); }, [rotate]);
  useEffect(() => () => {
    screen.orientation?.unlock?.();
    if (ownsFullscreen.current && document.fullscreenElement === document.documentElement) void document.exitFullscreen().catch(() => {});
  }, []);
  async function lock() {
    try {
      if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); ownsFullscreen.current = true; }
      const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
      if (!orientation?.lock) throw new Error();
      await orientation.lock("landscape");
      setMessage("Landscape requested. Rotate your device if needed.");
    } catch { setMessage("This browser cannot lock orientation. Rotate your device manually and disable its portrait lock."); }
  }
  return <div className="simulator-orientation-shell">
    <section className="simulator-rotate" aria-label="Simulator orientation" hidden={!rotate}>
      <p>QB SIMULATOR</p><h1>Turn your device sideways.</h1><p>Play in landscape so you can see the receivers, pocket and defensive movement together. Home and Football IQ still work in portrait.</p>
      <button type="button" onClick={lock}>Enter landscape play</button><p role="status">{message}</p><a href="/qb-lab">Back to your Lab</a>
    </section>
    <div inert={rotate} hidden={rotate}>{children}</div>
  </div>;
}

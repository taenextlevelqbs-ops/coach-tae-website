"use client";
import { useEffect, useState } from "react";
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
/** Keep public offline support active without putting installation controls on Home. */
export function PwaSupport() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/qb-lab/sw.js", { scope: "/qb-lab", updateViaCache: "none" }).catch(() => {
      // Offline support is optional. Profile's install controls retry and explain failures.
    });
  }, []);
  return null;
}
export function PwaInstall() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/qb-lab/sw.js", { scope: "/qb-lab", updateViaCache: "none" }).catch(() => setMessage("Offline support is unavailable in this browser."));
    const install = (e: Event) => { e.preventDefault(); setPrompt(e as InstallEvent); };
    const installed = () => { setPrompt(null); setMessage("QB LAB is installed."); };
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", install); window.removeEventListener("appinstalled", installed); };
  }, []);
  return <div className="lab-install">{prompt ? <button onClick={async () => { try { await prompt.prompt(); await prompt.userChoice; } catch { setMessage("Use your browser menu to install QB LAB."); } finally { setPrompt(null); } }}>Install QB LAB</button> : <details><summary>Install on your phone</summary><p>iPhone/iPad: Share → Add to Home Screen. Android: browser menu → Install app. Availability depends on your browser. Offline mode includes a mental-rep guide; live pages require a connection.</p></details>}{message && <span role="status" aria-label="Installation status">{message}</span>}</div>;
}

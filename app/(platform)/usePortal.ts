"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/platform/browser";
import type { PortalData } from "@/lib/platform/types";
export function usePortal() {
  const [data, setData] = useState<PortalData | null>(null),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const value = await api<PortalData>("me");
      setData(value);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your family.");
    }
  }, []);
  useEffect(() => {
    let active = true;
    api<PortalData>("me")
      .then((value) => {
        if (active) {
          setData(value);
          setError("");
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Could not load your family.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  return { data, error, refresh };
}
export function message(e: unknown) {
  return e instanceof Error ? e.message : "Please try again.";
}

export function useNow() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const update = () => setNow(Date.now());
    queueMicrotask(update);
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);
  return now;
}

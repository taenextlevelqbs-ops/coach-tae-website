"use client";
import { useRef, useState } from "react";
import { api } from "@/lib/platform/browser";
import { requiresNativeBooking, type ProductKey } from "@/lib/platform/catalog";
import { useSession } from "./Session";
import { message } from "./usePortal";
export default function Purchase({
  product,
  children,
}: {
  product: ProductKey;
  children: React.ReactNode;
}) {
  const { products, nativeBookingEnabled } = useSession();
  const trainingPaused =
    requiresNativeBooking(product) && !nativeBookingEnabled;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const request = useRef<string | null>(null);
  async function buy() {
    setBusy(true);
    setError("");
    request.current ||= crypto.randomUUID();
    try {
      const r = await api<{ url: string }>("checkout", {
        product,
        request_id: request.current,
      });
      window.location.assign(r.url);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <button
        disabled={busy || trainingPaused || !products.includes(product)}
        onClick={buy}
      >
        {busy ? "Opening secure checkout…" : children}
      </button>
      {trainingPaused ? (
        <p className="muted">
          Training package purchases are paused while scheduling uses Calendly.
          Existing credits remain recorded; contact Coach Tae about redemption.
        </p>
      ) : (
        !products.includes(product) && (
          <p className="muted">
            Purchases open once Stripe test configuration is verified.
          </p>
        )
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
    </div>
  );
}

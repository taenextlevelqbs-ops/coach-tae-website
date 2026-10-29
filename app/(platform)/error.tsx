"use client";
import Link from "next/link";
export default function PlatformError({ reset }: { reset: () => void }) {
  return (
    <section className="panel stack">
      <p className="eyebrow">Let’s get you back on track</p>
      <h2>This page could not load.</h2>
      <p className="muted">
        Your confirmed bookings and payments are stored securely. Retry the page
        or return to the main website.
      </p>
      <div className="row">
        <button onClick={reset}>Try again</button>
        <Link href="/" className="button secondary">
          Coach Tae home
        </Link>
      </div>
    </section>
  );
}

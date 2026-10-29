import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import "./platform.css";
import { SessionProvider } from "./Session";
import {
  catalog,
  requiresNativeBooking,
  type ProductKey,
} from "@/lib/platform/catalog";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const nativeBookingEnabled = process.env.PLATFORM_BOOKING_ENABLED === "true";
  const products = (Object.keys(catalog) as ProductKey[]).filter(
    (key) =>
      !!process.env[catalog[key].env] &&
      !!process.env.STRIPE_SECRET_KEY &&
      (nativeBookingEnabled || !requiresNativeBooking(key)),
  );
  return (
    <SessionProvider
      configured={configured}
      products={products}
      nativeBookingEnabled={nativeBookingEnabled}
    >
      <div className="platform">
        <a href="#platform-main" className="skip-link">
          Skip to content
        </a>
        <header className="platform-header">
          <Link href="/" className="platform-brand">
            <Image
              src="/CTLOGO.jpeg"
              alt="Coach Tae home"
              width={44}
              height={44}
            />
            <span>
              COACH TAE<small>QB DEVELOPMENT · DMV</small>
            </span>
          </Link>
          <nav aria-label="Training platform">
            <Link href="/book">Book training</Link>
            <Link href="/portal">Family portal</Link>
            <Link href="/lab">QB Lab</Link>
          </nav>
        </header>
        <main id="platform-main" className="platform-main">
          {children}
        </main>
        <footer className="platform-footer">
          DEVELOP. COMPETE. LEAD.
          <span>Coach Tae · Northern Virginia & the DMV</span>
          <Link href="/">Back to the website</Link>
        </footer>
      </div>
    </SessionProvider>
  );
}

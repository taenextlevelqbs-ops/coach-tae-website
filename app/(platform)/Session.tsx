"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { authMessage, OTP_COOLDOWN_SECONDS } from "@/lib/platform/auth";
import type { User } from "@supabase/supabase-js";
import {
  browser,
  groupCalendly,
  privateCalendly,
} from "@/lib/platform/browser";
import type { ProductKey } from "@/lib/platform/catalog";
const Context = createContext<{
  user: User | null;
  loading: boolean;
  products: ProductKey[];
  configured: boolean;
  nativeBookingEnabled: boolean;
}>({
  user: null,
  loading: true,
  products: [],
  configured: false,
  nativeBookingEnabled: false,
});
export function SessionProvider({
  children,
  products,
  configured,
  nativeBookingEnabled,
}: {
  children: ReactNode;
  products: ProductKey[];
  configured: boolean;
  nativeBookingEnabled: boolean;
}) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const client = browser();
    if (!client) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    let mounted = true;
    client.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setUser(data.session?.user || null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user || null);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <Context.Provider
      value={{ user, loading, products, configured, nativeBookingEnabled }}
    >
      {children}
    </Context.Provider>
  );
}
export const useSession = () => useContext(Context);
export function CalendlyFallback() {
  return (
    <div className="notice stack">
      <strong>Book with Coach Tae</strong>
      <p>
        Choose private or group scheduling in Calendly. Follow any payment
        instructions shown there; do not purchase the same session separately.
      </p>
      <div className="row">
        <a
          className="button"
          href={privateCalendly}
          target="_blank"
          rel="noopener noreferrer"
        >
          Book private training ↗
        </a>
        <a
          className="button secondary"
          href={groupCalendly}
          target="_blank"
          rel="noopener noreferrer"
        >
          Book group training ↗
        </a>
      </div>
    </div>
  );
}
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useSession();
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [remaining, setRemaining] = useState(0),
    [logoutError, setLogoutError] = useState("");
  const pending = useRef(false);
  const retryAt = useRef(0);
  useEffect(() => {
    const tick = () => {
      try {
        retryAt.current = Number(
          sessionStorage.getItem("ct-auth-retry-at") || retryAt.current,
        );
      } catch {
        /* Use the in-memory deadline when storage is unavailable. */
      }
      setRemaining(
        Math.max(0, Math.ceil((retryAt.current - Date.now()) / 1000)),
      );
    };
    queueMicrotask(tick);
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  function backoff(seconds: number) {
    retryAt.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    try {
      sessionStorage.setItem("ct-auth-retry-at", String(retryAt.current));
    } catch {
      /* Best effort; server limits still apply. */
    }
  }
  async function requestCode() {
    const client = browser();
    if (!client) throw new Error("Family sign-in is not configured yet.");
    backoff(OTP_COOLDOWN_SECONDS);
    const result = await client.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    if (result.error) {
      if (result.error.status === 429) backoff(300);
      throw result.error;
    }
    setSent(true);
    setCode("");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current || (!sent && remaining > 0)) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const client = browser();
      if (!client) throw new Error("Family sign-in is not configured yet.");
      if (sent) {
        const result = await client.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: code.trim(),
          type: "email",
        });
        if (result.error) throw result.error;
      } else await requestCode();
    } catch (e) {
      setError(authMessage(e && typeof e === "object" ? e : {}));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (loading)
    return (
      <p className="loading" role="status">
        Loading your secure session…
      </p>
    );
  if (!configured)
    return (
      <div className="stack">
        <div className="notice">
          <strong>The family platform is not open yet.</strong>
          <p>
            Secure family sign-in is being configured. Current training bookings
            remain available below.
          </p>
        </div>
        <CalendlyFallback />
      </div>
    );
  if (user)
    return (
      <div className="stack">
        <div className="row between">
          <span className="muted">Signed in as {user.email}</span>
          <button
            className="secondary"
            disabled={busy}
            onClick={async () => {
              if (pending.current) return;
              pending.current = true;
              setBusy(true);
              setLogoutError("");
              try {
                const client = browser();
                if (!client) throw new Error("AuthUnavailable");
                const result = await client.auth.signOut();
                if (result.error) {
                  const { data, error: sessionError } =
                    await client.auth.getSession();
                  if (sessionError || data.session) throw result.error;
                  setLogoutError(
                    "You are signed out on this device, but sign-out on other devices could not be confirmed. Sign in again to retry signing out of all devices.",
                  );
                }
                setSent(false);
                setCode("");
                setEmail("");
                setError("");
              } catch {
                setLogoutError(
                  "Sign-out could not be completed. Check your connection and try again.",
                );
              } finally {
                pending.current = false;
                setBusy(false);
              }
            }}
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
        {logoutError && (
          <p role="alert" className="notice error">
            {logoutError}
          </p>
        )}
        {children}
      </div>
    );
  return (
    <section className="panel auth">
      <h2>Your family. One training hub.</h2>
      <p className="muted">
        Sign in or create your parent account with a one-time email code. No
        password to remember.
      </p>
      {logoutError && (
        <p role="alert" className="notice error">
          {logoutError}
        </p>
      )}
      <form onSubmit={submit}>
        <label>
          Parent email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sent}
          />
        </label>
        {sent && (
          <>
            <p className="notice" role="status">
              Check your inbox for your sign-in code.
            </p>
            <label>
              Email verification code
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
              />
            </label>
          </>
        )}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <button disabled={busy || (!sent && remaining > 0)}>
          {busy
            ? "Please wait…"
            : sent
              ? "Verify & sign in"
              : remaining > 0
                ? `Try again in ${remaining}s`
                : "Email my sign-in code"}
        </button>
        {sent && (
          <button
            type="button"
            className="secondary"
            disabled={busy || remaining > 0}
            onClick={async () => {
              if (pending.current || remaining > 0) return;
              pending.current = true;
              setBusy(true);
              setError("");
              try {
                await requestCode();
              } catch (e) {
                setError(authMessage(e && typeof e === "object" ? e : {}));
              } finally {
                pending.current = false;
                setBusy(false);
              }
            }}
          >
            {remaining > 0 ? `Resend code in ${remaining}s` : "Resend code"}
          </button>
        )}
        {sent && (
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => {
              setSent(false);
              setCode("");
              setError("");
            }}
          >
            Use another email
          </button>
        )}
        <p className="auth-note">
          Parents manage all athlete accounts. Never share your verification
          code.
        </p>
      </form>
    </section>
  );
}

"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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
}>({ user: null, loading: true, products: [], configured: false });
export function SessionProvider({
  children,
  products,
  configured,
}: {
  children: ReactNode;
  products: ProductKey[];
  configured: boolean;
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
    client.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user || null);
        setLoading(false);
      }
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <Context.Provider value={{ user, loading, products, configured }}>
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
        Our current booking calendar remains available while integrated booking
        is validated.
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
    [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const client = browser();
      if (!client) throw new Error("Family sign-in is not configured yet.");
      const result = sent
        ? await client.auth.verifyOtp({
            email,
            token: code.trim(),
            type: "email",
          })
        : await client.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true },
          });
      if (result.error) throw result.error;
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
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
            onClick={async () => {
              await browser()?.auth.signOut();
            }}
          >
            Sign out
          </button>
        </div>
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
                pattern="[0-9]{6,10}"
                maxLength={10}
              />
            </label>
          </>
        )}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <button disabled={busy}>
          {busy
            ? "Please wait…"
            : sent
              ? "Verify & sign in"
              : "Email my sign-in code"}
        </button>
        {sent && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setSent(false);
              setCode("");
            }}
          >
            Use another email or resend
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

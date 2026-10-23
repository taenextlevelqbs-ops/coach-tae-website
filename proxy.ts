import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isPublicLabPath, safeReturnPath } from "./modules/qb-lab/entry/routes";
import { accountConfig } from "./server/qb-lab/accounts/config";
import { accountCookieOptions, accountCookieAttributes } from "./server/qb-lab/accounts/cookie-policy";
import { verifiedAccount } from "./server/qb-lab/accounts/session";

/** Full server verification on HTML, navigation and RSC requests. No demo/local-storage bypass. */
export async function proxy(request: NextRequest) {
  if (isPublicLabPath(request.nextUrl.pathname)) return NextResponse.next();
  let response = NextResponse.next();
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  };
  const signIn = () => redirectTo(`/qb-lab/sign-in?next=${encodeURIComponent(safeReturnPath(request.nextUrl.pathname + request.nextUrl.search))}`);
  const settings = accountConfig();
  if (!settings) return signIn();
  try {
    const client = createServerClient(settings.provider, settings.key, {
      cookieOptions: accountCookieOptions,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: changes => {
          for (const { name, value } of changes) request.cookies.set(name, value);
          const previous = response.cookies.getAll();
          response = NextResponse.next({ request: { headers: request.headers } });
          for (const cookie of previous) response.cookies.set(cookie);
          for (const { name, value, options } of changes)
            response.cookies.set(name, value, { ...options, ...accountCookieAttributes });
        },
      },
    });
    const member = await verifiedAccount(client);
    const path = decodeURIComponent(request.nextUrl.pathname);
    if ((path === "/qb-lab/coach" || path.startsWith("/qb-lab/coach/")) && member.role !== "coach")
      return redirectTo("/qb-lab/forbidden");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    // Provider failure, expired/revoked session and unverified membership all fail closed.
    return signIn();
  }
}
export const config = { matcher: "/qb-lab/:path*" };

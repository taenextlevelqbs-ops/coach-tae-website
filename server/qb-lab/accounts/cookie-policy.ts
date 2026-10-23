/** Page guards and APIs share the verified session; no JavaScript-readable credentials. */
export const accountCookieAttributes = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
};
export const accountCookieOptions = { name: "qb-stage-auth-v3", ...accountCookieAttributes };

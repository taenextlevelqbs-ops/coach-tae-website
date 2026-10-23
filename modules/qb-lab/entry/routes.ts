export const introductionPath = "/qb-lab/welcome";
export const dashboardPath = "/qb-lab";
const publicPages = new Set([
  introductionPath, "/qb-lab/sample", "/qb-lab/sign-in",
  "/qb-lab/create-account", "/qb-lab/forbidden",
]);
const publicAssets = new Set([
  "/qb-lab/sw.js", "/qb-lab/offline.html", "/qb-lab/offline.css",
  "/qb-lab/manifest.webmanifest", "/qb-lab/icon-192.png", "/qb-lab/icon-512.png",
]);
export function isPublicLabPage(path: string) { return publicPages.has(path); }
export function isPublicLabPath(path: string) { return publicPages.has(path) || publicAssets.has(path); }
/** Only same-site QB LAB destinations. A query, role claim or redirect URL never grants access. */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || value.length > 400 || /[\\\x00-\x20]/.test(value)) return dashboardPath;
  try {
    const url = new URL(value, "https://qb-lab.invalid");
    if (!value.startsWith("/") || url.origin !== "https://qb-lab.invalid" ||
      !(url.pathname === dashboardPath || url.pathname.startsWith(`${dashboardPath}/`)) ||
      isPublicLabPath(url.pathname) || /%(?:2f|5c|2e)/i.test(url.pathname)) return dashboardPath;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return dashboardPath; }
}

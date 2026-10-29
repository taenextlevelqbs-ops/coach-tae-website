import { timingSafeEqual } from "node:crypto";
export function authorizedJobRequest(header: string | null, secret: string) {
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`),
    actual = Buffer.from(header || "");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function matchesJobEnvironment(
  marker: string | null,
  environment: string | undefined,
) {
  return !(marker === "preview" && environment === "production");
}

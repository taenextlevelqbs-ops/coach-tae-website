/** Pure policy boundary. Actor and relationships must come from verified server-side sources, never client JSON. */
export type Actor = {
  id: string;
  role: "adult" | "guardian" | "coach" | "administrator";
  adultVerified: boolean;
};
export type PrivateAthlete = {
  id: string;
  adultOwner: string | null;
  minor: boolean;
  guardians: string[];
  coaches: string[];
  consentExpires: number | null;
  consentRevoked: boolean;
};
export type Action =
  | "read-profile"
  | "assign"
  | "read-released-feedback"
  | "upload"
  | "review"
  | "delete";
export function authorize(
  actor: Actor | null,
  athlete: PrivateAthlete,
  action: Action,
  now: number,
): boolean {
  if (!actor || !actor.adultVerified || !actor.id || !Number.isFinite(now))
    return false;
  const consent =
    !athlete.minor ||
    (!athlete.consentRevoked &&
      athlete.consentExpires !== null &&
      athlete.consentExpires > now &&
      athlete.guardians.length > 0);
  const owner =
    !athlete.minor && athlete.adultOwner === actor.id && actor.role === "adult";
  const guardian =
    athlete.minor &&
    actor.role === "guardian" &&
    athlete.guardians.includes(actor.id);
  if (action === "delete") return owner || guardian; // Revocation must not block a verified privacy deletion request.
  if (!consent) return false;
  const coach = actor.role === "coach" && athlete.coaches.includes(actor.id);
  // An administrator role by itself grants no private athlete access or media capability.
  if (action === "assign" || action === "review") return coach;
  if (action === "upload") return owner || guardian;
  return owner || guardian || coach;
}
export interface SessionVerifier {
  verify(sessionCookie: string): Promise<Actor | null>;
}
export async function authenticatedActor(
  verifier: SessionVerifier | undefined,
  cookie: string | undefined,
) {
  if (!verifier || !cookie) return null;
  try {
    return await verifier.verify(cookie);
  } catch {
    return null;
  }
}
export function validUploadMetadata(input: {
  bytes: number;
  mime: string;
  extension: string;
}) {
  return (
    Number.isInteger(input.bytes) &&
    input.bytes > 0 &&
    input.bytes <= 100 * 1024 * 1024 &&
    ((input.mime === "video/mp4" && input.extension === ".mp4") ||
      (input.mime === "video/quicktime" && input.extension === ".mov"))
  );
}
export type MediaRecord = {
  athlete: PrivateAthlete;
  status: "quarantine" | "validated" | "released";
  deleted: boolean;
  retainedUntil: number;
};
export function canIssueMediaAccess(
  actor: Actor | null,
  media: MediaRecord,
  now: number,
) {
  return (
    !media.deleted &&
    media.retainedUntil > now &&
    media.status !== "quarantine" &&
    authorize(
      actor,
      media.athlete,
      actor?.role === "coach" ? "review" : "read-released-feedback",
      now,
    ) &&
    (actor?.role === "coach" || media.status === "released")
  );
}
export function validPremiumEntitlement(
  actor: Actor | null,
  grant: { accountId: string; providerVerified: boolean; expires: number },
  now: number,
) {
  return (
    !!actor &&
    actor.adultVerified &&
    grant.accountId === actor.id &&
    grant.providerVerified &&
    grant.expires > now
  );
}

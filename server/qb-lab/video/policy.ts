/** Policy scaffolding only. All arguments must come from verified server sessions/repositories, never request JSON or headers. */
export type VideoPrincipal = {
  id: string;
  role: "player" | "coach" | "guardian" | "administrator";
};
export type VideoAthlete = {
  id: string;
  playerUserId: string;
  assignedCoachId: string;
  minor: boolean;
  consent: {
    verified: boolean;
    revoked: boolean;
    expiresAt: number;
    guardianId: string;
  } | null;
};
export type PrivateVideo = {
  id: string;
  athleteId: string;
  playerUserId: string;
  coachUserId: string;
  visibility: "Private";
  status: "quarantine" | "ready" | "deleted";
  retainUntil: number;
};
export function hasConsent(a: VideoAthlete, now: number) {
  return (
    Number.isFinite(now) &&
    (!a.minor ||
      !!(
        a.consent?.verified &&
        !a.consent.revoked &&
        a.consent.guardianId &&
        Number.isFinite(a.consent.expiresAt) &&
        a.consent.expiresAt > now
      ))
  );
}
export function canReadVideo(
  principal: VideoPrincipal | null,
  video: PrivateVideo,
  athlete: VideoAthlete,
  now: number,
) {
  if (
    !principal ||
    !principal.id ||
    !athlete.playerUserId ||
    !athlete.assignedCoachId ||
    !hasConsent(athlete, now) ||
    video.visibility !== "Private" ||
    video.status !== "ready" ||
    !Number.isFinite(video.retainUntil) ||
    video.retainUntil <= now ||
    video.athleteId !== athlete.id ||
    video.playerUserId !== athlete.playerUserId ||
    video.coachUserId !== athlete.assignedCoachId
  )
    return false;
  return (
    (principal.role === "player" && principal.id === video.playerUserId) ||
    (principal.role === "coach" && principal.id === video.coachUserId)
  );
}
export function uploadIntent(
  principal: VideoPrincipal | null,
  athlete: VideoAthlete,
  metadata: { bytes: number; mime: string },
  now: number,
) {
  if (
    !principal ||
    !principal.id ||
    !athlete.id ||
    !athlete.playerUserId ||
    principal.role !== "player" ||
    principal.id !== athlete.playerUserId ||
    !athlete.assignedCoachId ||
    !hasConsent(athlete, now)
  )
    throw new Error("Upload not authorized.");
  if (
    !Number.isSafeInteger(metadata.bytes) ||
    metadata.bytes <= 0 ||
    metadata.bytes > 100 * 1024 * 1024 ||
    !["video/mp4", "video/quicktime"].includes(metadata.mime)
  )
    throw new Error("Unsupported video metadata.");
  // Filename, submitted owner IDs and client visibility are deliberately not accepted.
  return {
    athleteId: athlete.id,
    playerUserId: principal.id,
    coachUserId: athlete.assignedCoachId,
    visibility: "Private" as const,
    status: "quarantine" as const,
    bytes: metadata.bytes,
    mime: metadata.mime,
  };
}

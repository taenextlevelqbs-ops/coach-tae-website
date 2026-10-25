import type { PrivateVideo, VideoAthlete, VideoPrincipal } from "./policy";
/** Future adapters. No implementation is connected and no route calls these interfaces. */
export interface VerifiedVideoSession {
  verify(request: Request): Promise<VideoPrincipal | null>;
}
export interface PrivateVideoRepository {
  athlete(id: string): Promise<VideoAthlete | null>;
  video(id: string): Promise<PrivateVideo | null>;
  createQuarantined(intent: {
    athleteId: string;
    playerUserId: string;
    coachUserId: string;
    visibility: "Private";
    bytes: number;
    mime: string;
  }): Promise<PrivateVideo>;
  revokeAndDelete(id: string): Promise<void>;
}
export interface PrivateVideoStorage {
  /** Server-issued opaque key, bounded byte size, short TTL and quarantined namespace. */
  authorizeUpload(
    key: string,
    bytes: number,
    mime: string,
    ttlSeconds: number,
  ): Promise<{ url: string; expiresAt: number }>;
  /** Only after pair authorization, unrevoked consent, retention and ready-status checks. */
  authorizePlayback(
    key: string,
    ttlSeconds: number,
  ): Promise<{ url: string; expiresAt: number }>;
  delete(key: string): Promise<void>;
}
export interface QuarantinedMediaProcessor {
  /** Verify actual file signatures/size, scan, strip metadata and transcode before marking ready. */
  inspectAndTranscode(
    key: string,
  ): Promise<{ accepted: boolean; durationSeconds: number }>;
}

// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  positions,
  placePlayer,
  parseScript,
} from "../../modules/qb-lab/coach/model";
import {
  canReadVideo,
  uploadIntent,
  type VideoAthlete,
  type PrivateVideo,
} from "../../server/qb-lab/video/policy";
import { privateWorkspaceUnavailable } from "../../server/qb-lab/unavailable";
const athlete: VideoAthlete = {
  id: "athlete-test",
  playerUserId: "player-test",
  assignedCoachId: "coach-test",
  minor: true,
  consent: {
    verified: true,
    revoked: false,
    expiresAt: 2000,
    guardianId: "guardian-test",
  },
};
const video: PrivateVideo = {
  id: "video-test",
  athleteId: athlete.id,
  playerUserId: athlete.playerUserId,
  coachUserId: athlete.assignedCoachId,
  visibility: "Private",
  status: "ready",
  retainUntil: 2000,
};
describe("coach planning contracts", () => {
  it("separates roster formats and moves a player rather than duplicating depth positions", () => {
    expect(
      Object.fromEntries(
        Object.entries(positions).map(([f, p]) => [f, p.length]),
      ),
    ).toEqual({ tackle: 11, passing7: 7, flag5: 5, flag7: 7, flag8: 8 });
    const original = { "QB:1": "A" as const };
    const moved = placePlayer(original, "tackle", "X:2", "A");
    expect(moved).toEqual({ "X:2": "A" });
    expect(original).toEqual({ "QB:1": "A" });
    expect(() => placePlayer({}, "flag5", "QB:1", "A")).toThrow(/pathway/);
    expect(() => placePlayer({}, "tackle", "Invented:1", "A")).toThrow(
      /position/,
    );
    expect(placePlayer(moved, "tackle", "X:2", "")).toEqual({});
  });
  it("parses bounded scripts atomically without inventing routes or accepting ambiguous 7v7", () => {
    const good = "Read study | tackle | 3 | Long | Custom | Third down";
    expect(parseScript(good)[0]).toMatchObject({
      down: 3,
      concept: "Custom",
      format: "tackle",
    });
    expect(parseScript(good)[0]).not.toHaveProperty("playId");
    for (const text of [
      good + "\nbad line",
      good.replace("tackle", "7v7"),
      good.replace("Long", "giant"),
      good.replace("Read study", "<script>"),
      good.repeat(1000),
    ])
      expect(() => parseScript(text)).toThrow();
  });
});
describe("strictly private video policy scaffold", () => {
  it("permits only the exact player/coach pair and never public/team/admin/guardian browsing", () => {
    expect(
      canReadVideo({ id: "player-test", role: "player" }, video, athlete, 1000),
    ).toBe(true);
    expect(
      canReadVideo({ id: "coach-test", role: "coach" }, video, athlete, 1000),
    ).toBe(true);
    for (const principal of [
      null,
      { id: "other-player", role: "player" as const },
      { id: "other-coach", role: "coach" as const },
      { id: "guardian-test", role: "guardian" as const },
      { id: "coach-test", role: "administrator" as const },
      // Matching an ID cannot substitute for the verified role or exact pair.
      { id: "player-test", role: "guardian" as const },
      { id: "player-test", role: "coach" as const },
      { id: "coach-test", role: "player" as const },
    ])
      expect(canReadVideo(principal, video, athlete, 1000)).toBe(false);
    expect(
      canReadVideo(
        { id: "coach-test", role: "coach" },
        video,
        { ...athlete, assignedCoachId: "new-coach" },
        1000,
      ),
    ).toBe(false);
  });
  it("revocation, expiry, quarantine, deletion and malformed timestamps deny playback", () => {
    const p = { id: "player-test", role: "player" as const };
    for (const patch of [
      { consent: null },
      { consent: { ...athlete.consent!, revoked: true } },
      { consent: { ...athlete.consent!, expiresAt: 1000 } },
      { consent: { ...athlete.consent!, expiresAt: Infinity } },
    ])
      expect(canReadVideo(p, video, { ...athlete, ...patch }, 1000)).toBe(
        false,
      );
    for (const patch of [
      { status: "quarantine" as const },
      { status: "deleted" as const },
      { retainUntil: 1000 },
      { retainUntil: NaN },
      { playerUserId: "other-player" },
      { athleteId: "other-athlete" },
      { coachUserId: "other-coach" },
      { visibility: "Public" as "Private" },
    ])
      expect(canReadVideo(p, { ...video, ...patch }, athlete, 1000)).toBe(
        false,
      );
    expect(canReadVideo(p, video, athlete, Infinity)).toBe(false);
    expect(
      canReadVideo(p, video, { ...athlete, assignedCoachId: "" }, 1000),
    ).toBe(false);
  });
  it("derives private intent ownership from trusted relationships and rejects bad metadata", () => {
    const p = { id: "player-test", role: "player" as const };
    const meta = { bytes: 1024, mime: "video/mp4" };
    expect(uploadIntent(p, athlete, meta, 1000)).toMatchObject({
      visibility: "Private",
      status: "quarantine",
      playerUserId: "player-test",
      coachUserId: "coach-test",
    });
    expect(() =>
      uploadIntent({ id: "other", role: "player" }, athlete, meta, 1000),
    ).toThrow(/authorized/);
    for (const principal of [
      { id: "guardian-test", role: "guardian" as const },
      { id: "player-test", role: "guardian" as const },
      { id: "coach-test", role: "coach" as const },
      { id: "player-test", role: "administrator" as const },
    ])
      expect(() => uploadIntent(principal, athlete, meta, 1000)).toThrow(
        /authorized/,
      );
    for (const m of [
      { bytes: 0, mime: "video/mp4" },
      { bytes: 101 * 1024 * 1024, mime: "video/mp4" },
      { bytes: 1024, mime: "text/html" },
    ])
      expect(() => uploadIntent(p, athlete, m, 1000)).toThrow(/metadata/);
  });
  it("real-data routing remains unavailable without accepting or echoing request data", async () => {
    const r = privateWorkspaceUnavailable();
    expect(r.status).toBe(503);
    expect(r.headers.get("Cache-Control")).toBe("no-store");
    expect(await r.json()).toMatchObject({
      code: "PRIVATE_SERVICES_UNAVAILABLE",
    });
  });
});

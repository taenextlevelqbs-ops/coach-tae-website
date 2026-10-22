// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  authorize,
  authenticatedActor,
  canIssueMediaAccess,
  validPremiumEntitlement,
  validUploadMetadata,
  type Actor,
  type PrivateAthlete,
} from "../../server/qb-lab/authorization";
const guardian: Actor = { id: "parent", role: "guardian", adultVerified: true };
const coach: Actor = { id: "coach", role: "coach", adultVerified: true };
const child: PrivateAthlete = {
  id: "child",
  minor: true,
  adultOwner: null,
  guardians: ["parent"],
  coaches: ["coach"],
  consentExpires: 200,
  consentRevoked: false,
};
describe("private access policy boundary", () => {
  it("denies anonymous, unverified, unrelated adults and implicit administrators", () => {
    for (const actor of [
      null,
      { ...guardian, adultVerified: false },
      { ...guardian, id: "other" },
      { ...guardian, role: "administrator" as const },
    ])
      expect(authorize(actor, child, "read-profile", 100)).toBe(false);
  });
  it("separates guardian ownership from explicit coach capabilities", () => {
    expect(authorize(guardian, child, "upload", 100)).toBe(true);
    expect(authorize(guardian, child, "review", 100)).toBe(false);
    expect(authorize(coach, child, "review", 100)).toBe(true);
    expect(authorize(coach, child, "delete", 100)).toBe(false);
    expect(
      authorize({ ...coach, id: "another-coach" }, child, "review", 100),
    ).toBe(false);
  });
  it("revokes all minor private operations on expiry or consent revocation", () => {
    for (const a of [guardian, coach]) {
      expect(authorize(a, child, "read-profile", 200)).toBe(false);
      expect(
        authorize(a, { ...child, consentRevoked: true }, "read-profile", 100),
      ).toBe(false);
    }
  });
  it("allows verified guardian deletion requests after revocation without restoring read access", () => {
    expect(
      authorize(guardian, { ...child, consentRevoked: true }, "delete", 100),
    ).toBe(true);
    expect(
      authorize(
        guardian,
        { ...child, consentRevoked: true },
        "read-profile",
        100,
      ),
    ).toBe(false);
  });
  it("isolates adult accounts without granting guardian or coach rights by role alone", () => {
    const adult: Actor = { id: "adult", role: "adult", adultVerified: true };
    const athlete = { ...child, minor: false, adultOwner: "adult" };
    expect(authorize(adult, athlete, "delete", 100)).toBe(true);
    expect(
      authorize({ ...adult, id: "other" }, athlete, "read-profile", 100),
    ).toBe(false);
  });
  it("requires validated/released, retained and nondeleted media", () => {
    const media = {
      athlete: child,
      status: "validated" as const,
      deleted: false,
      retainedUntil: 200,
    };
    expect(canIssueMediaAccess(coach, media, 100)).toBe(true);
    expect(canIssueMediaAccess(guardian, media, 100)).toBe(false);
    expect(
      canIssueMediaAccess(guardian, { ...media, status: "released" }, 100),
    ).toBe(true);
    expect(
      canIssueMediaAccess(coach, { ...media, status: "quarantine" }, 100),
    ).toBe(false);
    expect(canIssueMediaAccess(coach, { ...media, deleted: true }, 100)).toBe(
      false,
    );
    expect(canIssueMediaAccess(coach, media, 200)).toBe(false);
  });
  it("rejects invalid upload metadata and unsigned/expired/mismatched premium grants", () => {
    expect(
      validUploadMetadata({ bytes: 200, mime: "video/mp4", extension: ".mp4" }),
    ).toBe(true);
    for (const i of [
      { bytes: 0, mime: "video/mp4", extension: ".mp4" },
      { bytes: 100 * 1024 * 1024 + 1, mime: "video/mp4", extension: ".mp4" },
      { bytes: 200, mime: "text/html", extension: ".mp4" },
    ])
      expect(validUploadMetadata(i)).toBe(false);
    expect(
      validPremiumEntitlement(
        guardian,
        { accountId: "parent", providerVerified: true, expires: 200 },
        100,
      ),
    ).toBe(true);
    expect(
      validPremiumEntitlement(
        guardian,
        { accountId: "other", providerVerified: true, expires: 200 },
        100,
      ),
    ).toBe(false);
    expect(
      validPremiumEntitlement(
        guardian,
        { accountId: "parent", providerVerified: false, expires: 200 },
        100,
      ),
    ).toBe(false);
  });
  it("fails closed with no session provider, cookie or successful verification", async () => {
    expect(await authenticatedActor(undefined, "forged-cookie")).toBeNull();
    expect(
      await authenticatedActor(
        {
          verify: async () => {
            throw Error();
          },
        },
        "token",
      ),
    ).toBeNull();
  });
});

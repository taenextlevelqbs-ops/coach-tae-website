import { describe, expect, it } from "vitest";
import { accountConfig } from "@/server/qb-lab/accounts/config";
import {
  boundedJson,
  requireOrigin,
  fields,
  uuid,
  text,
} from "@/server/qb-lab/accounts/http";
const enabled = {
  QB_LAB_ACCOUNTS_STAGE: "synthetic-staging",
  QB_LAB_ACCOUNT_ORIGIN: "https://staging.example.com",
  QB_LAB_SUPABASE_URL: "https://isolated.supabase.co",
  QB_LAB_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_only",
  VERCEL_ENV: "preview",
};
describe("staging account boundary", () => {
  it("defaults off and refuses production even with keys", () => {
    expect(accountConfig({})).toBeNull();
    expect(accountConfig(enabled)).not.toBeNull();
    expect(accountConfig({ ...enabled, VERCEL_ENV: "production" })).toBeNull();
    expect(
      accountConfig({
        ...enabled,
        QB_LAB_SUPABASE_PUBLISHABLE_KEY: "eyJservice-role",
      }),
    ).toBeNull();
    expect(
      accountConfig({
        ...enabled,
        QB_LAB_SUPABASE_URL: "https://isolated.supabase.co.evil.example",
      }),
    ).toBeNull();
    expect(
      accountConfig({
        ...enabled,
        QB_LAB_ACCOUNT_ORIGIN: "http://staging.example.com",
      }),
    ).toBeNull();
  });
  it("requires exact trusted origin for writes", () => {
    expect(() =>
      requireOrigin(
        new Request("https://staging.example.com/api", {
          headers: { origin: enabled.QB_LAB_ACCOUNT_ORIGIN },
        }),
        enabled.QB_LAB_ACCOUNT_ORIGIN,
      ),
    ).not.toThrow();
    for (const origin of [
      "",
      "https://evil.example",
      "https://staging.example.com.evil.example",
    ])
      expect(() =>
        requireOrigin(
          new Request("https://staging.example.com/api", {
            headers: { origin },
          }),
          enabled.QB_LAB_ACCOUNT_ORIGIN,
        ),
      ).toThrow("ORIGIN_DENIED");
  });
  it("bounds actual streamed bytes and rejects malformed bodies and extra authority fields", async () => {
    const request = (body: string) =>
      new Request("https://staging.example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    await expect(boundedJson(request('{"kind":"lesson"}'))).resolves.toEqual({
      kind: "lesson",
    });
    await expect(boundedJson(request("x".repeat(8200)))).rejects.toThrow(
      "BODY_TOO_LARGE",
    );
    for (const body of ["null", "[]", "{"])
      await expect(boundedJson(request(body))).rejects.toThrow("INVALID_BODY");
    expect(() => fields({ role: "coach" }, ["kind"])).toThrow("UNKNOWN_FIELD");
    expect(() => uuid("not-a-uuid")).toThrow("INVALID_ID");
    expect(() => text("\u0000secret", 100)).toThrow("INVALID_TEXT");
  });
});

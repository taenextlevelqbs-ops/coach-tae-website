import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ config: vi.fn(), create: vi.fn(), verify: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.create }));
vi.mock("@/server/qb-lab/accounts/config", () => ({ accountConfig: mocks.config }));
vi.mock("@/server/qb-lab/accounts/session", () => ({ verifiedAccount: mocks.verify }));
import { proxy, config } from "@/proxy";
import { isPublicLabPath, safeReturnPath } from "@/modules/qb-lab/entry/routes";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
const origin = "https://preview.example";
const request = (path: string, headers?: Record<string, string>) => new NextRequest(origin + path, { headers });
beforeEach(() => { vi.resetAllMocks(); mocks.config.mockReturnValue(null); });
describe("public entry and private page boundary", () => {
  it("allows only the explicit public pages/assets without consulting identities", async () => {
    for (const path of ["/qb-lab/welcome", "/qb-lab/sample", "/qb-lab/sign-in", "/qb-lab/create-account", "/qb-lab/sw.js", "/qb-lab/manifest.webmanifest"]) {
      expect((await proxy(request(path))).headers.get("x-middleware-next")).toBe("1");
    }
    expect(mocks.config).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(isPublicLabPath("/qb-lab/sample/private-records")).toBe(false);
    expect(isPublicLabPath("/qb-lab/welcome-pretend")).toBe(false);
  });
  it("denies every private route while services are off despite forged browser claims and RSC headers", async () => {
    for (const path of ["/qb-lab", "/qb-lab/workouts", "/qb-lab/workouts/reset-your-feet", "/qb-lab/recovery", "/qb-lab/simulator/engine?mode=learn", "/qb-lab/playbook", "/qb-lab/progress", "/qb-lab/coach", "/qb-lab/film", "/qb-lab/access"]) {
      const response = await proxy(request(path, { cookie: "role=coach; authenticated=true; qb-stage-auth-v3=forged", rsc: "1", "x-user-role": "coach" }));
      expect(response.status).toBe(307);
      const location = new URL(response.headers.get("location")!);
      expect(location.pathname).toBe("/qb-lab/sign-in");
      expect(location.searchParams.get("next")).toBe(path);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("requires verified provider identity, fails closed on provider errors and restricts coach routes", async () => {
    const client = { marker: "synthetic provider client" };
    mocks.config.mockReturnValue({ provider: "https://synthetic.supabase.co", key: "sb_publishable_synthetic" });
    mocks.create.mockReturnValue(client);
    mocks.verify.mockRejectedValueOnce(new Error("expired"));
    expect((await proxy(request("/qb-lab"))).status).toBe(307);
    mocks.verify.mockResolvedValue({ role: "adult" });
    expect((await proxy(request("/qb-lab"))).headers.get("x-middleware-next")).toBe("1");
    expect(mocks.verify).toHaveBeenCalledWith(client);
    for (const path of ["/qb-lab/coach", "/qb-lab/coach/athletes", "/qb-lab/%63oach"]) {
      expect(new URL((await proxy(request(path))).headers.get("location")!).pathname).toBe("/qb-lab/forbidden");
    }
    mocks.verify.mockResolvedValue({ role: "guardian" });
    expect((await proxy(request("/qb-lab/family"))).status).toBe(200);
    mocks.verify.mockResolvedValue({ role: "coach" });
    expect((await proxy(request("/qb-lab/coach"))).headers.get("x-middleware-next")).toBe("1");
  });
  it("keeps refreshed cookie chunks HttpOnly, Secure and available to both pages and APIs", async () => {
    mocks.config.mockReturnValue({ provider: "https://synthetic.supabase.co", key: "sb_publishable_synthetic" });
    mocks.create.mockReturnValue({});
    mocks.verify.mockImplementation(async () => {
      mocks.create.mock.calls[0][2].cookies.setAll([{ name: "qb-stage-auth-v3.0", value: "synthetic-refreshed", options: { httpOnly: false, secure: false, path: "/unsafe" } }]);
      return { role: "adult" };
    });
    const response = await proxy(request("/qb-lab"));
    const cookie = response.cookies.get("qb-stage-auth-v3.0")!;
    expect(cookie).toMatchObject({ value: "synthetic-refreshed", httpOnly: true, secure: true, sameSite: "strict", path: "/" });
  });
  it("matches protected HTML and prefetch requests without matching the public coaching site or APIs", () => {
    for (const url of ["/qb-lab", "/qb-lab/film", "/qb-lab/workouts?_rsc=synthetic"]) expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
    for (const url of ["/", "/api/qb-lab/private/athletes", "/_next/static/chunk.js"]) expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
  });
});
it("rejects external, malformed, public-loop and encoded redirect destinations", () => {
  for (const value of [undefined, ["/qb-lab/film"], "https://evil.example/qb-lab", "//evil.example/qb-lab", "/\\evil.example", "/qb-lab/../outside", "/qb-lab/%2e%2e/coach", "/qb-lab/%2f%2fevil", "/qb-lab/sign-in", "/qb-lab/welcome", "/qb-labish", "/qb-lab\n"]) expect(safeReturnPath(value)).toBe("/qb-lab");
  expect(safeReturnPath("/qb-lab/workouts?activity=footwork&profile=A")).toBe("/qb-lab/workouts?activity=footwork&profile=A");
});

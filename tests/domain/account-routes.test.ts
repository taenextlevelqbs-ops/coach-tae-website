import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  client: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("@/server/qb-lab/accounts/config", () => ({
  accountConfig: mocks.config,
}));
vi.mock("@/server/qb-lab/accounts/session", () => ({
  accountClient: mocks.client,
  verifiedAccount: mocks.verify,
}));
import { GET, POST } from "@/app/api/qb-lab/account/[...operation]/route";
import { AccountError } from "@/server/qb-lab/accounts/http";
const origin = "https://stage.example";
function request(operation: string, body?: object, trusted = true) {
  return new Request(`${origin}/api/qb-lab/account/${operation}`, {
    method: body ? "POST" : "GET",
    headers: {
      ...(trusted ? { origin } : {}),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
function context(operation: string) {
  return {
    params: Promise.resolve({ operation: operation.split("?")[0].split("/") }),
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.config.mockReturnValue({ origin });
  mocks.verify.mockResolvedValue({
    id: "00000000-0000-4000-8000-000000000001",
    role: "adult",
  });
});
describe("account route guards", () => {
  it("does not read or forward a body when staging is disabled", async () => {
    mocks.config.mockReturnValue(null);
    const req = request("login", { password: "never read" });
    const response = await POST(req, context("login"));
    expect(response.status).toBe(503);
    expect(req.bodyUsed).toBe(false);
    expect(mocks.client).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("rejects cross-origin writes before touching authentication", async () => {
    expect(
      (await POST(request("login", {}, false), context("login"))).status,
    ).toBe(403);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("never accepts a forged client role", async () => {
    mocks.client.mockResolvedValue({});
    expect(
      (
        await POST(
          request("login", {
            email: "synthetic@example.test",
            password: "synthetic",
            role: "coach",
          }),
          context("login"),
        )
      ).status,
    ).toBe(422);
  });
  it("requires verified identity on reads and coach membership on assignments", async () => {
    mocks.client.mockResolvedValue({});
    mocks.verify.mockRejectedValueOnce(
      new AccountError(401, "SIGN_IN_REQUIRED"),
    );
    expect((await GET(request("session"), context("session"))).status).toBe(
      401,
    );
    const op = "assignments?athlete=00000000-0000-4000-8000-000000000101";
    expect(
      (
        await POST(
          request(op, { title: "Read", contentKey: "cover2" }),
          context(op),
        )
      ).status,
    ).toBe(403);
  });
  it("returns generic login failures and never enables signup", async () => {
    const signInWithPassword = vi
      .fn()
      .mockResolvedValue({ error: new Error("upstream details") });
    mocks.client.mockResolvedValue({ auth: { signInWithPassword } });
    const response = await POST(
      request("login", {
        email: "synthetic@example.test",
        password: "synthetic",
      }),
      context("login"),
    );
    expect(await response.json()).toEqual({ code: "SIGN_IN_FAILED" });
    expect(
      (await POST(request("signup", {}), context("signup"))).status,
    ).not.toBe(200);
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { PublicLabShell } from "@/modules/qb-lab/entry/PublicLabShell";
import { Introduction } from "@/modules/qb-lab/entry/Introduction";
import { SignIn } from "@/modules/qb-lab/entry/SignIn";
import { signInMember } from "@/modules/qb-lab/entry/login";
beforeEach(() => { vi.unstubAllGlobals(); });
it("offers four public capabilities and real introduction actions without athlete identity or tracking", () => {
  localStorage.clear(); sessionStorage.clear();
  render(<PublicLabShell><Introduction /></PublicLabShell>);
  expect(screen.getByRole("heading", { name: "Train Smarter. Play Faster." })).toBeVisible();
  expect(screen.getByRole("region", { name: "Inside QB LAB" }).querySelectorAll("article")).toHaveLength(4);
  expect(screen.getByRole("link", { name: "Explore a Sample Drill" })).toHaveAttribute("href", "/qb-lab/sample");
  expect(screen.queryByLabelText("Demo athlete profile")).not.toBeInTheDocument();
  expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0);
});
it("collects no credentials when accounts are not configured", () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  render(<PublicLabShell><SignIn enabled={false} destination="/qb-lab" /></PublicLabShell>);
  expect(screen.getByRole("heading", { name: "Sign-in is not available yet" })).toBeVisible();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign In unavailable" })).toBeDisabled();
  expect(fetcher).not.toHaveBeenCalled();
});
it("only returns a safe dashboard destination after successful verified server sign-in", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ signedIn: true }) });
  vi.stubGlobal("fetch", fetcher);
  await expect(signInMember("synthetic@example.test", "synthetic-only", "/qb-lab")).resolves.toBe("/qb-lab");
  expect(fetcher).toHaveBeenCalledWith("/api/qb-lab/account/login", expect.objectContaining({ credentials: "same-origin", cache: "no-store", body: JSON.stringify({ email: "synthetic@example.test", password: "synthetic-only" }) }));
  await expect(signInMember("synthetic@example.test", "synthetic-only", "https://evil.example")).resolves.toBe("/qb-lab");
  fetcher.mockResolvedValue({ ok: false, json: async () => ({ signedIn: true }) });
  await expect(signInMember("synthetic@example.test", "synthetic-only", "/qb-lab")).rejects.toThrow("SIGN_IN_FAILED");
  fetcher.mockResolvedValue({ ok: true, json: async () => ({}) });
  await expect(signInMember("synthetic@example.test", "synthetic-only", "/qb-lab")).rejects.toThrow("SIGN_IN_FAILED");
});

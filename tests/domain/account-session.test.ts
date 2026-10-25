import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn(), set: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.create }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: mocks.set }),
}));
import {
  accountClient,
  verifiedAccount,
} from "@/server/qb-lab/accounts/session";
beforeEach(() => vi.resetAllMocks());
it("keeps even refreshed provider session cookies secure, HttpOnly and available to verified page guards and APIs", async () => {
  await accountClient({
    origin: "https://stage.example",
    provider: "https://isolated.supabase.co",
    key: "sb_publishable_synthetic",
  });
  const options = mocks.create.mock.calls[0][2];
  options.cookies.setAll([
    {
      name: "qb-stage-auth",
      value: "synthetic",
      options: { httpOnly: false, secure: false, path: "/" },
    },
  ]);
  expect(mocks.set).toHaveBeenCalledWith(
    "qb-stage-auth",
    "synthetic",
    expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    }),
  );
});
it("rejects unverified email, unverified adult membership and metadata-only coach claims", async () => {
  const single = vi
    .fn()
    .mockResolvedValue({
      data: { id: "synthetic", role: "coach", adult_verified: false },
    });
  const client = {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({
          data: {
            user: {
              id: "synthetic",
              email_confirmed_at: null,
              user_metadata: { role: "coach" },
            },
          },
        }),
    },
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
  };
  await expect(verifiedAccount(client as never)).rejects.toThrow(
    "SIGN_IN_REQUIRED",
  );
  client.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: "synthetic",
        email_confirmed_at: "synthetic-date",
        user_metadata: { role: "coach" },
      },
    },
  } as never);
  await expect(verifiedAccount(client as never)).rejects.toThrow(
    "VERIFIED_MEMBERSHIP_REQUIRED",
  );
  single.mockResolvedValue({
    data: { id: "synthetic", role: "adult", adult_verified: true },
  });
  await expect(verifiedAccount(client as never)).resolves.toMatchObject({
    role: "adult",
  });
});
it('requires provider-verified aal2 and matching identity for coach and administrator', async () => {
 const getClaims = vi.fn().mockResolvedValue({ data: { claims: { sub: 'synthetic', aal: 'aal1' } } });
 const single = vi.fn().mockResolvedValue({ data: { id: 'synthetic', role: 'coach', adult_verified: true } });
 const client = { auth: { getUser: async () => ({ data: { user: { id: 'synthetic', email_confirmed_at: 'date' } } }), getClaims }, from: () => ({ select: () => ({ eq: () => ({ single }) }) }) };
 await expect(verifiedAccount(client as never)).rejects.toThrow('MFA_REQUIRED');
 getClaims.mockResolvedValue({ data: { claims: { sub: 'other', aal: 'aal2' } } });
 await expect(verifiedAccount(client as never)).rejects.toThrow('MFA_REQUIRED');
 getClaims.mockResolvedValue({ data: { claims: { sub: 'synthetic', aal: 'aal2' } } });
 await expect(verifiedAccount(client as never)).resolves.toMatchObject({ role: 'coach' });
 single.mockResolvedValue({ data: { id: 'synthetic', role: 'administrator', adult_verified: true } });
 await expect(verifiedAccount(client as never)).resolves.toMatchObject({ role: 'administrator' });
});
it('requires a server-owned athlete linkage and current consent instead of adult self-verification for a minor login',async()=>{
 const rpc=vi.fn().mockResolvedValue({data:false});const client={auth:{getUser:async()=>({data:{user:{id:'synthetic-child',email_confirmed_at:'confirmed'}}})},from:()=>({select:()=>({eq:()=>({single:async()=>({data:{id:'synthetic-child',role:'athlete',adult_verified:false}})})})}),rpc};
 await expect(verifiedAccount(client as never)).rejects.toThrow('VERIFIED_GUARDIAN_LINK_REQUIRED');
 rpc.mockResolvedValue({data:true});await expect(verifiedAccount(client as never)).resolves.toMatchObject({role:'athlete',adult_verified:false});expect(rpc).toHaveBeenCalledWith('qb_identity_ready');
});

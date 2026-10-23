import { accountResponse } from "@/server/qb-lab/accounts/http";
/** No durable webhook inbox/reconciler is provisioned. Never acknowledge and discard paid events. */
export function POST() {
  return accountResponse(
    {
      code: "BILLING_WEBHOOK_NOT_PROVISIONED",
      message:
        "Billing and webhook processing are disabled pending approved infrastructure and durable integration tests.",
    },
    503,
  );
}

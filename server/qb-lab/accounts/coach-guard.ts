import { accountConfig } from "./config";
import { accountClient, verifiedAccount } from "./session";
import { AccountError, accountResponse, requireOrigin } from "./http";
import { privateWorkspaceUnavailable } from "../unavailable";
/** The public coach demo never supplies authorization to this real-data boundary. */
export async function guardedCoach(request: Request) {
  const config = accountConfig();
  if (!config) return privateWorkspaceUnavailable();
  try {
    if (!["GET", "HEAD"].includes(request.method))
      requireOrigin(request, config.origin);
    const account = await verifiedAccount(await accountClient(config));
    if (!["coach", "administrator"].includes(account.role)) throw new AccountError(403, "COACH_REQUIRED");
    // Identity/role alone cannot enable unimplemented roster/media services.
    return privateWorkspaceUnavailable();
  } catch (error) {
    return error instanceof AccountError
      ? accountResponse({ code: error.code }, error.status)
      : accountResponse({ code: "PRIVATE_SERVICES_UNAVAILABLE" }, 503);
  }
}

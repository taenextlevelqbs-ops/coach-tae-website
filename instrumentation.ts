import type { Instrumentation } from "next";
import { operationalError } from "./server/qb-lab/operations/errors";
export const onRequestError: Instrumentation.onRequestError = (
  _error,
  request,
  context,
) => {
  // Disabled by default; no provider, analytics SDK or production configuration is activated.
  if (process.env.QB_LAB_ERROR_LOGGING !== "redacted-console") return;
  const path = request.path.split("?")[0];
  if (
    !(
      path === "/qb-lab" ||
      path.startsWith("/qb-lab/") ||
      path.startsWith("/api/qb-lab/")
    )
  )
    return;
  console.error(
    JSON.stringify(operationalError(context, process.env.NEXT_RUNTIME)),
  );
};

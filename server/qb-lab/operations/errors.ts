/** Allowlisted diagnostics only: never serialize Error, URL, route params, headers, tokens, body or athlete identity. */
export function operationalError(
  context: { routeType?: string; routerKind?: string },
  runtime: string | undefined,
) {
  return {
    event: "qb_lab_server_error",
    severity: "error",
    routeType: ["render", "route", "action", "proxy"].includes(
      context.routeType ?? "",
    )
      ? context.routeType
      : "unknown",
    router: context.routerKind === "App Router" ? "app" : "unknown",
    runtime: runtime === "edge" ? "edge" : "node",
    at: new Date().toISOString(),
  };
}

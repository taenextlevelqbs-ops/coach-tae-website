/** Do not inspect, retain, log or forward real request bodies in the prototype. */
export function privateWorkspaceUnavailable() {
  return Response.json(
    {
      code: "PRIVATE_SERVICES_UNAVAILABLE",
      message:
        "Real coach records and video operations remain disabled until verified authentication, guardian consent and private storage are integrated and tested.",
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    },
  );
}

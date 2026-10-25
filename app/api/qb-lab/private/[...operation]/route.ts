/** Real-data services are fail-closed. No body is read, retained or forwarded. */
function unavailable() {
  return Response.json(
    {
      code: "PRIVATE_SERVICES_UNAVAILABLE",
      message:
        "Accounts, guardian records, billing and private film are disabled in this Preview.",
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
export const GET = unavailable;
export const POST = unavailable;
export const PUT = unavailable;
export const PATCH = unavailable;
export const DELETE = unavailable;

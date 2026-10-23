import { safeReturnPath } from "./routes";
/** Only the existing verified server login can authorize navigation. No demo account creation. */
export async function signInMember(email: string, password: string, destination: string) {
  const response = await fetch("/api/qb-lab/account/login", {
    method: "POST", credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok || data.signedIn !== true) throw new Error("SIGN_IN_FAILED");
  return safeReturnPath(destination);
}

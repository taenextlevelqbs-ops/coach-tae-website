/** UX backoff only; Supabase remains the authority for authentication/rate limits. */
export const OTP_COOLDOWN_SECONDS = 60;
export function authMessage(error: {
  code?: string;
  status?: number;
  message?: string;
}) {
  if (
    error.status === 429 ||
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit"
  )
    return "Too many sign-in attempts. Wait a few minutes before trying again. If this continues, contact Coach Tae so email delivery can be checked.";
  if (error.code === "otp_expired")
    return "That code has expired or is invalid. Check the latest email or request a new code after the countdown.";
  return "Sign-in could not be completed. Check your code and connection, then try again.";
}

import { DateTime } from "luxon";
export const ZONE = "America/New_York";
export function localSlot(date: string, time: string) {
  const dt = DateTime.fromISO(`${date}T${time}`, { zone: ZONE });
  if (
    !dt.isValid ||
    dt.toFormat("HH:mm") !== time ||
    dt.getPossibleOffsets().length !== 1
  )
    throw new Error(
      "Choose an unambiguous Eastern time outside the daylight-saving transition.",
    );
  return dt.toUTC().toISO()!;
}
export function validateParent(v: Record<string, unknown>) {
  const field = (key: string, max: number) => {
    const value = v[key];
    if (typeof value !== "string" || !value.trim() || value.length > max)
      throw new Error(`Invalid ${key}`);
    return value.trim();
  };
  const email = field("email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Invalid email");
  return {
    email,
    parent: field("parent", 100),
    athlete: field("athlete", 100),
    phone: field("phone", 30),
  };
}
export function paidCheckout(
  session: {
    payment_status: string;
    amount_total: number | null;
    currency: string | null;
  },
  amount: number,
) {
  return (
    session.payment_status === "paid" &&
    session.amount_total === amount &&
    session.currency === "usd"
  );
}
export function calendarInvite(
  id: string,
  start: string,
  end: string,
  issuedAt: string = start,
) {
  const stamp = (s: string) =>
    DateTime.fromISO(s).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Coach Tae//Bookings//EN\r\nBEGIN:VEVENT\r\nUID:${id}@coachtaeqb.com\r\nDTSTAMP:${stamp(issuedAt)}\r\nDTSTART:${stamp(start)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:Coach Tae QB Training\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
}

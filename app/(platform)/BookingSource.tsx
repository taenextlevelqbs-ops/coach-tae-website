export function NativeRecordNotice({
  scheduleEditor = false,
}: {
  scheduleEditor?: boolean;
}) {
  return (
    <div className="notice" role="note">
      <strong>Calendly appointments are not synchronized here.</strong>
      <p>
        {scheduleEditor
          ? "This editor changes native availability and native bookings only. It does not change Calendly availability, reschedule Calendly appointments, or send updates to Calendly families."
          : "Booking counts, athlete records, payments and credits shown here cover this website’s native records only. An empty list does not mean you have no Calendly appointments. Manage Calendly bookings in Calendly."}
      </p>
      <p>
        Calendly payments are not reconciled into website credits. Do not pay
        separately for a session already paid in Calendly. QB Lab subscriptions
        are separate from training appointments.
      </p>
    </div>
  );
}

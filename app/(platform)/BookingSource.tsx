export function NativeRecordNotice({
  scheduleEditor = false,
}: {
  scheduleEditor?: boolean;
}) {
  return (
    <div className="notice" role="note">
      <strong>Earlier appointments may not appear here.</strong>
      <p>
        {scheduleEditor
          ? "This editor changes website availability and bookings. Reconcile every earlier appointment as occupied time before opening native availability; this editor does not change appointments in the previous calendar."
          : "These counts and records cover website bookings. An empty list does not mean you have no earlier appointments. Contact Coach Tae to confirm an older appointment before booking it again."}
      </p>
      <p>
        Earlier payments are not automatically converted into website credits.
        Do not pay again for an existing appointment. QB Lab subscriptions are
        separate from training appointments.
      </p>
    </div>
  );
}

export function NativeRecordNotice({
  scheduleEditor = false,
}: {
  scheduleEditor?: boolean;
}) {
  return (
    <div className="notice" role="note">
      <strong>Native training records</strong>
      <p>
        {scheduleEditor
          ? "Schedule edits respect preserved appointment blocks. Review existing occupied times before publishing new availability."
          : "Bookings, credits and athlete profiles belong to this website. Preserved external appointments appear as occupied times and do not create new charges or credits."}
      </p>
    </div>
  );
}

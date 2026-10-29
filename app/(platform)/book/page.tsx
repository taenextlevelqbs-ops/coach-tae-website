import { AuthGate, CalendlyFallback } from "../Session";
import Book from "./Book";
export default function BookPage() {
  return (
    <>
      <div className="hero-card">
        <p className="eyebrow">Your next rep starts here</p>
        <h1>
          Make time.
          <br />
          Make progress.
        </h1>
        <p className="lede">
          Private attention. Competitive small groups. Quarterback development
          built around your athlete.
        </p>
      </div>
      {process.env.PLATFORM_BOOKING_ENABLED === "true" ? (
        <AuthGate>
          <Book />
        </AuthGate>
      ) : (
        <>
          <div className="notice section-gap">
            <strong>Schedule through Calendly.</strong>
            <p>
              Private and group appointments remain in Calendly. This page does
              not collect a separate session payment or change existing
              appointments.
            </p>
          </div>
          <div className="section-gap">
            <CalendlyFallback />
          </div>
        </>
      )}
    </>
  );
}

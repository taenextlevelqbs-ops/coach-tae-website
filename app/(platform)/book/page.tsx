import { AuthGate } from "../Session";
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
            <strong>Native booking is not open yet.</strong>
            <p>
              Please contact Coach Tae before planning a new session. Existing
              appointments are preserved.
            </p>
          </div>
        </>
      )}
    </>
  );
}

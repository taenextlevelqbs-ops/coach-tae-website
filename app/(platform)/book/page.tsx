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
        <div className="notice section-gap" role="status">
          <strong>Online booking is temporarily closed.</strong>
          <p>
            Coach Tae is completing payment and calendar verification. Existing
            appointments remain reserved. Please contact Coach Tae for help with
            an existing booking.
          </p>
        </div>
      )}
    </>
  );
}

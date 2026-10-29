import { AuthGate } from "../../Session";
import Schedule from "./Schedule";
export default function SchedulePage() {
  return (
    <>
      <p className="eyebrow">Coach workspace / Eastern time</p>
      <h1>
        Availability
        <br />& schedule.
      </h1>
      <p className="lede">
        Shape your training week. Changes save to your calendar immediately,
        while existing reservations stay protected.
      </p>
      <AuthGate>
        <Schedule />
      </AuthGate>
    </>
  );
}

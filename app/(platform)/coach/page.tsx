import { AuthGate } from "../Session";
import Coach from "./Coach";
export default function CoachPage() {
  return (
    <>
      <p className="eyebrow">Coach workspace</p>
      <h1>Lead the work.</h1>
      <p className="lede">
        Your schedule, athletes, payments, and QB Lab library. Coach access is
        verified on every request.
      </p>
      <AuthGate>
        <Coach />
      </AuthGate>
    </>
  );
}

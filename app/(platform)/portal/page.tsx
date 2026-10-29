import { AuthGate } from "../Session";
import Portal from "./Portal";
export default function PortalPage() {
  return (
    <>
      <p className="eyebrow">The family training hub</p>
      <h1>
        Every rep.
        <br />
        One place.
      </h1>
      <p className="lede">
        Manage your athletes, sessions, training credits, and QB Lab membership.
      </p>
      <AuthGate>
        <Portal />
      </AuthGate>
    </>
  );
}

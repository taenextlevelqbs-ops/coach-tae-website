import { AuthGate } from "../Session";
import Lab from "./Lab";
export default function LabPage() {
  return (
    <>
      <div className="hero-card">
        <p className="eyebrow">QB Lab / Beyond the field</p>
        <h1>
          Train the mind.
          <br />
          Elevate the game.
        </h1>
        <p className="lede">
          Coach-published football IQ lessons, quizzes, stretching routines, and
          athlete development resources.
        </p>
      </div>
      <AuthGate>
        <Lab />
      </AuthGate>
    </>
  );
}

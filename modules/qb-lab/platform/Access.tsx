import Link from "next/link";
export function Access() {
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">ACCOUNTS & PRIVATE SERVICES</p>
          <h1>Real data stays unavailable.</h1>
          <p className="lab-lede">
            This Preview does not accept athlete registrations, consent records,
            private film or payments. Use synthetic local activities without
            creating an account.
          </p>
        </div>
      </div>
      <section className="lab-panel">
        <h2>What is available now?</h2>
        <p>
          Build a local playbook, run the 2D simulator and record demonstration
          activities in this browser. Local data is not private account storage;
          use no personal information.
        </p>
        <Link className="lab-button primary" href="/qb-lab/simulator">
          Use the local simulator →
        </Link>
        <h2>Before private access opens</h2>
        <p>
          Adult authentication, verified guardian relationships, approved
          consent, assigned-coach authorization, private media scanning and
          tested deletion must be in place. Those services are disabled in this
          Preview.
        </p>
        <Link className="lab-text-link" href="/#training">
          Book through the existing Coach Tae website →
        </Link>
      </section>
    </>
  );
}

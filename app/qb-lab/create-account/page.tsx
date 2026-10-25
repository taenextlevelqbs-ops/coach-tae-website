import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Create Account | QB LAB", alternates: { canonical: "/qb-lab/create-account" } };
export default function Page() {
  return <section className="public-account-page"><h1>Create Account</h1><p>A training space for athletes. A clear role for families.</p>
    <div className="public-status-panel"><h2>Registration is not open yet</h2><p>Account creation stays disabled until dedicated QB LAB infrastructure, secure authentication and the guardian verification and consent process are approved. This preview collects no registration information.</p></div>
    <div className="public-registration-paths"><article><h2>Parent or guardian</h2><p>For a younger athlete, a verified parent or guardian must manage their profile and provide the required consent. An athlete cannot approve their own guardian relationship.</p><p>Verification, privacy choices, withdrawal and deletion must be ready before youth registration or private uploads open.</p><button className="train-button" disabled>Guardian registration unavailable</button></article><article><h2>Adult athlete</h2><p>Adults will have their own account and private training history. Identity and account security must be approved before this pathway opens.</p><button className="train-button" disabled>Adult registration unavailable</button></article></div>
    <p className="public-availability">Younger athletes: explore the sample with a trusted adult. Do not send your name, email, age, photos or videos through this preview.</p>
    <div className="public-account-links"><Link href="/qb-lab/sample">Explore a Sample Drill →</Link><Link href="/qb-lab/sign-in">Sign In availability →</Link></div>
  </section>;
}

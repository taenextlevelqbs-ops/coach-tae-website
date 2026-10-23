import Link from "next/link";
export default function Page() {
  return <section className="public-account-page"><h1>This workspace requires permission</h1><p>A verified coach role is required. Choosing a demo profile or changing a link does not grant access.</p><div className="public-account-links"><Link href="/qb-lab">Back to the athlete dashboard →</Link><Link href="/qb-lab/welcome">QB LAB introduction →</Link></div></section>;
}

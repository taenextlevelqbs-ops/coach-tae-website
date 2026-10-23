import Link from "next/link";
import type { ReactNode } from "react";
import { introductionPath } from "./routes";
/** No demo provider, storage subscription, account records or training completion on public pages. */
export function PublicLabShell({ children }: { children: ReactNode }) {
  return <div className="qb-application public-lab">
    <a className="app-skip" href="#public-lab-main">Skip to QB LAB content</a>
    <header className="public-lab-header">
      <Link href={introductionPath} className="app-wordmark" aria-label="Coach Tae QB LAB introduction"><span className="app-brand-coach">COACH TAE</span><span className="app-brand-lab">QB LAB</span></Link>
      <nav aria-label="QB LAB public navigation"><Link href="/qb-lab/sign-in">Sign In</Link><Link className="public-header-start" href="/qb-lab/create-account">Get Started</Link></nav>
    </header>
    <main id="public-lab-main" className="public-lab-main" tabIndex={-1}>{children}</main>
    <footer className="public-lab-footer"><span>Public preview · No personal information or videos accepted.</span><Link href="/">Coach Tae website</Link></footer>
  </div>;
}

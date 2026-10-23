import { accountConfig } from '@/server/qb-lab/accounts/config';
import { AccountHelp } from '@/modules/qb-lab/membership/AccountHelp';
export const metadata = { title: 'Account security | QB LAB', referrer: 'no-referrer' as const, robots: { index: false, follow: false } };
export default function Page() { return <AccountHelp enabled={accountConfig() !== null} emailEnabled={process.env.QB_LAB_AUTH_EMAIL_STAGE === 'synthetic-staging'} />; }

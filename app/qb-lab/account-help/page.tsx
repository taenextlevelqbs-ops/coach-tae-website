import { accountConfig } from '@/server/qb-lab/accounts/config';
import { AccountHelp } from '@/modules/qb-lab/membership/AccountHelp';
export const metadata = { title: 'Account security | QB LAB', referrer: 'no-referrer' as const, robots: { index: false, follow: false } };
export default async function Page({searchParams}:{searchParams:Promise<{link?:string}>}) { const query=await searchParams; return <AccountHelp initialNotice={query.link==='unsupported'?'This account link is not supported. Request a new invite or recovery email.':''} enabled={accountConfig() !== null} emailEnabled={process.env.QB_LAB_AUTH_EMAIL_STAGE === 'synthetic-staging'} />; }

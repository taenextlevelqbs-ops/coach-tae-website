import { accountConfig } from '@/server/qb-lab/accounts/config';
import { MemberInbox } from '@/modules/qb-lab/membership/MemberInbox';
export default function Page() { return <MemberInbox enabled={accountConfig() !== null} />; }

import { MemberMessages } from "@/modules/qb-lab/mvp/MemberMessages";
import { accountConfig } from '@/server/qb-lab/accounts/config';
import { MemberInbox } from '@/modules/qb-lab/membership/MemberInbox';
export default function Page() {
  if (accountConfig() !== null) return <MemberMessages />; return <MemberInbox enabled={accountConfig() !== null} />; }

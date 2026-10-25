import { MemberProfile } from "@/modules/qb-lab/mvp/MemberProfile";
import { accountConfig } from "@/server/qb-lab/accounts/config";
import { DemoProfile } from "@/modules/qb-lab/DemoProfile";
export default function Page() {
  if (accountConfig() !== null) return <MemberProfile />;
  return <DemoProfile />;
}

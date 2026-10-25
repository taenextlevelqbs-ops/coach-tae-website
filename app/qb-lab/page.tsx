import { MemberHome } from "@/modules/qb-lab/mvp/MemberHome";
import { accountConfig } from "@/server/qb-lab/accounts/config";
import { HomeDashboard } from "@/modules/qb-lab/HomeDashboard";
export default function Page() {
  if (accountConfig() !== null) return <MemberHome />;
  return <HomeDashboard />;
}

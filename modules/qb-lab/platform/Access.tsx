import { accountConfig } from "@/server/qb-lab/accounts/config";
import { AccountWorkspace } from "../accounts/AccountWorkspace";
export function Access() {
  return <AccountWorkspace enabled={accountConfig() !== null} />;
}

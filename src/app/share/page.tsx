import { ShareScreen } from "@/components/share/ShareScreen";
import { NotInToss } from "@/components/layout/NotInToss";
import { IS_TOSS } from "@/lib/platform";

export default function Page() {
  return IS_TOSS ? <NotInToss title="온실 나누기" /> : <ShareScreen />;
}

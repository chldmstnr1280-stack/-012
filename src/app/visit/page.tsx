import { VisitScreen } from "@/components/share/VisitScreen";
import { NotInToss } from "@/components/layout/NotInToss";
import { IS_TOSS } from "@/lib/platform";

export default function Page() {
  return IS_TOSS ? <NotInToss title="온실 구경" /> : <VisitScreen />;
}

import { FriendsScreen } from "@/components/social/FriendsScreen";
import { NotInToss } from "@/components/layout/NotInToss";
import { IS_TOSS } from "@/lib/platform";

export default function Page() {
  return IS_TOSS ? <NotInToss title="친구" /> : <FriendsScreen />;
}

import { WhineScreen } from "@/components/whine/WhineScreen";
import { FreshOnNavigate } from "@/components/layout/FreshOnNavigate";

export const metadata = { title: "셀리에게 징징대기" };

export default function WhinePage() {
  return (
    <FreshOnNavigate>
      <WhineScreen />
    </FreshOnNavigate>
  );
}

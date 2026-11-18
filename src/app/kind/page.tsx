import { KindJourney } from "@/components/kindness/KindJourney";
import { FreshOnNavigate } from "@/components/layout/FreshOnNavigate";

export const metadata = { title: "나에게 다정해지는 연습" };

export default function KindPage() {
  return (
    <FreshOnNavigate>
      <KindJourney />
    </FreshOnNavigate>
  );
}

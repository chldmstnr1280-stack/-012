import { CheckInFlow } from "@/components/checkin/CheckInFlow";
import { FreshOnNavigate } from "@/components/layout/FreshOnNavigate";

export const metadata = { title: "오늘, 몸의 날씨" };

export default function CheckInPage() {
  return (
    <FreshOnNavigate>
      <CheckInFlow />
    </FreshOnNavigate>
  );
}

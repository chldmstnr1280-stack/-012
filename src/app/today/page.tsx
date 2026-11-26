import { TodayRecord } from "@/components/today/TodayRecord";
import { FreshOnNavigate } from "@/components/layout/FreshOnNavigate";

export const metadata = { title: "오늘 기록" };

export default function TodayPage() {
  return (
    <FreshOnNavigate>
      <TodayRecord />
    </FreshOnNavigate>
  );
}

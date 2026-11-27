import { BodyScreen } from "@/components/body/BodyScreen";
import { FreshOnNavigate } from "@/components/layout/FreshOnNavigate";

export const metadata = { title: "오늘 몸속에서는" };

export default function BodyPage() {
  return (
    <FreshOnNavigate>
      <BodyScreen />
    </FreshOnNavigate>
  );
}

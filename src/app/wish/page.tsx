import { WishScreen } from "@/components/wish/WishScreen";
import { FreshOnNavigate } from "@/components/layout/FreshOnNavigate";

export const metadata = { title: "셀리와 소망 빌기" };

export default function WishPage() {
  return (
    <FreshOnNavigate>
      <WishScreen />
    </FreshOnNavigate>
  );
}

import { HomeScreen } from "@/components/home/HomeScreen";
import { FreshOnNavigate } from "@/components/layout/FreshOnNavigate";

export default function Home() {
  return (
    <FreshOnNavigate>
      <HomeScreen />
    </FreshOnNavigate>
  );
}

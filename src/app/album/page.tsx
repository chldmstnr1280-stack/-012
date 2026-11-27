import { AlbumScreen } from "@/components/album/AlbumScreen";
import { FreshOnNavigate } from "@/components/layout/FreshOnNavigate";

export const metadata = { title: "산책 기록실" };

export default function AlbumPage() {
  return (
    <FreshOnNavigate>
      <AlbumScreen />
    </FreshOnNavigate>
  );
}

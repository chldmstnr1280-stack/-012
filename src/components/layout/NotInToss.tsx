import Link from "next/link";
import { SubPage } from "@/components/screens/SubPage";

/** Toss build: features that depend on Kakao login or links to our own site. */
export function NotInToss({ title }: { title: string }) {
  return (
    <SubPage title={title}>
      <div className="glass rounded-[26px] p-5 text-center text-[13.5px] leading-relaxed text-ink-500">
        토스 앱에서는 아직 쓸 수 없는 기능이에요.
        <br />
        기록, 셀리, 호흡, 산책, 리포트는 모두 그대로 쓸 수 있어요.
        <Link href="/" className="mt-4 block h-11 rounded-full bg-sage-50 font-bold leading-[44px] text-sage-700">
          온실로 가기
        </Link>
      </div>
    </SubPage>
  );
}

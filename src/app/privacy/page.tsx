import { SubPage } from "@/components/screens/SubPage";

export const metadata = { title: "개인정보 처리방침 · Dear Selly" };

const sections: [string, string[]][] = [
  ["1. 이 기기에만 저장되는 정보", ["기분·컨디션·메모·걸음 수 기록, 생리주기, 마음의 색, 셀리 성장, 온실 꾸미기, 설정은 이용자의 기기(브라우저 저장소)에만 저장되며 서버로 전송되지 않습니다.", "이용자는 설정에서 기록을 파일로 내보내거나 모두 지울 수 있습니다."]],
  ["2. 친구 기능 이용 시 서버에 저장되는 정보", ["카카오 로그인 시: 카카오 회원 식별자, 닉네임, (동의한 경우) 프로필 사진·이메일", "서비스 이용 중: 디어셀리 닉네임, 친구 초대 코드, 친구에게 보여줄 온실 모습(셀리 레벨, 꾸미기, 이용자가 허용한 경우의 기분 꽃 색), 친구 관계, 차단 목록, 주고받은 선물(미리 정해진 선물 종류와 문장)", "건강·감정 기록 원문, 생리주기, 걸음 수, 메모는 서버에 저장하지 않습니다."]],
  ["3. 이용 목적", ["친구 맺기, 친구 온실 구경, 선물 주고받기 기능 제공", "부정 이용 방지(차단, 선물 횟수 제한)"]],
  ["4. 보관 기간과 파기", ["계정을 삭제하면 서버에 저장된 위 정보는 즉시 파기됩니다. 친구 화면의 '계정 삭제'로 언제든 직접 삭제할 수 있습니다.", "로그인을 하지 않은 이용자의 정보는 서버에 저장되지 않습니다."]],
  ["5. 처리 위탁 및 저장 위치", ["데이터베이스·인증: Supabase Inc. (서버 위치: 호주 시드니 리전)", "웹 호스팅: Vercel Inc.", "로그인: 주식회사 카카오"]],
  ["6. 이용자의 권리", ["이용자는 언제든 닉네임을 수정하고, 친구를 끊고, 계정을 삭제할 수 있습니다.", "만 14세 미만은 친구 기능(로그인)을 이용할 수 없습니다."]],
  ["7. 문의", ["개인정보 관련 문의: [운영자 연락처 이메일]"]],
];

export default function PrivacyPage() {
  return (
    <SubPage title="개인정보 처리방침">
      <div className="glass rounded-[26px] p-5 text-[13px] leading-relaxed text-ink-500">
        <p className="mb-3 text-ink-700">디어셀리는 기록을 이용자의 기기 안에 두는 것을 원칙으로 하며, 친구 기능에 필요한 최소한의 정보만 서버에 저장합니다.</p>
        {sections.map(([h, items]) => (
          <section key={h} className="mt-4">
            <h2 className="mb-1 text-[14px] font-bold text-ink-700">{h}</h2>
            <ul className="list-disc space-y-1 pl-4">
              {items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ))}
        <p className="mt-5 text-[11.5px] text-ink-300">시행일: 2026년 11월 5일</p>
      </div>
    </SubPage>
  );
}

"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IS_TOSS } from "@/lib/platform";

/**
 * 내 기록은 어디에 있나요 — one card, plainly: what stays on this phone, what
 * may leave it (and only when), and what never does. Mirrors the privacy page.
 */
export function WhereIsMyData() {
  const rows: { where: string; tone: "green" | "amber" | "grey"; what: string }[] = IS_TOSS
    ? [
        { where: "이 폰에만", tone: "green", what: "모든 기록 — 기분·생리·증상·생리 양·몸의 날씨·메모·소망·편지·연습·산책 사진·셀리 성장. 토스 앱 안의 미니앱 저장소에 있어요." },
        { where: "보내지 않아요", tone: "grey", what: "토스 버전은 로그인·친구·서버 백업이 없어요. 디어셀리 서버로 아무것도 보내지 않아요." },
      ]
    : [
        { where: "이 기기에만", tone: "green", what: "기분·컨디션·메모, 몸의 날씨, 생리 양·수면 시간·증상 메모, 소망·편지·연습·나의 리듬, 산책 사진, 셀리 성장." },
        { where: "동의할 때만 서버로", tone: "amber", what: "‘건강 기록 백업’에 따로 동의하면 생리일·증상 점수·하루 맥락을 백업해요. 철회하면 서버 기록은 바로 지워져요." },
        { where: "친구 기능을 쓸 때", tone: "amber", what: "닉네임·친구·선물, 친구에게 보여 줄 온실 모습(레벨·꾸미기, 허용한 경우 꽃 색)." },
        { where: "익명 방문 통계", tone: "grey", what: "어느 화면에 들어왔는지(주소만). 기록 내용은 보내지 않아요." },
      ];
  const dot = { green: "bg-[#6fae6a]", amber: "bg-[#e6b54a]", grey: "bg-[#b9b2a6]" };
  return (
    <SectionCard icon={<ShieldCheck size={20} className="text-sage-700" />} title="내 기록은 어디에 있나요">
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.where} className="rounded-2xl bg-white/70 px-3.5 py-2.5">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink-700">
              <span className={`h-2.5 w-2.5 rounded-full ${dot[r.tone]}`} aria-hidden />
              {r.where}
            </p>
            <p className="mt-0.5 break-keep text-[12px] leading-relaxed text-ink-500">{r.what}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 break-keep text-[11.5px] leading-relaxed text-ink-500">
        기록을 팔거나 광고에 쓰지 않아요. 위치도 모으지 않아요. 언제든 ‘기록 파일로 내보내기’로 가져가고, ‘모든 데이터 지우기’로 지울 수 있어요.
        {!IS_TOSS && " ‘셀리에게 징징대기’에서 AI 답변을 고른 경우에만, 그 화면의 대화가 답변을 만들 때 잠깐 전송되고 저장되지 않아요."}
      </p>
      <Link href="/privacy" className="mt-2 inline-block text-[12px] font-bold text-sage-700 underline underline-offset-2">
        개인정보 처리방침 전체 보기
      </Link>
    </SectionCard>
  );
}

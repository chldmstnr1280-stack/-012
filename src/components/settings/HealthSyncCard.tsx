"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { useSession } from "@/lib/social/useAuth";
import { CONSENT_VERSION, consentState, giveConsent, lastSynced, withdrawConsent, type ConsentState } from "@/lib/health/sync";
import { useSelly } from "@/lib/selly-store";

/**
 * Separate, explicit consent for keeping health records (period days, PMS
 * symptom scores) on the server. Off by default; everything works without it.
 * ⚠️ The consent wording needs legal review before a public launch.
 */
export function HealthSyncCard() {
  const session = useSession();
  const { showToast } = useSelly();
  const [state, setState] = useState<ConsentState | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const uid = session?.user.id;

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    consentState(uid).then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, [uid]);

  return (
    <SectionCard icon={<ShieldCheck size={20} className="text-sage-700" />} title="건강 기록 백업 (선택)">
      {session === undefined ? null : !session ? (
        <p className="text-[12.5px] leading-relaxed text-ink-500">
          생리일과 증상 기록은 지금 이 기기에만 저장돼요. 기기를 바꿔도 이어 쓰고 싶다면{" "}
          <Link href="/friends" className="font-bold text-sage-700 underline underline-offset-2">
            카카오로 로그인
          </Link>
          한 뒤 여기서 백업을 켤 수 있어요.
        </p>
      ) : state === "unavailable" ? (
        <p className="text-[12.5px] text-ink-500">서버 준비 중이에요. 잠시 후 다시 확인해 주세요.</p>
      ) : state === "partial" ? (
        <div className="flex flex-col gap-2 text-[12.5px] leading-relaxed text-ink-500">
          <p className="rounded-2xl bg-sage-50 px-4 py-3 text-[13px] text-sage-700">백업이 켜져 있어요. 생리일과 증상 기록이 내 계정에만 보관돼요.</p>
          <div className="rounded-2xl bg-white/70 px-4 py-3">
            <p className="font-bold text-ink-700">새로 생긴 ‘하루 맥락’도 백업할까요?</p>
            <p className="mt-1">
              상황·상태·마음·바람(예: 있었던 일, 술·약 복용 여부, 기분, 원하는 것)은 지금 이 기기에만 있어요. 동의하면 같은 방식으로 내 계정에만 보관돼요. 동의하지 않아도
              지금 백업은 그대로예요.
            </p>
          </div>
          <label className="flex items-start gap-2 px-1 text-ink-700">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#739a72]" />
            <span>
              하루 맥락(민감정보 포함)을 서버에 보관하는 것에 <b>별도로 동의</b>해요.
            </span>
          </label>
          <button
            type="button"
            disabled={!agree || busy}
            onClick={async () => {
              if (!uid) return;
              setBusy(true);
              const ok = await giveConsent(uid);
              setBusy(false);
              if (ok) setState("yes");
              showToast(ok ? "하루 맥락도 백업해요" : "켜지 못했어요. 잠시 후 다시 시도해 주세요");
            }}
            className="h-11 rounded-2xl bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[13.5px] font-bold text-white disabled:opacity-45"
          >
            동의하고 하루 맥락도 백업하기
          </button>
          <p className="text-[10.5px] text-ink-300">동의서 버전 {CONSENT_VERSION}</p>
        </div>
      ) : state === "yes" ? (
        <div className="flex flex-col gap-2">
          <p className="rounded-2xl bg-sage-50 px-4 py-3 text-[13px] text-sage-700">
            백업이 켜져 있어요. 생리일, 증상, 하루 맥락이 내 계정에만 보관돼요.
            {lastSynced() && <span className="block text-[11.5px] text-ink-500">마지막 동기화 {new Date(lastSynced()!).toLocaleString("ko-KR")}</span>}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm("동의를 철회할까요?\n서버에 보관된 생리일·증상·하루 맥락 기록이 모두 삭제돼요. 이 기기의 기록은 그대로 남아요.")) return;
              setBusy(true);
              const ok = await withdrawConsent();
              setBusy(false);
              setState(ok ? "no" : state);
              showToast(ok ? "동의를 철회하고 서버 기록을 삭제했어요" : "철회하지 못했어요. 잠시 후 다시 시도해 주세요");
            }}
            className="h-11 rounded-2xl border border-[#f0cfd3] bg-[#fdf3f4] text-[13.5px] font-bold text-[#b4505e] disabled:opacity-60"
          >
            동의 철회 · 서버 기록 삭제
          </button>
        </div>
      ) : state === "no" ? (
        <div className="flex flex-col gap-2 text-[12.5px] leading-relaxed text-ink-500">
          <p>기기를 바꾸거나 여러 기기에서 쓰고 싶을 때 켜는 기능이에요. 켜지 않아도 모든 기록 기능을 그대로 쓸 수 있어요.</p>
          <dl className="rounded-2xl bg-white/70 px-4 py-3">
            <dt className="font-bold text-ink-700">보관하는 정보 (건강정보 · 민감정보)</dt>
            <dd>생리일, PMS 증상 점수, 일상생활 영향 점수, ‘증상 없음’ 표시, 하루 맥락(상황·상태·마음·바람 — 예: 있었던 일, 술·약 복용 여부, 기분, 원하는 것)</dd>
            <dt className="mt-1.5 font-bold text-ink-700">목적</dt>
            <dd>내 기록의 백업과 여러 기기 간 동기화</dd>
            <dt className="mt-1.5 font-bold text-ink-700">보관 기간</dt>
            <dd>동의를 철회하거나 계정을 삭제하면 즉시 삭제</dd>
            <dt className="mt-1.5 font-bold text-ink-700">볼 수 있는 사람</dt>
            <dd>나만 볼 수 있어요. 친구에게 보이지 않고, 제3자에게 제공하지 않아요. (보관 위탁: Supabase, 호주 시드니)</dd>
            <dt className="mt-1.5 font-bold text-ink-700">거부할 권리</dt>
            <dd>동의하지 않아도 불이익이 없어요.</dd>
          </dl>
          <label className="flex items-start gap-2 px-1 text-ink-700">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#739a72]" />
            <span>위 내용을 확인했고, 건강정보와 하루 맥락(민감정보)을 서버에 보관하는 것에 <b>별도로 동의</b>해요.</span>
          </label>
          <button
            type="button"
            disabled={!agree || busy}
            onClick={async () => {
              if (!uid) return;
              setBusy(true);
              const ok = await giveConsent(uid);
              setBusy(false);
              if (ok) setState("yes");
              showToast(ok ? "건강 기록 백업을 켰어요" : "켜지 못했어요. 잠시 후 다시 시도해 주세요");
            }}
            className="h-12 rounded-2xl bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[14px] font-bold text-white disabled:opacity-45"
          >
            동의하고 백업 켜기
          </button>
          <p className="text-[10.5px] text-ink-300">동의서 버전 {CONSENT_VERSION}</p>
        </div>
      ) : (
        <div className="h-16 animate-pulse rounded-2xl bg-white/50" />
      )}
    </SectionCard>
  );
}

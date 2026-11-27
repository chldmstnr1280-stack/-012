"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Download, Trash2 } from "lucide-react";
import { SubPage } from "@/components/screens/SubPage";
import { SectionCard } from "@/components/ui/SectionCard";
import { NoteIcon, SproutLeafIcon } from "@/components/ui/icons";
import { getData, useAppData } from "@/lib/data-store";
import { wipeDevice } from "@/lib/wipe";
import { WhereIsMyData } from "./WhereIsMyData";
import { syncWanted, withdrawConsent } from "@/lib/health/sync";
import { groupPeriods } from "@/lib/cycle";
import { toKey } from "@/lib/date";
import { useSelly } from "@/lib/selly-store";
import { InstallCard } from "./InstallCard";
import { ImportBackup } from "./ImportBackup";
import { SoundCard } from "./SoundCard";
import { AmbienceCard } from "./AmbienceCard";
import { HealthSyncCard } from "./HealthSyncCard";
import { IS_TOSS } from "@/lib/platform";

export function SettingsScreen() {
  const data = useAppData();
  const { showToast } = useSelly();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [alsoServer, setAlsoServer] = useState(true);
  // read when the dialog opens (localStorage), not during server rendering
  const serverSync = confirming && !IS_TOSS && syncWanted();

  const recordDays = Object.keys(data.entries).length;
  const periods = groupPeriods(data.periodDays).length;

  const exportData = async () => {
    if (IS_TOSS) {
      try {
        const { File: TossFile } = await import("@apps-in-toss/web-framework");
        const bytes = new TextEncoder().encode(JSON.stringify(getData(), null, 2));
        let bin = "";
        bytes.forEach((b) => (bin += String.fromCharCode(b)));
        await TossFile.saveBase64({ data: btoa(bin), fileName: `dear-selly-${toKey(new Date())}.json`, mimeType: "application/json" });
        showToast("기록 파일을 저장했어요");
      } catch {
        showToast("파일을 만들지 못했어요");
      }
      return;
    }
    try {
      const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dear-selly-${toKey(new Date())}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("기록 파일을 저장했어요");
    } catch {
      showToast("파일을 만들지 못했어요");
    }
  };

  return (
    <>
      <SubPage title="설정">
        <div className="flex flex-col gap-3">
          {!IS_TOSS && <InstallCard />}

          {!IS_TOSS && (
          <Link
            href="/share"
            className="glass flex items-center justify-between rounded-[22px] px-4 py-3.5 text-[14.5px] font-bold text-ink-700 active:scale-[0.99]"
          >
            <span>💌 온실 나누기</span>
            <span className="text-[12px] font-normal text-ink-500">엽서 · 구경 링크 →</span>
          </Link>
          )}

          <AmbienceCard />

          <SoundCard />

          <SectionCard icon={<NoteIcon />} title="내 데이터">
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ["기록한 날", `${recordDays}일`],
                ["생리 기록", `${periods}회`],
                ["셀리", `Lv. ${data.progress.level}`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white/65 py-3">
                  <dt className="text-[11.5px] text-ink-500">{k}</dt>
                  <dd className="mt-0.5 text-[17px] font-bold tabular-nums text-ink-700">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-500">
              {IS_TOSS ? (
                <>
                  모든 기록은 <b className="text-ink-700">이 기기의 토스 앱 안에만</b> 저장되고 서버로 보내지 않아요. 필요하면 파일로 보관해 두세요. 내보낸 파일은 다른 기기에서
                  가져올 수 있어요.
                </>
              ) : (
                <>
                  모든 기록은 <b className="text-ink-700">이 기기의 브라우저에만</b> 저장되고 서버로 보내지 않아요. 브라우저 데이터를 지우면 기록도 함께 사라지니,
                  필요하면 파일로 보관해 두세요. 내보낸 파일은 다른 기기나 홈 화면 앱에서 가져올 수 있어요.
                </>
              )}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={exportData} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[14px] font-bold text-sage-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.4)]">
                <Download size={17} />
                기록 파일로 내보내기
              </button>
              <ImportBackup />
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#f0cfd3] bg-[#fdf3f4] text-[14px] font-bold text-[#b4505e]"
              >
                <Trash2 size={17} />
                모든 데이터 지우기
              </button>
            </div>
          </SectionCard>

          <WhereIsMyData />

          {!IS_TOSS && <HealthSyncCard />}

          <SectionCard icon={<SproutLeafIcon />} title="Dear Selly">
            <p className="font-script text-[26px] leading-tight text-sage-700">Held, not healed.</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
              나를 고치려 하기보다, 있는 그대로 안아주는 작은 정원. 셀리와 함께 하루를 기록하고 숨을 고르며 천천히 나를 돌봐요.
            </p>
            <ul className="mt-3 flex flex-col gap-1.5 text-[12px] leading-relaxed text-ink-500">
              <li>· 디어셀리는 의료 서비스가 아니며 진단이나 치료를 대신하지 않아요.</li>
              <li>· 주기 예측은 기록을 바탕으로 한 참고용이에요. 피임이나 의료적 판단에 사용하지 마세요.</li>
              <li>· 몸이나 마음이 많이 힘들 때는 가까운 전문가에게 도움을 요청해 주세요.</li>
              <li>· 기기의 &lsquo;동작 줄이기&rsquo; 설정을 켜면 셀리의 움직임도 차분해져요.</li>
            </ul>
            <p className="mt-3 text-[11px] text-ink-300">버전 0.8.0 · MVP</p>
          </SectionCard>
        </div>
      </SubPage>

      <AnimatePresence>
        {confirming && (
          <motion.div className="absolute inset-0 z-50 grid place-items-center px-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="취소" onClick={() => setConfirming(false)} className="absolute inset-0 bg-[rgba(60,48,36,0.35)]" />
            <motion.div
              role="alertdialog"
              aria-labelledby="reset-title"
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 6 }}
              className="relative w-full rounded-[28px] bg-cream-50 p-6 text-center shadow-[0_20px_50px_-20px_rgba(60,40,20,0.6)]"
            >
              <p id="reset-title" className="text-[17px] font-bold text-ink-700">
                모든 데이터를 지울까요?
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500">이 기기에 있는 디어셀리의 모든 것이 처음으로 돌아가요. 지운 뒤에는 되돌릴 수 없어요.</p>
              <ul className="mt-2 rounded-2xl bg-white/70 px-4 py-2.5 text-left text-[12px] leading-relaxed text-ink-500">
                <li>· 기분·컨디션·생리·증상·생리 양 기록, 몸의 날씨, 메모</li>
                <li>· 소망, 편지, 다정해지는 연습, 나의 리듬, 호흡 점수</li>
                <li>· 셀리 성장, 온실 꾸미기, 산책 기록·사진, 햇빛 조각</li>
                <li>· 이 기기의 설정{IS_TOSS ? " (토스 앱 안에 저장된 복사본도 함께)" : ""}</li>
              </ul>
              {!IS_TOSS && (
                <div className="mt-2 text-left text-[11.5px] leading-relaxed text-ink-500">
                  {serverSync ? (
                    <label className="flex items-start gap-2 rounded-2xl bg-[#fdf3f4] px-3 py-2.5">
                      <input type="checkbox" checked={alsoServer} onChange={(e) => setAlsoServer(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#e3707e]" />
                      <span>
                        <b className="text-ink-700">서버에 백업한 건강 기록도 지우기</b> (동의 철회). 끄면 다음에 앱을 열 때 서버 기록이 다시 내려와요.
                      </span>
                    </label>
                  ) : (
                    <p>서버로 백업한 건강 기록은 없어요.</p>
                  )}
                  <p className="mt-1">친구 기능 계정(닉네임·친구·선물)은 친구 화면의 ‘계정 삭제’로 지울 수 있어요.</p>
                </div>
              )}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="h-12 rounded-2xl bg-white text-[14px] font-bold text-ink-700 shadow-sm">
                  취소
                </button>
                <button
                  type="button"
                  disabled={wiping}
                  onClick={async () => {
                    setWiping(true);
                    let serverOk = true;
                    if (!IS_TOSS && serverSync && alsoServer) serverOk = await withdrawConsent();
                    await wipeDevice();
                    setWiping(false);
                    setConfirming(false);
                    showToast(serverOk ? "모든 데이터를 지웠어요" : "이 기기의 데이터는 지웠어요. 서버 기록은 지우지 못했어요 — 설정에서 다시 시도해 주세요");
                    router.push("/");
                  }}
                  className="h-12 rounded-2xl bg-[#e3707e] text-[14px] font-bold text-white"
                >
                  지우기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

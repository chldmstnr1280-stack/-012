"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link2, Send } from "lucide-react";
import { SubPage } from "@/components/screens/SubPage";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { SHARE_MESSAGES } from "@/data/shareMessages";
import { useAppData } from "@/lib/data-store";
import { useToday } from "@/lib/date";
import { plantedFlowers } from "@/lib/garden";
import { useAmbience } from "@/lib/game/ambience";
import { readGame } from "@/lib/game/gameStore";
import { canvasToFile, drawPostcard } from "@/lib/share/postcard";
import { encodeSnapshot, type GreenhouseSnapshot } from "@/lib/share/snapshot";
import { useSelly } from "@/lib/selly-store";

export function ShareScreen() {
  const data = useAppData();
  const today = useToday();
  const tod = useAmbience();
  const { showToast } = useSelly();
  const [msg, setMsg] = useState(0);
  const [withFlowers, setWithFlowers] = useState(false);
  const [deco, setDeco] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDeco(readGame().deco ?? {}), 0);
    return () => clearTimeout(t);
  }, []);

  const flowers = useMemo(() => (today ? plantedFlowers(data, today).slice(-7) : []), [data, today]);
  const snap: GreenhouseSnapshot = useMemo(
    () => ({ level: data.progress.level, deco, flowers: withFlowers ? flowers.map((f) => ({ e: f.emotion, s: f.stage })) : [], tod, msg }),
    [data.progress.level, deco, flowers, withFlowers, tod, msg],
  );

  // live preview of the postcard
  useEffect(() => {
    let alive = true;
    let url: string | null = null;
    drawPostcard(snap).then(async (c) => {
      const f = await canvasToFile(c);
      if (!alive) return;
      url = URL.createObjectURL(f);
      setPreview(url);
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [snap]);

  const sharePostcard = async () => {
    setBusy(true);
    try {
      const file = await canvasToFile(await drawPostcard(snap));
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Dear Selly", text: SHARE_MESSAGES[msg] });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        showToast("엽서 이미지를 저장했어요");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") showToast("엽서를 만들지 못했어요");
    } finally {
      setBusy(false);
    }
  };

  const link = () => `${window.location.origin}/visit#${encodeSnapshot(snap)}`;
  const shareLink = async () => {
    const url = link();
    try {
      if (navigator.share) {
        await navigator.share({ title: "내 온실에 놀러 와!", text: `${SHARE_MESSAGES[msg]} — 셀리의 온실 구경하기`, url });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("온실 링크를 복사했어요");
    } catch {
      showToast("링크를 복사하지 못했어요");
    }
  };

  return (
    <SubPage title="온실 나누기">
      <div className="flex flex-col gap-3">
        <section className="glass overflow-hidden rounded-[26px] p-3">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-[20px] bg-[#efe6d4] shadow-[0_10px_30px_-14px_rgba(80,60,40,0.6)]">
            {preview && (
              <motion.img key={preview} src={preview} alt="엽서 미리보기" className="h-full w-full object-cover" initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} />
            )}
          </div>
        </section>

        <SectionCard icon={<SproutLeafIcon />} title="한 마디 고르기">
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="한 마디">
            {SHARE_MESSAGES.map((m, i) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={msg === i}
                onClick={() => setMsg(i)}
                className={`h-11 rounded-2xl px-4 text-left text-[14px] transition ${msg === i ? "bg-white font-bold text-ink-700 shadow-[0_0_0_2px_#8faf91]" : "bg-white/60 text-ink-500"}`}
              >
                {m}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white/65 px-4 py-3">
            <span>
              <span className="block text-[14px] font-bold text-ink-700">기분 꽃도 함께 담기</span>
              <span className="block text-[11.5px] text-ink-500">꽃 색은 기록한 마음이에요. 원할 때만 켜 주세요.</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={withFlowers}
              aria-label="기분 꽃도 함께 담기"
              onClick={() => setWithFlowers((v) => !v)}
              disabled={!flowers.length}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40 ${withFlowers ? "bg-sage-500" : "bg-[#e5ded2]"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${withFlowers ? "left-6" : "left-1"}`} />
            </button>
          </label>
        </SectionCard>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={sharePostcard}
            disabled={busy}
            className="flex h-14 flex-col items-center justify-center rounded-[20px] bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8)] disabled:opacity-60"
          >
            <span className="flex items-center gap-1.5 text-[14.5px] font-bold">
              <Send size={16} />
              엽서 보내기
            </span>
            <span className="text-[10.5px] opacity-90">이미지로 공유 · 저장</span>
          </button>
          <button type="button" onClick={shareLink} className="flex h-14 flex-col items-center justify-center rounded-[20px] bg-white text-sage-700 shadow-[0_6px_16px_-10px_rgba(110,88,60,0.5)]">
            <span className="flex items-center gap-1.5 text-[14.5px] font-bold">
              <Link2 size={16} />
              온실 구경 링크
            </span>
            <span className="text-[10.5px] text-ink-500">앱 없이도 둘러봐요</span>
          </button>
        </div>

        <div className="rounded-2xl bg-white/55 px-4 py-3 text-[12px] leading-relaxed text-ink-500">
          <p className="font-bold text-ink-700">담기는 것</p>
          <p>셀리의 모습과 레벨, 꾸민 온실, 고른 한 마디{withFlowers ? ", 기분 꽃" : ""}</p>
          <p className="mt-1 font-bold text-ink-700">담기지 않는 것</p>
          <p>기분·컨디션 기록, 걸음 수, 생리주기, 메모{withFlowers ? "" : ", 기분 꽃"}</p>
          <p className="mt-1 text-ink-300">링크는 서버에 저장되지 않아요. 온실 정보가 링크 안에만 담겨 있어요.</p>
        </div>
      </div>
    </SubPage>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Download, Trash2, X } from "lucide-react";
import { SubPage } from "@/components/screens/SubPage";
import { MISSION_BY_ID } from "@/data/walkMissions";
import { formatShort, fromKey } from "@/lib/date";
import { readGame } from "@/lib/game/gameStore";
import { IS_TOSS } from "@/lib/platform";
import { useSelly } from "@/lib/selly-store";
import { playSfx } from "@/lib/sound/sfx";
import { deletePhoto, listPhotos, type WalkPhoto } from "@/lib/walk/photos";

type Filter = "all" | "sky" | "other";

/**
 * 산책 기록실 — every photo from the walk missions, kept like a little archive:
 * by month, the sky photos on their own shelf, each one with the day and what
 * Selly said. Only on this device (never uploaded, not in the backup file).
 */
export function AlbumScreen() {
  const { showToast } = useSelly();
  const [photos, setPhotos] = useState<WalkPhoto[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<WalkPhoto | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [version, setVersion] = useState(0);
  const [eyesOnly, setEyesOnly] = useState(0);

  useEffect(() => {
    let alive = true;
    listPhotos().then((p) => alive && setPhotos(p));
    const t = setTimeout(() => setEyesOnly((readGame().missions ?? []).filter((m) => !m.photo && MISSION_BY_ID[m.id]?.kind === "photo").length), 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [version]);

  const shown = useMemo(() => (photos ?? []).filter((p) => (filter === "all" ? true : filter === "sky" ? p.mission === "sky" : p.mission !== "sky")), [photos, filter]);
  const byMonth = useMemo(() => {
    const out: [string, WalkPhoto[]][] = [];
    for (const p of shown) {
      const d = fromKey(p.date);
      const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
      const last = out[out.length - 1];
      if (last && last[0] === label) last[1].push(p);
      else out.push([label, [p]]);
    }
    return out;
  }, [shown]);
  const sky = (photos ?? []).filter((p) => p.mission === "sky").length;
  const days = new Set((photos ?? []).map((p) => p.date)).size;

  const save = async (p: WalkPhoto) => {
    const fileName = `dear-selly-${p.mission}-${p.date}.jpg`;
    try {
      if (IS_TOSS) {
        const { File: TossFile } = await import("@apps-in-toss/web-framework");
        await TossFile.saveBase64({ data: p.dataUrl.split(",")[1], fileName, mimeType: "image/jpeg" });
      } else {
        const a = document.createElement("a");
        a.href = p.dataUrl;
        a.download = fileName;
        a.click();
      }
      showToast("사진을 저장했어요");
    } catch {
      showToast("사진을 저장하지 못했어요");
    }
  };

  return (
    <SubPage title="산책 기록실">
      <div className="flex flex-col gap-3 pb-6">
        {/* the shelf label */}
        <section className="glass rounded-[24px] px-4 py-3.5" aria-label="기록실 요약">
          <p className="text-[14px] font-bold text-ink-700">셀리와 걸으며 담은 순간들</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <Stat n={photos?.length ?? 0} label="사진" />
            <Stat n={sky} label="☁️ 하늘" />
            <Stat n={days} label="산책한 날" />
          </div>
          {eyesOnly > 0 && <p className="mt-2 text-center text-[11.5px] text-ink-500">사진 없이 눈에만 담은 순간도 {eyesOnly}번 있었어요 👀</p>}
        </section>

        <div className="flex gap-1.5" role="radiogroup" aria-label="사진 고르기">
          {(
            [
              ["all", "전체"],
              ["sky", "☁️ 하늘"],
              ["other", "🌿 그 밖의 미션"],
            ] as const
          ).map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={filter === v} onClick={() => setFilter(v)} className={`h-9 rounded-full px-3.5 text-[12.5px] font-bold ${filter === v ? "bg-sage-500 text-white" : "bg-white/85 text-ink-500"}`}>
              {label}
            </button>
          ))}
        </div>

        {photos === null ? null : shown.length === 0 ? (
          <section className="glass rounded-[24px] px-4 py-6 text-center">
            <p className="text-[34px]" aria-hidden>
              {filter === "sky" ? "☁️" : "📷"}
            </p>
            <p className="mt-1 break-keep text-[13.5px] text-ink-700">{filter === "sky" ? "아직 하늘 사진이 없어요." : "아직 사진이 없어요."}</p>
            <p className="mt-1 break-keep text-[12px] text-ink-500">산책할 때 ‘오늘의 하늘 찍기’ 같은 사진 미션을 고르면, 찍은 사진이 여기 차곡차곡 모여요.</p>
            <Link href="/walk" className="mt-3 inline-block rounded-full bg-sage-50 px-4 py-2 text-[13px] font-bold text-sage-700">
              셀리와 산책하러 가기
            </Link>
          </section>
        ) : (
          byMonth.map(([month, list]) => (
            <section key={month} aria-label={month}>
              <p className="mb-1.5 px-1 text-[12.5px] font-bold text-ink-500">
                {month} <span className="font-normal">· {list.length}장</span>
              </p>
              <ul className="grid grid-cols-3 gap-1.5">
                {list.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        playSfx("tap");
                        setConfirmDel(false);
                        setOpen(p);
                      }}
                      className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-white shadow-[0_6px_16px_-10px_rgba(80,60,40,0.6)]"
                      aria-label={`${MISSION_BY_ID[p.mission]?.title ?? "산책 사진"}, ${formatShort(p.date)}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.dataUrl} alt="" className="h-full w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/45 to-transparent px-1.5 pb-1 pt-4 text-[10.5px] font-bold text-white">
                        <span>{MISSION_BY_ID[p.mission]?.emoji}</span>
                        <span className="tabular-nums">{fromKey(p.date).getDate()}일</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <p className="px-2 text-center text-[10.5px] leading-relaxed text-ink-300">사진은 이 기기에만 있어요{IS_TOSS ? "(토스 앱 저장소에도 한 벌)" : ""}. 서버로 보내지 않고, 기록 파일 내보내기에도 들어가지 않아요. 최근 60장까지 보관해요.</p>
      </div>

      {/* one photo */}
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(40,30,20,0.55)] p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.figure
              role="dialog"
              aria-label="산책 사진"
              initial={{ scale: 0.92, y: 12, rotate: -1 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[360px] rounded-[10px] bg-[#fffdf8] p-3 pb-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
            >
              <button type="button" aria-label="닫기" onClick={() => setOpen(null)} className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-ink-500 shadow">
                <X size={18} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={open.dataUrl} alt={MISSION_BY_ID[open.mission]?.title ?? "산책 사진"} className="max-h-[56vh] w-full rounded-[4px] object-cover" />
              <figcaption className="mt-3 text-center">
                <p className="text-[15px] font-bold text-ink-700">
                  {MISSION_BY_ID[open.mission]?.emoji} {MISSION_BY_ID[open.mission]?.title ?? "산책 사진"}
                </p>
                <p className="text-[12.5px] text-ink-500">{formatShort(open.date)}</p>
                {MISSION_BY_ID[open.mission]?.done && <p className="mt-2 whitespace-pre-line break-keep text-[13px] leading-relaxed text-[#8a6f60]">“{MISSION_BY_ID[open.mission]!.done}” — 셀리</p>}
              </figcaption>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button type="button" onClick={() => save(open)} className="flex h-10 items-center gap-1.5 rounded-full bg-sage-50 px-4 text-[13px] font-bold text-sage-700">
                  <Download size={15} /> 내 폰에 저장
                </button>
                {confirmDel ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await deletePhoto(open.id);
                      setOpen(null);
                      setVersion((v) => v + 1);
                      showToast("사진을 지웠어요");
                    }}
                    className="h-10 rounded-full bg-[#fbe3e6] px-4 text-[13px] font-bold text-[#9c3f4d]"
                  >
                    정말 지울게요
                  </button>
                ) : (
                  <button type="button" onClick={() => setConfirmDel(true)} className="flex h-10 items-center gap-1 rounded-full px-3 text-[12.5px] text-ink-300">
                    <Trash2 size={14} /> 지우기
                  </button>
                )}
              </div>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </SubPage>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/75 py-2">
      <p className="text-[20px] font-bold tabular-nums text-ink-700">{n}</p>
      <p className="text-[11px] text-ink-500">{label}</p>
    </div>
  );
}

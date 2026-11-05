"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trash2, X } from "lucide-react";
import { SubPage } from "@/components/screens/SubPage";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { MISSION_BY_ID } from "@/data/walkMissions";
import { useAppData } from "@/lib/data-store";
import { formatMonthDay, formatShort, useToday } from "@/lib/date";
import { stickers, weeklyGoals, type Sticker } from "@/lib/game/collection";
import { readGame, updateGame } from "@/lib/game/gameStore";
import { useSelly } from "@/lib/selly-store";
import { playSfx } from "@/lib/sound/sfx";
import { deletePhoto, listPhotos, type WalkPhoto } from "@/lib/walk/photos";

const noop = () => () => {};

/** 스티커북 — this week's small goals, every sticker collected so far, and the walk album. */
export function CollectionScreen() {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const today = useToday();
  const data = useAppData();
  const { addExp, showToast, react } = useSelly();
  const [version, setVersion] = useState(0); // re-read the game store after a change
  const [photos, setPhotos] = useState<WalkPhoto[] | null>(null);
  const [open, setOpen] = useState<WalkPhoto | null>(null);
  const [sticker, setSticker] = useState<Sticker | null>(null);

  useEffect(() => {
    let alive = true;
    listPhotos().then((p) => alive && setPhotos(p));
    return () => {
      alive = false;
    };
  }, [version]);

  if (!mounted || !today) return <SubPage title="스티커북">{null}</SubPage>;
  void version;
  const g = readGame();
  const week = weeklyGoals(data, g, today);
  const book = stickers(g);

  const claim = () => {
    updateGame((d) => ({ weeklyClaimed: [...(d.weeklyClaimed ?? []), week.week] }));
    addExp(10);
    react("cheer");
    playSfx("cheer");
    showToast("🌼 이번 주 꽃도장을 받았어요 · 성장 +10");
    setVersion((v) => v + 1);
  };

  return (
    <SubPage title="스티커북">
      <div className="flex flex-col gap-3">
        {/* this week */}
        <SectionCard
          icon={<SproutLeafIcon />}
          title="이번 주 작은 목표"
          aside={<span className="text-[11px] tabular-nums text-ink-300">{formatMonthDay(week.week)} – {formatMonthDay(week.weekEnd)}</span>}
        >
          <ul className="flex flex-col gap-2">
            {week.goals.map((goal) => {
              const done = goal.count >= goal.target;
              return (
                <li key={goal.id}>
                  <Link href={goal.href} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3.5 py-2.5 active:scale-[0.99]">
                    <span className="text-[22px]" aria-hidden>
                      {goal.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between text-[13.5px]">
                        <b className="text-ink-700">
                          {goal.label} {goal.target}번
                        </b>
                        <span className={`tabular-nums ${done ? "font-bold text-sage-700" : "text-ink-500"}`}>
                          {Math.min(goal.count, goal.target)}/{goal.target}
                          {done && " ✓"}
                        </span>
                      </span>
                      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-[#efe9df]" aria-hidden>
                        <motion.span
                          className="block h-full rounded-full bg-gradient-to-r from-[#b4d3aa] to-[#7ea47a]"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(1, goal.count / goal.target) * 100}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {week.allDone ? (
            week.claimed ? (
              <p className="mt-3 rounded-2xl bg-[#fff3d2] px-4 py-2.5 text-center text-[13px] font-bold text-[#8a6224]">🌼 이번 주 꽃도장을 받았어요. 정말 잘했어요!</p>
            ) : (
              <button
                type="button"
                onClick={claim}
                className="mt-3 h-12 w-full rounded-full bg-gradient-to-b from-[#f6d58a] to-[#e9b64f] text-[15px] font-bold text-white shadow-[0_10px_22px_-12px_rgba(180,130,40,0.9)] active:scale-[0.98]"
              >
                🌼 이번 주 꽃도장 받기
              </button>
            )
          ) : (
            <p className="mt-2.5 text-center text-[11.5px] text-ink-300">못 채워도 괜찮아요. 다음 주에 다시 새 목표가 와요.</p>
          )}
        </SectionCard>

        {/* stickers */}
        <SectionCard icon={<SproutLeafIcon />} title="모은 스티커" aside={<span className="text-[11.5px] tabular-nums text-ink-500">{book.earned} / {book.total}</span>}>
          <div className="flex flex-col gap-4">
            {book.groups.map((gr) => (
              <div key={gr.id}>
                <p className="mb-1.5 text-[12.5px] font-bold text-ink-500">{gr.title}</p>
                <ul className="grid grid-cols-4 gap-2">
                  {gr.items.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSticker(s)}
                        aria-label={s.earned ? `${s.name}${s.count && s.count > 1 ? `, ${s.count}번` : ""}` : `아직 없음: ${s.name}`}
                        className="flex w-full flex-col items-center gap-1 active:scale-95"
                      >
                        <span
                          className={`relative grid h-[58px] w-[58px] place-items-center rounded-full text-[28px] ${s.earned ? "shadow-[0_6px_14px_-8px_rgba(110,88,60,0.6)]" : "opacity-45 grayscale"}`}
                          style={{ background: s.earned ? s.tint : "#efe9df", border: s.earned ? "3px solid #fff" : "2px dashed #d9cfc2" }}
                        >
                          {s.earned ? s.emoji : <span className="text-[18px] text-ink-300">?</span>}
                          {s.earned && s.count && s.count > 1 && (
                            <span className="absolute -right-1 -top-1 rounded-full bg-sage-500 px-1.5 text-[10px] font-bold text-white">×{s.count}</span>
                          )}
                        </span>
                        <span className={`line-clamp-2 break-keep text-center text-[10.5px] leading-tight ${s.earned ? "text-ink-700" : "text-ink-300"}`}>{s.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* walk album */}
        <SectionCard icon={<SproutLeafIcon />} title="산책 앨범" aside={photos ? <span className="text-[11.5px] text-ink-500">{photos.length}장</span> : undefined}>
          {photos && photos.length ? (
            <ul className="grid grid-cols-3 gap-1.5">
              {photos.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setOpen(p)} className="relative block aspect-square w-full overflow-hidden rounded-xl" aria-label={`${MISSION_BY_ID[p.mission]?.title ?? "산책 사진"}, ${formatShort(p.date)}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.dataUrl} alt="" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 rounded-full bg-white/85 px-1.5 text-[11px]">{MISSION_BY_ID[p.mission]?.emoji}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="break-keep text-center text-[12.5px] leading-relaxed text-ink-500">
              산책 미션에서 찍은 하늘, 초록, 꽃 사진이 여기에 모여요.
              <Link href="/walk" className="mt-2 block font-bold text-sage-700 underline underline-offset-4">
                셀리와 산책하러 가기
              </Link>
            </p>
          )}
          <p className="mt-2 text-center text-[10.5px] text-ink-300">사진은 이 기기에만 있어요. 기록 파일 내보내기나 백업에는 포함되지 않아요.</p>
        </SectionCard>
      </div>

      {/* sticker detail */}
      <AnimatePresence>
        {sticker && (
          <Modal onClose={() => setSticker(null)} label={sticker.name}>
            <span
              className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-[46px] ${sticker.earned ? "" : "opacity-45 grayscale"}`}
              style={{ background: sticker.earned ? sticker.tint : "#efe9df", border: "4px solid #fff" }}
            >
              {sticker.earned ? sticker.emoji : "?"}
            </span>
            <p className="mt-3 text-center text-[17px] font-bold text-ink-700">{sticker.name}</p>
            <p className="mt-1 text-center text-[13px] text-ink-500">
              {sticker.earned ? (sticker.count && sticker.count > 1 ? `${sticker.count}번 모았어요` : "모았어요!") : sticker.hint}
            </p>
          </Modal>
        )}
        {open && (
          <Modal onClose={() => setOpen(null)} label="산책 사진">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.dataUrl} alt={MISSION_BY_ID[open.mission]?.title ?? "산책 사진"} className="max-h-[52vh] w-full rounded-2xl object-cover" />
            <p className="mt-3 text-center text-[15px] font-bold text-ink-700">
              {MISSION_BY_ID[open.mission]?.emoji} {MISSION_BY_ID[open.mission]?.title}
            </p>
            <p className="text-center text-[12.5px] text-ink-500">{formatShort(open.date)}</p>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("이 사진을 지울까요?")) return;
                await deletePhoto(open.id);
                setOpen(null);
                setVersion((v) => v + 1);
              }}
              className="mx-auto mt-3 flex items-center gap-1 text-[12px] text-ink-300"
            >
              <Trash2 size={13} /> 사진 지우기
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </SubPage>
  );
}

function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  return (
    <motion.div className="absolute inset-0 z-[70] flex items-center justify-center bg-[rgba(60,45,30,0.35)] p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-label={label}
        initial={{ scale: 0.92, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[340px] rounded-[28px] bg-[#fdfaf3] p-5 shadow-[0_24px_60px_-20px_rgba(60,40,20,0.6)]"
      >
        <button type="button" aria-label="닫기" onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink-300">
          <X size={17} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

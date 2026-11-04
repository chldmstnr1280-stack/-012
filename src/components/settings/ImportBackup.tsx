"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Upload } from "lucide-react";
import {
  MAX_BACKUP_BYTES,
  mergeBackup,
  parseBackup,
  replaceWithBackup,
  type ParsedBackup,
} from "@/lib/backup";
import { applyData, getData } from "@/lib/data-store";
import { groupPeriods } from "@/lib/cycle";
import { useSelly } from "@/lib/selly-store";

export function ImportBackup() {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const { showToast } = useSelly();
  const router = useRouter();
  const hasData =
    Object.keys(getData().entries).length > 0 ||
    getData().periodDays.length > 0;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      showToast("파일이 너무 커요 (5MB 이하)");
      return;
    }
    const res = parseBackup(await file.text());
    if (!res.ok) showToast(res.reason);
    else setPending(res.data);
  };

  const finish = (mode: "merge" | "replace") => {
    if (!pending) return;
    const cur = getData();
    applyData(
      mode === "merge"
        ? mergeBackup(cur, pending)
        : replaceWithBackup(cur, pending),
    );
    setPending(null);
    showToast(
      mode === "merge" ? "기록을 합쳐서 불러왔어요" : "기록을 불러왔어요",
    );
    router.push("/");
  };

  const dates = pending ? Object.keys(pending.entries).sort() : [];

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[14px] font-bold text-sage-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.4)]"
      >
        <Upload size={17} />
        기록 파일 가져오기
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {pending && (
              <motion.div
                className="fixed inset-0 z-50 grid place-items-center px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  aria-label="취소"
                  onClick={() => setPending(null)}
                  className="absolute inset-0 bg-[rgba(60,48,36,0.35)]"
                />
                <motion.div
                  role="dialog"
                  aria-labelledby="import-title"
                  initial={{ scale: 0.94, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="relative w-full max-w-[340px] rounded-[28px] bg-cream-50 p-6 shadow-[0_20px_50px_-20px_rgba(60,40,20,0.6)]"
                >
                  <p
                    id="import-title"
                    className="text-center text-[17px] font-bold text-ink-700"
                  >
                    이 파일을 불러올까요?
                  </p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      ["기록한 날", `${dates.length}일`],
                      [
                        "생리 기록",
                        `${groupPeriods(pending.periodDays).length}회`,
                      ],
                      ["셀리", `Lv. ${pending.progress.level}`],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-2xl bg-white py-2.5">
                        <dt className="text-[11px] text-ink-500">{k}</dt>
                        <dd className="text-[15px] font-bold tabular-nums text-ink-700">
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {dates.length > 0 && (
                    <p className="mt-2 text-center text-[11.5px] tabular-nums text-ink-300">
                      {dates[0]} ~ {dates[dates.length - 1]}
                    </p>
                  )}
                  <div className="mt-5 flex flex-col gap-2">
                    {hasData ? (
                      <>
                        <button
                          type="button"
                          onClick={() => finish("merge")}
                          className="h-12 rounded-2xl bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[14px] font-bold text-white"
                        >
                          지금 기록과 합치기
                        </button>
                        <p className="-mt-1 text-center text-[11px] text-ink-300">
                          같은 날 기록은 더 최근에 수정한 쪽을 남겨요
                        </p>
                        <button
                          type="button"
                          onClick={() => finish("replace")}
                          className="h-12 rounded-2xl border border-[#f0cfd3] bg-[#fdf3f4] text-[14px] font-bold text-[#b4505e]"
                        >
                          지금 기록 지우고 덮어쓰기
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => finish("replace")}
                        className="h-12 rounded-2xl bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[14px] font-bold text-white"
                      >
                        불러오기
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPending(null)}
                      className="h-11 text-[13.5px] text-ink-500"
                    >
                      취소
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

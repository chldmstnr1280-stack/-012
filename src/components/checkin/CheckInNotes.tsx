"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { SubPage } from "@/components/screens/SubPage";
import { BODY, BODY_WEATHERS, FEELINGS, INTENSITY, SITUATIONS } from "@/data/checkin";
import type { ContextTagId } from "@/data/contextTags";
import { ACTIVITIES, deleteCheckIn } from "@/lib/checkin/checkin";
import { MIN_CHECKINS, findPatterns, periodStartsOf } from "@/lib/checkin/patterns";
import { setPrefs, useAppData } from "@/lib/data-store";
import { formatShort, useToday } from "@/lib/date";

const LABEL = Object.fromEntries([...BODY, ...FEELINGS, ...SITUATIONS].map((c) => [c.id, `${c.emoji} ${c.label}`])) as Record<string, string>;
const AFTER: Record<string, string> = { lighter: "조금 가벼워졌어", same: "비슷해", unsure: "잘 모르겠어" };

/** 셀리가 발견한 작은 패턴 + my check-ins (delete any of them; notes update right away). */
export function CheckInNotes() {
  const today = useToday();
  const data = useAppData();
  const list = data.checkins ?? [];
  const on = data.prefs.patterns !== false;
  const [confirm, setConfirm] = useState<string | null>(null);
  const found = today ? findPatterns(list, today, periodStartsOf(data.periodDays)) : null;

  return (
    <SubPage title="몸의 날씨 · 작은 패턴">
      <Link href="/checkin" className="mb-4 flex items-center justify-between rounded-[22px] bg-[linear-gradient(90deg,#eef5e6,#fbeef0)] px-4 py-3.5 shadow-[0_6px_18px_-12px_rgba(110,88,60,0.5)]">
        <span>
          <span className="block text-[15px] font-bold text-ink-700">🌦️ 오늘, 몸의 날씨</span>
          <span className="text-[12px] text-ink-500">30초 체크인 · 언제든 건너뛰어도 돼</span>
        </span>
        <span className="text-[13px] font-bold text-sage-700">시작</span>
      </Link>

      <section className="glass rounded-[26px] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink-700">🔍 셀리가 발견한 작은 패턴</h2>
          <button type="button" role="switch" aria-checked={on} aria-label="작은 패턴 보기" onClick={() => setPrefs({ patterns: !on })} className={`relative h-7 w-12 rounded-full transition-colors ${on ? "bg-sage-500" : "bg-[#d9d2c6]"}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${on ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
        {!on ? (
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500">패턴 찾기를 꺼 두었어. 체크인은 그대로 남고, 셀리는 아무것도 분석하지 않아.</p>
        ) : !found?.enough ? (
          <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-ink-700">
            아직은 함께 알아가는 중이야. 조금씩 기록이 쌓이면 네가 발견하지 못했던 작은 변화를 살펴볼 수 있을 거야.
            <span className="mt-1 block text-[12px] text-ink-500">
              최근 90일 체크인 {found?.count ?? 0}번 · {MIN_CHECKINS}번부터 살펴볼 수 있어
            </span>
          </p>
        ) : found.patterns.length === 0 ? (
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-700">아직 눈에 띄게 반복되는 건 없어. 그것도 하나의 발견이야.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {found.patterns.map((p, i) => (
              <li key={i} className="rounded-2xl bg-white/80 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink-700">
                {p.text}
              </li>
            ))}
          </ul>
        )}
        {on && (
          <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
            네가 남긴 체크인(최근 90일)만 세어 본 거야. 함께 나타난 것이지, 원인이라고 말할 수는 없어. 생리주기와 관련된 내용은 두 번 이상의 주기에 기록이 있을 때만 보여 줘.
          </p>
        )}
      </section>

      <section className="mt-4">
        <h2 className="mb-2 pl-1 text-[14px] font-bold text-ink-700">내 체크인</h2>
        {list.length === 0 && <p className="pl-1 text-[13px] text-ink-500">아직 없어.</p>}
        <ul className="space-y-2">
          {[...list]
            .reverse()
            .slice(0, 60)
            .map((c) => {
              const w = BODY_WEATHERS.find((x) => x.id === c.weather);
              const tags: ContextTagId[] = [...c.body, ...c.feelings, ...c.situations];
              const time = new Date(c.at);
              return (
                <li key={c.id} className="rounded-[20px] bg-white/80 px-3.5 py-3 shadow-[0_4px_12px_-10px_rgba(110,88,60,0.45)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-ink-700">
                      {formatShort(c.date)} {String(time.getHours()).padStart(2, "0")}:{String(time.getMinutes()).padStart(2, "0")} {w ? `· ${w.emoji} ${w.label}` : ""}
                    </span>
                    {confirm === c.id ? (
                      <span className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteCheckIn(c.id);
                            setConfirm(null);
                          }}
                          className="rounded-full bg-[#f6e3e3] px-2.5 py-1 text-[11.5px] font-bold text-[#9c3f4d]"
                        >
                          지우기
                        </button>
                        <button type="button" onClick={() => setConfirm(null)} className="rounded-full px-2 py-1 text-[11.5px] text-ink-500">
                          아니
                        </button>
                      </span>
                    ) : (
                      <button type="button" aria-label="이 체크인 지우기" onClick={() => setConfirm(c.id)} className="grid h-8 w-8 place-items-center rounded-full text-ink-300 active:bg-[#f3ece2]">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                    {tags.length ? tags.map((t) => LABEL[t] ?? t).join(" · ") : "잘 모르겠는 날"}
                    {c.intensity ? ` · 마음 크기 ${INTENSITY[c.intensity - 1]}` : ""}
                  </p>
                  {c.chosen && (
                    <p className="mt-0.5 text-[11.5px] text-ink-500">
                      {ACTIVITIES[c.chosen].emoji} {ACTIVITIES[c.chosen].label}
                      {c.done ? " · 함" : ""}
                      {c.after && c.after !== "skip" ? ` · ${AFTER[c.after]}` : ""}
                    </p>
                  )}
                </li>
              );
            })}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
          체크인은 이 기기와 기록 파일에만 저장돼요. 고른 항목은 그날의 기록(상황·상태·마음)에도 함께 더해지고, 서버 백업에 동의한 경우에만 하루 기록으로 백업돼요. 지우면 이 체크인이 더한 항목도 그날 기록에서 함께 빠져요. 어떤 내용도 AI로 보내지 않아요.
        </p>
      </section>
    </SubPage>
  );
}

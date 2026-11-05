"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubPage } from "@/components/screens/SubPage";
import { formatShort, type DateKey } from "@/lib/date";
import { setCycleRecap, setPmsProfile, useAppData } from "@/lib/data-store";
import { useSelly } from "@/lib/selly-store";
import { PmsPatternForm } from "./PmsPatternForm";

const back = (router: ReturnType<typeof useRouter>, fallback: string) => {
  if (typeof window !== "undefined" && window.history.length > 1) router.back();
  else router.push(fallback);
};

/** /pms/profile — "평소 PMS는 어때?" (pre-question, editable any time). */
export function PmsProfileScreen() {
  const data = useAppData();
  const router = useRouter();
  const { showToast } = useSelly();
  return (
    <SubPage title="평소 PMS 패턴">
      <PmsPatternForm
        key={data.pmsProfile?.updatedAt ?? 0}
        initial={data.pmsProfile}
        intro={
          <>
            <b className="text-ink-700">생리 전에 보통 어떤 변화가 있나요?</b>
            <br />
            평소 느끼던 대로 골라 주세요. 매일 기록이 쌓이기 전까지, 다음 주기를 미리 짐작해 보는 데 참고로 써요. 기록이 쌓이면 실제 기록이 더 우선이에요.
          </>
        }
        saveLabel={data.pmsProfile ? "고친 내용 저장" : "저장하기"}
        onSave={(p) => {
          setPmsProfile(p);
          showToast("평소 패턴을 담았어요");
          back(router, "/report");
        }}
      />
    </SubPage>
  );
}

/** /pms/recap?start=YYYY-MM-DD — "이번 생리 전엔 어땠어?", prefilled from the usual pattern. */
export function PmsRecapScreen() {
  const data = useAppData();
  const router = useRouter();
  const { showToast } = useSelly();
  const [start, setStart] = useState<DateKey | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("start");
    // read once from the URL after mount (the page is static)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) setStart(q);
  }, []);
  if (!start) return <SubPage title="이번 주기 돌아보기">{null}</SubPage>;
  const existing = data.cycleRecaps[start];
  const initial = existing ?? data.pmsProfile;
  return (
    <SubPage title="이번 주기 돌아보기">
      <PmsPatternForm
        key={start}
        initial={initial ? { symptoms: initial.symptoms, onset: initial.onset } : undefined}
        intro={
          <>
            <b className="text-ink-700">{formatShort(start)}에 시작한 생리 전엔 어땠어?</b>
            <br />
            {existing ? "전에 적어 둔 내용이에요." : data.pmsProfile ? "평소 패턴으로 미리 채워 뒀어요. 이번에 달랐던 것만 고쳐 주세요." : "기억나는 만큼만 골라 주세요."} 매달 다를 수 있어서, 주기마다 따로 남겨 둬요.
          </>
        }
        saveLabel="이번 주기로 저장"
        onSave={(p) => {
          setCycleRecap(start, p);
          showToast("이번 주기를 담았어요");
          back(router, "/calendar");
        }}
      />
    </SubPage>
  );
}

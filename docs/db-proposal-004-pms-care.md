# 제안: 004 마이그레이션 (아직 적용하지 않음)

이번 PMS 고도화에서는 **서버 DB를 바꾸지 않았어요.** 새로 생긴 기록은 모두 이 기기와 기록 파일에만 저장돼요.

| 새 기록 | 저장 위치(지금) | 서버 동기화 |
|---|---|---|
| 증상 기록의 `sleepHours`, `note` | 기기 + 기록 파일 | 안 함 — 서버에서 더 새로운 증상 기록을 받아도 이 기기의 값은 유지 (`mergeRemoteDay`) |
| 새 증상 `tearful`(눈물이 남) | 기존 `pms_symptom_days.scores` jsonb 키로 그대로 | **기존 동의 범위 안에서 동기화** (스키마 변경 없음, 키 검사는 앱이 함) |
| `careLog`(돌봄 선택·도움 여부), `lateChecks`(시작 여부 답), `predictionLog`(예측 vs 실제) | 기기 + 기록 파일 | 안 함 |

여러 기기에서 이 기록까지 이어 보려면 아래처럼 **추가만 하는** 마이그레이션이 필요해요. 적용 전에 동의서 문구(새 버전 날짜)와 개인정보 처리방침을 먼저 고쳐야 하고, 기존 행·테이블은 바꾸거나 지우지 않아요.

```sql
-- 004_pms_care.sql (제안 · 미적용) — ADDITIVE ONLY
alter table public.pms_symptom_days
  add column if not exists sleep_hours numeric(3,1) check (sleep_hours between 0 and 16),
  add column if not exists note text check (char_length(note) <= 300);
-- 쓰기는 새 동의 버전(예: '2026-12-01') 이상일 때만: 기존 정책에 조건 추가가 필요 (정책 교체는 리뷰 후)

create table if not exists public.care_log (
  user_id uuid not null references auth.users on delete cascade,
  id text not null,
  day date not null,
  kind text not null check (kind in ('sleep','meal','walk','record','breathe','alone')),
  source text not null check (source in ('pms','late','self')),
  done boolean not null default false,
  helped text check (helped in ('yes','unsure','no','skip')),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.care_log enable row level security;
create policy "care: own with consent" on public.care_log for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.health_consents c where c.user_id = auth.uid() and c.version >= '2026-12-01'));
revoke all on public.care_log from anon;
-- withdraw_health_consent() 에 `delete from care_log where user_id = auth.uid();` 추가
```

연구·분석 목적으로 쓰려면 이 동의와 **별도의** 연구 동의가 필요하고, 지금 앱에는 그런 기능이 없어요.

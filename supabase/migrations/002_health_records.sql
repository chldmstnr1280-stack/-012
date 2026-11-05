-- Dear Selly — 002: optional server copy of health records (PMS Phase A)
--
-- ADDITIVE ONLY: creates new tables; nothing existing is altered or dropped.
-- Health records are sensitive data. They reach the server ONLY after the user
-- gives separate, explicit consent in the app (health_consents). Withdrawing
-- consent deletes every row below for that user. Each row is visible to its
-- owner alone (Row Level Security); there is no friend or admin read path.

create table if not exists public.health_consents (
  user_id      uuid primary key references auth.users on delete cascade,
  version      text not null,              -- consent text version shown to the user
  consented_at timestamptz not null default now()
);

-- days the user marked as period days (actual, never predictions)
create table if not exists public.period_days (
  user_id uuid not null references auth.users on delete cascade,
  day     date not null,
  primary key (user_id, day)
);

-- one row per recorded day; a missing row means "not recorded", never "no symptoms"
create table if not exists public.pms_symptom_days (
  user_id    uuid not null references auth.users on delete cascade,
  day        date not null,
  scores     jsonb not null default '{}'::jsonb,   -- { symptom_id: 0..4 }
  impact     jsonb not null default '{}'::jsonb,   -- { work|relations|daily: 0..4 }
  none       boolean not null default false,       -- user said "no symptoms today"
  updated_at timestamptz not null default now(),
  primary key (user_id, day),
  check (jsonb_typeof(scores) = 'object' and jsonb_typeof(impact) = 'object'),
  check (octet_length(scores::text) < 1000 and octet_length(impact::text) < 300)
);

alter table public.health_consents  enable row level security;
alter table public.period_days      enable row level security;
alter table public.pms_symptom_days enable row level security;

-- consent: owner only
drop policy if exists "consent: own" on public.health_consents;
create policy "consent: own" on public.health_consents
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- records: owner only, and only while consent exists
drop policy if exists "period: own with consent" on public.period_days;
create policy "period: own with consent" on public.period_days
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.health_consents c where c.user_id = auth.uid()));

drop policy if exists "symptoms: own with consent" on public.pms_symptom_days;
create policy "symptoms: own with consent" on public.pms_symptom_days
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.health_consents c where c.user_id = auth.uid()));

revoke all on public.health_consents, public.period_days, public.pms_symptom_days from anon;

-- withdraw consent: delete all server-side health records for the caller
create or replace function public.withdraw_health_consent()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from pms_symptom_days where user_id = auth.uid();
  delete from period_days where user_id = auth.uid();
  delete from health_consents where user_id = auth.uid();
end $$;
revoke execute on function public.withdraw_health_consent() from anon, public;
grant execute on function public.withdraw_health_consent() to authenticated;

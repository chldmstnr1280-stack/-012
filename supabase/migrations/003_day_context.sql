-- Dear Selly — 003: optional server copy of the day context (상황 · 상태 · 마음 · 바람)
--
-- ADDITIVE ONLY: creates one new table and replaces the withdraw function so it
-- also clears the new table. No existing row or table is altered or dropped.
--
-- The day context is personal (feelings, alcohol, medication …). It reaches the
-- server only after consent version 2026-11-06 or later, which names it
-- explicitly; users who agreed to the earlier text keep syncing period days and
-- symptoms only, until they agree to the new text in the app.

create table if not exists public.day_context (
  user_id    uuid not null references auth.users on delete cascade,
  day        date not null,
  tags       text[] not null,                      -- ontology ids, e.g. {deadline,worried,want_rest}
  updated_at timestamptz not null default now(),
  primary key (user_id, day),
  check (cardinality(tags) between 1 and 80),
  check (array_to_string(tags, ',') ~ '^[a-z_]{1,32}(,[a-z_]{1,32})*$')
);

alter table public.day_context enable row level security;

-- owner only; writing needs the consent version that covers the day context
drop policy if exists "context: own with consent" on public.day_context;
create policy "context: own with consent" on public.day_context
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.health_consents c where c.user_id = auth.uid() and c.version >= '2026-11-06')
  );

revoke all on public.day_context from anon;

-- withdraw consent: delete all server-side health records for the caller (now incl. day context)
create or replace function public.withdraw_health_consent()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from day_context where user_id = auth.uid();
  delete from pms_symptom_days where user_id = auth.uid();
  delete from period_days where user_id = auth.uid();
  delete from health_consents where user_id = auth.uid();
end $$;
revoke execute on function public.withdraw_health_consent() from anon, public;
grant execute on function public.withdraw_health_consent() to authenticated;

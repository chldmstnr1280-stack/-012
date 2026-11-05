-- Dear Selly — social schema (friends, greenhouse visits, small gifts)
--
-- Principle: wellness records (moods, cycle, steps, memos) NEVER live here.
-- The server only knows what friends need: a nickname, a greenhouse snapshot
-- the user chose to share, friendships and small preset gifts.
-- Every table has Row Level Security: people only see themselves and their friends.

-- ───────────── profiles ─────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  nickname    text not null default '셀리 친구' check (char_length(nickname) between 1 and 12),
  invite_code text not null unique default lower(substr(md5(gen_random_uuid()::text), 1, 8)),
  -- same compact format as the visit link (level, decorations, opted-in flowers, line)
  greenhouse  jsonb not null default '{}'::jsonb check (octet_length(greenhouse::text) < 4000),
  updated_at  timestamptz not null default now()
);

-- a profile is created automatically when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── friendships (one row per pair, user_a < user_b) ─────────────
create table if not exists public.friendships (
  user_a     uuid not null references public.profiles(id) on delete cascade,
  user_b     uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create table if not exists public.blocks (
  blocker uuid not null references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  primary key (blocker, blocked)
);

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from friendships where user_a = least(a, b) and user_b = greatest(a, b));
$$;

-- add a friend with their invite code (codes are not readable through the API)
create or replace function public.add_friend(code text)
returns text language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  other public.profiles;
begin
  if me is null then raise exception 'not signed in'; end if;
  select * into other from profiles where invite_code = lower(trim(code));
  if other.id is null or other.id = me then return null; end if;
  if exists (select 1 from blocks where (blocker = other.id and blocked = me) or (blocker = me and blocked = other.id)) then
    return null;
  end if;
  insert into friendships (user_a, user_b) values (least(me, other.id), greatest(me, other.id)) on conflict do nothing;
  return other.nickname;
end $$;

-- remove a friend and make sure they cannot add you back
create or replace function public.block_user(target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  delete from friendships where user_a = least(me, target) and user_b = greatest(me, target);
  insert into blocks (blocker, blocked) values (me, target) on conflict do nothing;
end $$;

-- ───────────── gifts (preset only: no free text can be sent) ─────────────
create table if not exists public.gifts (
  id         bigint generated always as identity primary key,
  from_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  to_id      uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('water', 'seed', 'petal', 'firefly', 'hug')),
  message    smallint not null default 0 check (message between 0 and 9),
  gift_day   date not null default ((now() at time zone 'Asia/Seoul')::date),
  created_at timestamptz not null default now(),
  seen       boolean not null default false,
  -- one of each kind per friend per day: kind, never spammy
  unique (from_id, to_id, kind, gift_day)
);

-- ───────────── row level security ─────────────
alter table public.profiles    enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks      enable row level security;
alter table public.gifts       enable row level security;

drop policy if exists "profiles: self or friends can read" on public.profiles;
create policy "profiles: self or friends can read" on public.profiles
  for select to authenticated using (id = auth.uid() or public.are_friends(id, auth.uid()));
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "friendships: see own" on public.friendships;
create policy "friendships: see own" on public.friendships
  for select to authenticated using (auth.uid() in (user_a, user_b));
drop policy if exists "friendships: leave" on public.friendships;
create policy "friendships: leave" on public.friendships
  for delete to authenticated using (auth.uid() in (user_a, user_b));

drop policy if exists "blocks: see own" on public.blocks;
create policy "blocks: see own" on public.blocks
  for select to authenticated using (blocker = auth.uid());
drop policy if exists "blocks: undo own" on public.blocks;
create policy "blocks: undo own" on public.blocks
  for delete to authenticated using (blocker = auth.uid());

drop policy if exists "gifts: send to friends" on public.gifts;
create policy "gifts: send to friends" on public.gifts
  for insert to authenticated with check (from_id = auth.uid() and public.are_friends(from_id, to_id));
drop policy if exists "gifts: see own" on public.gifts;
create policy "gifts: see own" on public.gifts
  for select to authenticated using (auth.uid() in (from_id, to_id));
drop policy if exists "gifts: mark seen" on public.gifts;
create policy "gifts: mark seen" on public.gifts
  for update to authenticated using (to_id = auth.uid()) with check (to_id = auth.uid());

-- column-level limits on top of RLS
revoke update on public.profiles from authenticated;
grant update (nickname, greenhouse, updated_at) on public.profiles to authenticated;
revoke update on public.gifts from authenticated;
grant update (seen) on public.gifts to authenticated;
revoke all on public.profiles, public.friendships, public.blocks, public.gifts from anon;
revoke execute on function public.add_friend(text), public.block_user(uuid), public.are_friends(uuid, uuid) from anon, public;
grant execute on function public.add_friend(text), public.block_user(uuid), public.are_friends(uuid, uuid) to authenticated;

-- ───────────── self-service account deletion ─────────────
-- removes the auth user; profiles, friendships, blocks and gifts follow by cascade
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.delete_my_account() from anon, public;
grant execute on function public.delete_my_account() to authenticated;

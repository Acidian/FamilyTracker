-- Run once in the Supabase SQL editor. Never put service_role keys in the app.
create extension if not exists pgcrypto with schema extensions;
create table public.households (
  id uuid primary key default gen_random_uuid(),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  revision bigint not null default 0,
  invite_hash text,
  invite_expires_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.household_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade
);
alter table public.households enable row level security;
alter table public.household_members enable row level security;
create policy own_membership on public.household_members for select to authenticated using (user_id = auth.uid());
create policy read_family on public.households for select to authenticated using (id in (select household_id from public.household_members where user_id = auth.uid()));
revoke all on public.households, public.household_members from anon, authenticated;
grant select (id,state,revision,created_at) on public.households to authenticated;
grant select on public.household_members to authenticated;

create function public.create_household(p_state jsonb) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare family uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if exists(select 1 from household_members where user_id = auth.uid()) then raise exception 'Already a family member'; end if;
  if jsonb_typeof(p_state->'members') is distinct from 'array' or jsonb_typeof(p_state->'doses') is distinct from 'array' or jsonb_typeof(p_state->'courses') is distinct from 'array' or jsonb_typeof(p_state->'events') is distinct from 'array' or jsonb_typeof(p_state->'notes') is distinct from 'array' then raise exception 'Invalid family data'; end if;
  insert into households(state) values(p_state) returning id into family;
  insert into household_members values(auth.uid(),family);
  return family;
end; $$;
create function public.save_household(p_id uuid, p_revision bigint, p_state jsonb) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from household_members where user_id=auth.uid() and household_id=p_id) then raise exception 'Not a family member'; end if;
  if jsonb_typeof(p_state->'members') is distinct from 'array' or jsonb_typeof(p_state->'doses') is distinct from 'array' or jsonb_typeof(p_state->'courses') is distinct from 'array' or jsonb_typeof(p_state->'events') is distinct from 'array' or jsonb_typeof(p_state->'notes') is distinct from 'array' then raise exception 'Invalid family data'; end if;
  if exists(select 1 from jsonb_array_elements(p_state->'doses') d where d->>'voidedAt' is null group by d->>'courseId',d->>'slot' having count(*) > 1) then raise exception 'Duplicate dose slot'; end if;
  update households set state=p_state, revision=revision+1 where id=p_id and revision=p_revision;
  return found;
end; $$;
create function public.rotate_invite(p_id uuid) returns text language plpgsql security definer set search_path = public, extensions as $$
declare code text := encode(gen_random_bytes(24),'hex');
begin
  if not exists(select 1 from household_members where user_id=auth.uid() and household_id=p_id) then raise exception 'Not a family member'; end if;
  update households set invite_hash=encode(digest(code,'sha256'),'hex'),invite_expires_at=now()+interval '24 hours' where id=p_id;
  return code;
end; $$;
create function public.join_household(p_code text) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare family uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if exists(select 1 from household_members where user_id=auth.uid()) then raise exception 'Already a family member'; end if;
  select id into family from households where invite_hash=encode(digest(p_code,'sha256'),'hex') and invite_expires_at>now() for update;
  if family is null then raise exception 'Invalid or expired invite'; end if;
  insert into household_members values(auth.uid(),family);
  update households set invite_hash=null,invite_expires_at=null where id=family;
  return family;
end; $$;
revoke all on function public.create_household(jsonb),public.save_household(uuid,bigint,jsonb),public.rotate_invite(uuid),public.join_household(text) from public,anon;
grant execute on function public.create_household(jsonb),public.save_household(uuid,bigint,jsonb),public.rotate_invite(uuid),public.join_household(text) to authenticated;
-- Polling already works. Optional realtime: enable households in Database > Replication.

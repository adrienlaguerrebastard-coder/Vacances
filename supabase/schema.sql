create extension if not exists pgcrypto with schema extensions;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pin_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.availabilities (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  unique (user_id, day),
  constraint availabilities_july_august check (extract(month from day) in (7, 8))
);

create table if not exists public.planned_trips (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  unique (user_id, day),
  constraint planned_trips_july_august check (extract(month from day) in (7, 8))
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.place_availabilities (
  id bigint generated always as identity primary key,
  place_id uuid not null references public.places(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  unique (place_id, day),
  constraint place_availabilities_july_august check (extract(month from day) in (7, 8))
);

create or replace view public.public_users as
select id, name from public.users;

insert into public.users (name, pin_hash) values
('Camille', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf'))),
('Amalia', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf'))),
('Barth', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf'))),
('Brune', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf'))),
('Edgar', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf'))),
('Guillaume', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf'))),
('Maximilien', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf'))),
('Penelope', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf'))),
('Solene', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf'))),
('Louison', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf'))),
('Adrien', extensions.crypt(encode(extensions.gen_random_bytes(16), 'hex'), extensions.gen_salt('bf')))
on conflict (name) do nothing;

alter table public.users enable row level security;
alter table public.availabilities enable row level security;
alter table public.planned_trips enable row level security;
alter table public.places enable row level security;
alter table public.place_availabilities enable row level security;

create policy read_availabilities on public.availabilities for select using (true);
create policy read_planned_trips on public.planned_trips for select using (true);
create policy read_places on public.places for select using (true);
create policy read_place_availabilities on public.place_availabilities for select using (true);

revoke all on public.users from anon, authenticated;
grant select on public.public_users to anon, authenticated;
grant select on public.availabilities to anon, authenticated;
grant select on public.planned_trips to anon, authenticated;
grant select on public.places to anon, authenticated;
grant select on public.place_availabilities to anon, authenticated;

create or replace function public.check_user_pin(p_user_id uuid, p_pin text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.users u
    where u.id = p_user_id
      and u.pin_hash = extensions.crypt(p_pin, u.pin_hash)
  );
$$;

create or replace function public.rpc_verify_user(p_name text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.users%rowtype;
begin
  select * into v_user from public.users where name = p_name limit 1;

  if v_user.id is null then
    return jsonb_build_object('ok', false, 'message', 'Utilisateur introuvable');
  end if;

  if v_user.pin_hash <> extensions.crypt(p_pin, v_user.pin_hash) then
    return jsonb_build_object('ok', false, 'message', 'PIN invalide');
  end if;

  return jsonb_build_object(
    'ok', true,
    'user', jsonb_build_object('id', v_user.id, 'name', v_user.name)
  );
end;
$$;

create or replace function public.rpc_toggle_availability(p_user_id uuid, p_pin text, p_day date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_user_pin(p_user_id, p_pin) then
    raise exception 'PIN invalide';
  end if;

  if extract(month from p_day) not in (7, 8) then
    raise exception 'Date hors juillet/août';
  end if;

  if exists(select 1 from public.availabilities where user_id = p_user_id and day = p_day) then
    delete from public.availabilities where user_id = p_user_id and day = p_day;
    return false;
  else
    delete from public.planned_trips where user_id = p_user_id and day = p_day;
    insert into public.availabilities(user_id, day) values (p_user_id, p_day);
    return true;
  end if;
end;
$$;

create or replace function public.rpc_toggle_planned_trip(p_user_id uuid, p_pin text, p_day date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_user_pin(p_user_id, p_pin) then
    raise exception 'PIN invalide';
  end if;

  if extract(month from p_day) not in (7, 8) then
    raise exception 'Date hors juillet/août';
  end if;

  if exists(select 1 from public.planned_trips where user_id = p_user_id and day = p_day) then
    delete from public.planned_trips where user_id = p_user_id and day = p_day;
    return false;
  else
    delete from public.availabilities where user_id = p_user_id and day = p_day;
    insert into public.planned_trips(user_id, day) values (p_user_id, p_day);
    return true;
  end if;
end;
$$;

create or replace function public.rpc_create_place(p_user_id uuid, p_pin text, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.check_user_pin(p_user_id, p_pin) then
    raise exception 'PIN invalide';
  end if;

  insert into public.places(user_id, name) values (p_user_id, trim(p_name)) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.rpc_update_place_name(p_user_id uuid, p_pin text, p_place_id uuid, p_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_user_pin(p_user_id, p_pin) then
    raise exception 'PIN invalide';
  end if;

  update public.places
  set name = trim(p_name)
  where id = p_place_id and user_id = p_user_id;

  return found;
end;
$$;

create or replace function public.rpc_delete_place(p_user_id uuid, p_pin text, p_place_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_user_pin(p_user_id, p_pin) then
    raise exception 'PIN invalide';
  end if;

  delete from public.places where id = p_place_id and user_id = p_user_id;
  return found;
end;
$$;

create or replace function public.rpc_toggle_place_availability(p_user_id uuid, p_pin text, p_place_id uuid, p_day date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_user_pin(p_user_id, p_pin) then
    raise exception 'PIN invalide';
  end if;

  if extract(month from p_day) not in (7, 8) then
    raise exception 'Date hors juillet/août';
  end if;

  if not exists(select 1 from public.places where id = p_place_id and user_id = p_user_id) then
    raise exception 'Place non autorisée';
  end if;

  if exists(select 1 from public.place_availabilities where place_id = p_place_id and day = p_day) then
    delete from public.place_availabilities where place_id = p_place_id and day = p_day;
    return false;
  else
    insert into public.place_availabilities(place_id, day) values (p_place_id, p_day);
    return true;
  end if;
end;
$$;

grant execute on function public.rpc_verify_user(text, text) to anon, authenticated;
grant execute on function public.rpc_toggle_availability(uuid, text, date) to anon, authenticated;
grant execute on function public.rpc_toggle_planned_trip(uuid, text, date) to anon, authenticated;
grant execute on function public.rpc_create_place(uuid, text, text) to anon, authenticated;
grant execute on function public.rpc_update_place_name(uuid, text, uuid, text) to anon, authenticated;
grant execute on function public.rpc_delete_place(uuid, text, uuid) to anon, authenticated;
grant execute on function public.rpc_toggle_place_availability(uuid, text, uuid, date) to anon, authenticated;

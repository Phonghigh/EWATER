-- EWATER demo auth schema. Run once in the Supabase project's SQL editor.

create type user_role as enum ('citizen', 'authority', 'leadership');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'citizen',
  home_lng double precision,
  home_lat double precision,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "select own profile" on profiles
  for select using (auth.uid() = id);

create policy "update own profile" on profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- Seeding the 3 demo accounts (no public signup in this app):
-- 1. In the Supabase dashboard: Authentication -> Users -> Add user,
--    create one user per role with an email + password of your choice, e.g.
--      dan@ewater.demo         (citizen)
--      chinhquyen@ewater.demo  (authority)
--      lanhdao@ewater.demo     (leadership)
-- 2. Then run the inserts below (adjust emails if you used different ones):

insert into profiles (id, email, full_name, role)
select id, email, 'Người dân (demo)', 'citizen'
from auth.users where email = 'dan@ewater.demo'
on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;

insert into profiles (id, email, full_name, role)
select id, email, 'Chính quyền / cơ quan (demo)', 'authority'
from auth.users where email = 'chinhquyen@ewater.demo'
on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;

insert into profiles (id, email, full_name, role)
select id, email, 'Lãnh đạo (demo)', 'leadership'
from auth.users where email = 'lanhdao@ewater.demo'
on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;

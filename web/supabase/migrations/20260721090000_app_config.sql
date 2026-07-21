-- FE display config (map style, colors, thresholds) was still a static file
-- (shared/config/map-style.json, fetched from /config/map-style.json) even
-- after P0-17/18/19 moved GIS/simulation data into Supabase. Moving it here
-- too so nothing user-editable in the running app is hardcoded in a bundled
-- file: changing a color or the surcharge threshold no longer needs a
-- redeploy, just an UPDATE on this table.
create table app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_config enable row level security;

revoke insert, update, delete, truncate on app_config from anon, authenticated;

create policy "public read access"
  on app_config for select
  to anon, authenticated
  using (true);

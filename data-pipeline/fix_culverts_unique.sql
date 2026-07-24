-- Fix: migration 20260724120000_monitoring_stations.sql was edited to add
-- `unique` on culverts.name AFTER it had already been applied to some live
-- projects — editing the local .sql file retroactively does nothing to an
-- already-applied migration, so the constraint is added here explicitly.
-- Safe to run multiple times (checks pg_constraint first).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'culverts_name_key'
  ) then
    alter table culverts add constraint culverts_name_key unique (name);
  end if;
end $$;

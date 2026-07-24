"""Apply a single .sql migration file to the live Supabase project via the
Management API (same SQL endpoint the import_*.py scripts use) — a stand-in for
`supabase db push` when the Supabase CLI isn't installed.

Usage:
  SUPABASE_ACCESS_TOKEN=... python apply_migration.py --project-ref <ref> \
      --file ../web/supabase/migrations/20260724120000_monitoring_stations.sql
"""
import argparse
import os

from import_static_data import run_sql


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project-ref", required=True)
    ap.add_argument("--file", required=True)
    args = ap.parse_args()
    token = os.environ["SUPABASE_ACCESS_TOKEN"]

    with open(args.file, encoding="utf-8") as f:
        sql = f.read()

    run_sql(args.project_ref, token, sql)
    print(f"applied: {os.path.basename(args.file)}")


if __name__ == "__main__":
    main()

"""Import dynamic mock data (simulation run, rain forecast, tide, flood
zones) into the live Supabase project - same Management API approach as
import_static_data.py. Content stays synthetic/demo (see PLAN.md SS8) but
from now on it lives in Postgres, not bundled shared/data/*.json files.

Usage:
  SUPABASE_ACCESS_TOKEN=... python import_dynamic_data.py --project-ref <ref>
"""
import argparse
import json
import os

from import_static_data import run_sql, sql_str, sql_num, batched, load_geojson, DATA_DIR


def pg_numeric_array(values):
    return "'{" + ",".join(str(v) for v in values) + "}'::numeric[]"


def import_simulation(project_ref, token):
    with open(os.path.join(DATA_DIR, "simulation.json"), encoding="utf-8") as f:
        sim = json.load(f)

    sql = (
        "insert into simulation_runs (step_minutes, steps, start_time, rainfall) values "
        f"({sim['stepMinutes']}, {sim['steps']}, {sql_str(sim['start'])}, "
        f"{pg_numeric_array(sim['rainfall'])}) returning id;"
    )
    result = run_sql(project_ref, token, sql)
    run_id = result[0]["id"]
    print(f"simulation_runs: 1 row (id={run_id})")

    items = list(sim["nodeFill"].items())
    total = 0
    for chunk in batched(items, size=100):
        rows = [
            f"({run_id}, {sql_str(muid)}, {pg_numeric_array(series)})" for muid, series in chunk
        ]
        insert_sql = (
            "insert into simulation_node_fill (run_id, node_muid, fill_series) values "
            + ",".join(rows) + " on conflict (run_id, node_muid) do nothing;"
        )
        run_sql(project_ref, token, insert_sql)
        total += len(chunk)
    print(f"simulation_node_fill: {total} rows")
    return run_id


def import_flood_zones(project_ref, token, run_id):
    fc = load_geojson("flood-zones.geojson")
    for f in fc["features"]:
        p = f["properties"]
        geom = json.dumps(f["geometry"])
        sql = (
            "insert into flood_zones (zone, node_count, geom, run_id, severity) values "
            f"({p['zone']}, {p['nodes']}, ST_SetSRID(ST_GeomFromGeoJSON({sql_str(geom)}), 4326), "
            f"{run_id}, {pg_numeric_array(p['severity'])}) on conflict (zone) do nothing;"
        )
        run_sql(project_ref, token, sql)
    print(f"flood_zones: {len(fc['features'])} rows (run_id={run_id})")


def import_rain_forecast(project_ref, token):
    with open(os.path.join(DATA_DIR, "rain-forecast.json"), encoding="utf-8") as f:
        rf = json.load(f)
    sql = (
        "insert into rain_forecasts (source, latitude, longitude, generated_at, step_hours) values "
        f"({sql_str(rf['source'])}, {rf['latitude']}, {rf['longitude']}, "
        f"{sql_str(rf['generatedAt'])}, {rf['stepHours']}) returning id;"
    )
    result = run_sql(project_ref, token, sql)
    forecast_id = result[0]["id"]

    rows = [
        f"({forecast_id}, {sql_str(t)}, {p})" for t, p in zip(rf["time"], rf["precipitation"])
    ]
    for chunk in batched(rows, size=200):
        insert_sql = (
            "insert into rain_forecast_points (forecast_id, ts, precipitation_mm) values "
            + ",".join(chunk) + " on conflict (forecast_id, ts) do nothing;"
        )
        run_sql(project_ref, token, insert_sql)
    print(f"rain_forecasts: 1 row (id={forecast_id}), rain_forecast_points: {len(rows)} rows")


def import_tide(project_ref, token):
    with open(os.path.join(DATA_DIR, "tide-demo.json"), encoding="utf-8") as f:
        tide = json.load(f)
    sql = (
        "insert into tide_scenarios (note, period_hours, baseline_m, amplitude_m, seed, generated_at) "
        f"values ({sql_str(tide['note'])}, {tide['periodHours']}, {tide['baselineM']}, "
        f"{tide['amplitudeM']}, {tide['seed']}, {sql_str(tide['generatedAt'])}) returning id;"
    )
    result = run_sql(project_ref, token, sql)
    scenario_id = result[0]["id"]

    rows = [f"({scenario_id}, {sql_str(t)}, {lvl})" for t, lvl in zip(tide["time"], tide["levelM"])]
    for chunk in batched(rows, size=200):
        insert_sql = (
            "insert into tide_levels (scenario_id, ts, level_m) values "
            + ",".join(chunk) + " on conflict (scenario_id, ts) do nothing;"
        )
        run_sql(project_ref, token, insert_sql)
    print(f"tide_scenarios: 1 row (id={scenario_id}), tide_levels: {len(rows)} rows")


def reset_monitoring(project_ref, token):
    """Xóa sạch rain_stations + culverts trước khi nạp lại — cần khi danh sách
    trạm/cống đổi tên (on conflict do nothing sẽ giữ nguyên data cũ nếu không xóa
    trước, vì tên mới không trùng khóa với tên cũ nên không "conflict")."""
    run_sql(project_ref, token, "delete from rain_stations; delete from culverts;")
    print("reset: cleared rain_stations + culverts")


def import_rain_stations(project_ref, token):
    with open(os.path.join(DATA_DIR, "rain-stations.json"), encoding="utf-8") as f:
        stations = json.load(f)
    rows = [
        f"({sql_str(s['code'])}, {sql_str(s['name'])}, {sql_num(s.get('elevationM'))}, "
        f"{sql_str(s['status'])}, {sql_num(s.get('batteryPct'))}, {sql_str(s.get('signal'))}, "
        f"{pg_numeric_array(s['rain10min'])}, "
        f"ST_SetSRID(ST_MakePoint({s['lng']}, {s['lat']}), 4326))"
        for s in stations
    ]
    sql = (
        "insert into rain_stations (code, name, elevation_m, status, battery_pct, signal, "
        "rain_10min, geom) values " + ",".join(rows) + " on conflict (code) do nothing;"
    )
    run_sql(project_ref, token, sql)
    print(f"rain_stations: {len(rows)} rows")


def import_culverts(project_ref, token):
    with open(os.path.join(DATA_DIR, "culverts.json"), encoding="utf-8") as f:
        culverts = json.load(f)
    rows = [
        f"({sql_str(c['name'])}, {pg_numeric_array(c['riverSeries'])}, "
        f"{pg_numeric_array(c['insideSeries'])}, {pg_numeric_array(c['gateSeries'])}, "
        f"ST_SetSRID(ST_MakePoint({c['lng']}, {c['lat']}), 4326))"
        for c in culverts
    ]
    sql = (
        "insert into culverts (name, river_series, inside_series, gate_series, geom) values "
        + ",".join(rows) + " on conflict (name) do nothing;"
    )
    run_sql(project_ref, token, sql)
    print(f"culverts: {len(rows)} rows")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project-ref", required=True)
    # `--only monitoring` seeds ONLY the Phase-3 rain_stations + culverts, so you
    # don't re-insert the simulation/flood/rain/tide already on a live project
    # (import_simulation always creates a NEW run — not idempotent).
    ap.add_argument("--only", choices=["monitoring"], default=None)
    ap.add_argument("--reset", action="store_true",
                     help="Xóa rain_stations/culverts trước khi nạp lại (dùng khi đổi danh sách trạm/cống)")
    args = ap.parse_args()
    token = os.environ["SUPABASE_ACCESS_TOKEN"]

    if args.only == "monitoring":
        if args.reset:
            reset_monitoring(args.project_ref, token)
        import_rain_stations(args.project_ref, token)
        import_culverts(args.project_ref, token)
        return

    run_id = import_simulation(args.project_ref, token)
    import_flood_zones(args.project_ref, token, run_id)
    import_rain_forecast(args.project_ref, token)
    import_tide(args.project_ref, token)
    import_rain_stations(args.project_ref, token)
    import_culverts(args.project_ref, token)


if __name__ == "__main__":
    main()

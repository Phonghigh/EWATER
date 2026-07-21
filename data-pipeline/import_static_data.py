"""Import static GIS data (network geometry, SWMM rainfall-runoff layer) into
the live Supabase project via the Management API SQL endpoint.

Two sources:
  - shared/data/*.geojson  (MIKE URBAN export, already WGS84)      -> network_nodes,
    network_links, rivers, drainage_boundary, catchments, province_boundaries
  - the SWMM .inp file (path via --swmm-inp)                        -> raingages,
    subcatchments, transects

Usage:
  SUPABASE_ACCESS_TOKEN=... python import_static_data.py --project-ref <ref> \
      --swmm-inp "C:/Users/22521/Downloads/swmm_open(17_10).inp"
"""
import argparse
import json
import os
import re
import urllib.request

from pyproj import Transformer

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "..", "shared", "data")
UTM48N_TO_WGS84 = Transformer.from_crs("EPSG:32648", "EPSG:4326", always_xy=True)


def run_sql(project_ref, token, query):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
        data=json.dumps({"query": query}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "curl/8.7.1",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"SQL failed ({e.code}): {e.read().decode()[:2000]}\nQuery: {query[:500]}")


def sql_str(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def sql_num(v):
    return "NULL" if v is None else str(v)


def load_geojson(name):
    with open(os.path.join(DATA_DIR, name), encoding="utf-8") as f:
        return json.load(f)


def batched(rows, size=300):
    for i in range(0, len(rows), size):
        yield rows[i : i + size]


# ---------------------------------------------------------------------
# 1. network_nodes (manholes + outlets)
# ---------------------------------------------------------------------

def import_network_nodes(project_ref, token):
    rows = []
    for name, node_type in [("manholes.geojson", "manhole"), ("outlets.geojson", "outlet")]:
        fc = load_geojson(name)
        for f in fc["features"]:
            p = f["properties"]
            geom = json.dumps(f["geometry"])
            rows.append(
                f"({sql_str(p['muid'])}, {sql_str(node_type)}, {sql_num(p.get('invertLevel'))}, "
                f"{sql_num(p.get('groundLevel'))}, {sql_num(p.get('diameter'))}, "
                f"ST_SetSRID(ST_GeomFromGeoJSON({sql_str(geom)}), 4326))"
            )
    total = 0
    for chunk in batched(rows):
        sql = (
            "insert into network_nodes (muid, node_type, invert_level, ground_level, diameter, geom) "
            "values " + ",".join(chunk) + " on conflict (muid) do nothing;"
        )
        run_sql(project_ref, token, sql)
        total += len(chunk)
    print(f"network_nodes: {total} rows")


# ---------------------------------------------------------------------
# 2. network_links
# ---------------------------------------------------------------------

def import_network_links(project_ref, token):
    fc = load_geojson("links.geojson")
    node_ids = set()
    for name in ("manholes.geojson", "outlets.geojson"):
        for f in load_geojson(name)["features"]:
            node_ids.add(str(f["properties"]["muid"]))

    rows = []
    skipped = []
    for f in fc["features"]:
        p = f["properties"]
        from_node, to_node = str(p.get("fromNode")), str(p.get("toNode"))
        if from_node not in node_ids or to_node not in node_ids:
            skipped.append((p["muid"], from_node, to_node))
            continue
        geom = json.dumps(f["geometry"])
        rows.append(
            f"({sql_str(p['muid'])}, {sql_str(from_node)}, {sql_str(to_node)}, "
            f"{sql_num(p.get('upLevel'))}, {sql_num(p.get('downLevel'))}, {sql_num(p.get('length'))}, "
            f"{sql_num(p.get('slope'))}, {sql_num(p.get('diameter'))}, "
            f"ST_SetSRID(ST_GeomFromGeoJSON({sql_str(geom)}), 4326))"
        )
    total = 0
    for chunk in batched(rows):
        sql = (
            "insert into network_links (muid, from_node_muid, to_node_muid, up_level, down_level, "
            "length, slope, diameter, geom) values " + ",".join(chunk) + " on conflict (muid) do nothing;"
        )
        run_sql(project_ref, token, sql)
        total += len(chunk)
    print(f"network_links: {total} rows imported, {len(skipped)} skipped (fromNode/toNode not in network_nodes"
          f" - known source-data gap, see tasks/BLOCKERS.md)")
    for muid, f, t in skipped:
        print(f"  skipped link muid={muid} fromNode={f!r} toNode={t!r}")


# ---------------------------------------------------------------------
# 3. rivers / drainage_boundary / catchments / province_boundaries
# ---------------------------------------------------------------------

def import_rivers(project_ref, token):
    fc = load_geojson("rivers.geojson")
    rows = []
    for f in fc["features"]:
        p = f["properties"]
        geom = json.dumps(f["geometry"])
        rows.append(
            f"({sql_str(p['topoId'])}, {sql_str(p.get('riverName'))}, {sql_num(p.get('length'))}, "
            f"ST_SetSRID(ST_GeomFromGeoJSON({sql_str(geom)}), 4326))"
        )
    sql = (
        "insert into rivers (topo_id, river_name, length, geom) values "
        + ",".join(rows) + " on conflict (topo_id) do nothing;"
    )
    run_sql(project_ref, token, sql)
    print(f"rivers: {len(rows)} rows")


def import_simple_geom_table(project_ref, token, geojson_name, table):
    fc = load_geojson(geojson_name)
    rows = []
    for f in fc["features"]:
        geom = json.dumps(f["geometry"])
        rows.append(f"(ST_SetSRID(ST_GeomFromGeoJSON({sql_str(geom)}), 4326))")
    sql = f"insert into {table} (geom) values " + ",".join(rows) + ";"
    run_sql(project_ref, token, sql)
    print(f"{table}: {len(rows)} rows")


def import_province_boundaries(project_ref, token):
    fc = load_geojson("province-boundary.geojson")
    rows = []
    for f in fc["features"]:
        p = f["properties"]
        geom = json.dumps(f["geometry"])
        rows.append(
            f"({sql_str(p['code'])}, {sql_str(p['name'])}, "
            f"ST_SetSRID(ST_GeomFromGeoJSON({sql_str(geom)}), 4326))"
        )
    sql = (
        "insert into province_boundaries (code, name, geom) values "
        + ",".join(rows) + " on conflict (code) do nothing;"
    )
    run_sql(project_ref, token, sql)
    print(f"province_boundaries: {len(rows)} rows")


# ---------------------------------------------------------------------
# SWMM .inp parsing (RAINGAGES, SUBCATCHMENTS+SUBAREAS+INFILTRATION,
# TRANSECTS, Polygons)
# ---------------------------------------------------------------------

def read_inp_sections(path):
    with open(path, encoding="utf-8") as f:
        lines = [l.rstrip("\n") for l in f]
    sections = {}
    current = None
    for line in lines:
        stripped = line.strip()
        m = re.match(r"^\[(.+)\]$", stripped)
        if m:
            current = m.group(1)
            sections[current] = []
            continue
        if current is None or not stripped or stripped.startswith(";"):
            continue
        sections[current].append(stripped)
    return sections


def import_raingages(project_ref, token, sections):
    rows = []
    for line in sections.get("RAINGAGES", []):
        parts = line.split()
        name, rtype, interval, snow, src_type, src_name = parts[:6]
        rows.append(
            f"({sql_str(name)}, {sql_str(rtype)}, {sql_str(interval)}, {sql_num(snow)}, "
            f"{sql_str(src_type)}, {sql_str(src_name)})"
        )
    sql = (
        "insert into raingages (name, rain_type, time_interval, snow_catch_factor, "
        "data_source_type, data_source_name) values " + ",".join(rows)
        + " on conflict (name) do nothing;"
    )
    run_sql(project_ref, token, sql)
    print(f"raingages: {len(rows)} rows")


def import_subcatchments(project_ref, token, sections):
    subc = {}
    for line in sections.get("SUBCATCHMENTS", []):
        parts = line.split()
        name, raingage, outlet, area, imperv, width, slope = parts[:7]
        curb = parts[7] if len(parts) > 7 else "0"
        subc[name] = {
            "raingage": raingage, "outlet": outlet, "area": area, "imperv": imperv,
            "width": width, "slope": slope, "curb": curb,
        }
    for line in sections.get("SUBAREAS", []):
        parts = line.split()
        name = parts[0]
        if name not in subc:
            continue
        subc[name].update({
            "n_imperv": parts[1], "n_perv": parts[2], "s_imperv": parts[3],
            "s_perv": parts[4], "pct_zero": parts[5], "route_to": parts[6],
        })
    for line in sections.get("INFILTRATION", []):
        parts = line.split()
        name = parts[0]
        if name not in subc:
            continue
        subc[name].update({
            "infil_max": parts[1], "infil_min": parts[2], "infil_decay": parts[3],
            "infil_dry": parts[4], "infil_maxinfil": parts[5],
        })

    # [Polygons] geometry, grouped by subcatchment name, reprojected UTM48N -> WGS84
    poly_points = {}
    for line in sections.get("Polygons", []):
        parts = line.split()
        name, x, y = parts[0], float(parts[1]), float(parts[2])
        lon, lat = UTM48N_TO_WGS84.transform(x, y)
        poly_points.setdefault(name, []).append([round(lon, 6), round(lat, 6)])

    rows = []
    for name, d in subc.items():
        ring = poly_points.get(name)
        geom_sql = "NULL"
        if ring and len(ring) >= 3:
            closed = ring + [ring[0]] if ring[0] != ring[-1] else ring
            geom = json.dumps({"type": "Polygon", "coordinates": [closed]})
            geom_sql = f"ST_SetSRID(ST_GeomFromGeoJSON({sql_str(geom)}), 4326)"
        rows.append(
            f"({sql_str(name)}, {sql_str(d['raingage'])}, {sql_str(d['outlet'])}, "
            f"{sql_num(d['area'])}, {sql_num(d['imperv'])}, {sql_num(d['width'])}, "
            f"{sql_num(d['slope'])}, {sql_num(d.get('curb', 0))}, "
            f"{sql_num(d.get('n_imperv'))}, {sql_num(d.get('n_perv'))}, {sql_num(d.get('s_imperv'))}, "
            f"{sql_num(d.get('s_perv'))}, {sql_num(d.get('pct_zero'))}, {sql_str(d.get('route_to'))}, "
            f"{sql_num(d.get('infil_max'))}, {sql_num(d.get('infil_min'))}, {sql_num(d.get('infil_decay'))}, "
            f"{sql_num(d.get('infil_dry'))}, {sql_num(d.get('infil_maxinfil'))}, {geom_sql})"
        )
    sql = (
        "insert into subcatchments (name, raingage_name, outlet_node_name, area_ha, pct_impervious, "
        "width_m, pct_slope, curb_length, n_imperv, n_perv, s_imperv, s_perv, pct_zero, route_to, "
        "infil_max_rate, infil_min_rate, infil_decay, infil_dry_time, infil_max_infil, geom) values "
        + ",".join(rows) + " on conflict (name) do nothing;"
    )
    run_sql(project_ref, token, sql)
    print(f"subcatchments: {len(rows)} rows")


def import_transects(project_ref, token, sections):
    lines = sections.get("TRANSECTS", [])
    transects = []
    cur = None
    for line in lines:
        tag = line.split()[0]
        if tag == "NC":
            parts = line.split()
            cur = {"nc": parts[1:4], "points": []}
        elif tag == "X1":
            parts = line.split()
            cur["name"] = parts[1]
            transects.append(cur)
        elif tag == "GR":
            vals = [float(v) for v in line.split()[1:]]
            for i in range(0, len(vals) - 1, 2):
                # GR pairs are (elevation, station)
                cur["points"].append([vals[i + 1], vals[i]])
    rows = []
    for t in transects:
        pts = json.dumps(t["points"])
        rows.append(
            f"({sql_str(t['name'])}, {sql_num(t['nc'][0])}, {sql_num(t['nc'][1])}, {sql_num(t['nc'][2])}, "
            f"{sql_str(pts)}::jsonb)"
        )
    sql = (
        "insert into transects (name, roughness_left, roughness_right, roughness_channel, station_points) "
        "values " + ",".join(rows) + " on conflict (name) do nothing;"
    )
    run_sql(project_ref, token, sql)
    print(f"transects: {len(rows)} rows")


def import_swmm_conduits(project_ref, token, sections):
    conduits = {}
    for line in sections.get("CONDUITS", []):
        parts = line.split()
        name, from_n, to_n, length, manning, in_off, out_off, init_flow, max_flow = parts[:9]
        conduits[name] = {
            "from": from_n, "to": to_n, "length": length, "manning": manning,
            "in_off": None if in_off == "*" else in_off,
            "out_off": None if out_off == "*" else out_off,
            "init_flow": init_flow, "max_flow": max_flow,
        }
    for line in sections.get("XSECTIONS", []):
        parts = line.split()
        name, shape, geom1, geom2, geom3, geom4, barrels = parts[:7]
        if name not in conduits:
            continue
        conduits[name]["shape"] = shape
        if shape == "IRREGULAR":
            conduits[name]["diameter"] = None
            conduits[name]["transect_name"] = geom1
        else:
            conduits[name]["diameter"] = geom1
            conduits[name]["transect_name"] = None
        conduits[name]["barrels"] = barrels
    for line in sections.get("LOSSES", []):
        parts = line.split()
        name, inlet_loss, outlet_loss, avg_loss, flap = parts[:5]
        if name not in conduits:
            continue
        conduits[name].update({
            "inlet_loss": inlet_loss, "outlet_loss": outlet_loss,
            "avg_loss": avg_loss, "flap_gate": "true" if flap == "YES" else "false",
        })

    rows = []
    for name, d in conduits.items():
        rows.append(
            f"({sql_str(name)}, {sql_str(d['from'])}, {sql_str(d['to'])}, {sql_num(d['length'])}, "
            f"{sql_num(d['manning'])}, {sql_num(d['in_off'])}, {sql_num(d['out_off'])}, "
            f"{sql_num(d['init_flow'])}, {sql_num(d['max_flow'])}, {sql_str(d.get('shape'))}, "
            f"{sql_num(d.get('diameter'))}, {sql_str(d.get('transect_name'))}, "
            f"{sql_num(d.get('barrels', 1))}, {sql_num(d.get('inlet_loss'))}, "
            f"{sql_num(d.get('outlet_loss'))}, {sql_num(d.get('avg_loss'))}, "
            f"{d.get('flap_gate', 'false')})"
        )
    sql = (
        "insert into swmm_conduits (name, from_node_name, to_node_name, length, manning_n, "
        "inlet_offset, outlet_offset, init_flow, max_flow, shape, diameter, transect_name, barrels, "
        "inlet_loss, outlet_loss, avg_loss, flap_gate) values " + ",".join(rows)
        + " on conflict (name) do nothing;"
    )
    run_sql(project_ref, token, sql)
    print(f"swmm_conduits: {len(rows)} rows")


def import_swmm_outfalls(project_ref, token, sections):
    rows = []
    for line in sections.get("OUTFALLS", []):
        parts = line.split()
        name, invert, outfall_type = parts[0], parts[1], parts[2]
        stage_source = parts[3] if len(parts) > 3 and parts[3] != "*" else None
        tide_gate = len(parts) > 4 and parts[4] == "YES"
        rows.append(
            f"({sql_str(name)}, {sql_num(invert)}, {sql_str(outfall_type)}, "
            f"{sql_str(stage_source)}, {'true' if tide_gate else 'false'})"
        )
    sql = (
        "insert into swmm_outfalls (node_name, invert_elev, outfall_type, stage_source, tide_gate) "
        "values " + ",".join(rows) + " on conflict (node_name) do nothing;"
    )
    run_sql(project_ref, token, sql)
    print(f"swmm_outfalls: {len(rows)} rows")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project-ref", required=True)
    ap.add_argument("--swmm-inp", required=True)
    args = ap.parse_args()
    token = os.environ["SUPABASE_ACCESS_TOKEN"]

    import_network_nodes(args.project_ref, token)
    import_network_links(args.project_ref, token)
    import_rivers(args.project_ref, token)
    import_simple_geom_table(args.project_ref, token, "boundary.geojson", "drainage_boundary")
    import_simple_geom_table(args.project_ref, token, "catchment.geojson", "catchments")
    import_province_boundaries(args.project_ref, token)

    sections = read_inp_sections(args.swmm_inp)
    import_raingages(args.project_ref, token, sections)
    import_subcatchments(args.project_ref, token, sections)
    import_transects(args.project_ref, token, sections)
    import_swmm_conduits(args.project_ref, token, sections)
    import_swmm_outfalls(args.project_ref, token, sections)


if __name__ == "__main__":
    main()

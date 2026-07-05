"""Generate synthetic 24 h storm simulation results for the demo.

Usage: python generate_mock_sim.py   (run after convert_shp.py)

Outputs (../shared/data/):
  simulation.json
    { "stepMinutes": 15, "steps": 97, "start": "00:00",
      "rainfall": [mm/h per step],
      "nodeFill": { manholeMuid: [fill fraction per step] } }
    fill = (waterLevel - invert) / (ground - invert); values > 1 mean surcharged.
    Pipe fill is derived in the apps as the mean of its end-node fills.
  flood-zones.geojson
    Polygons with properties { "zone": n, "severity": [0..1 per step] }.

Everything is deterministic (seeded RNG) and derived from the real
invert/ground elevations, but it is DEMO DATA, not model output.
"""
import json
import math
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "shared", "data")

STEPS = 97          # 24 h at 15 min
STEP_MIN = 15
PEAK_HOUR = 7.5     # storm peak
SURCHARGE_SHARE = 0.15


def rainfall_series():
    """Gamma-shaped hyetograph, peak ~55 mm/h."""
    rain = []
    for i in range(STEPS):
        t = i * STEP_MIN / 60.0
        x = max(t - 2.0, 0.0)          # rain starts at 02:00
        v = (x ** 2.2) * math.exp(-x / 1.9)
        rain.append(v)
    peak = max(rain)
    return [round(55.0 * v / peak, 2) for v in rain]


def response_series(rain, lag_steps, decay):
    """Catchment response: lagged rain convolved with exponential recession, normalized 0..1."""
    resp, state = [], 0.0
    for i in range(STEPS):
        inflow = rain[i - lag_steps] if i >= lag_steps else 0.0
        state = state * decay + inflow * (1 - decay)
        resp.append(state)
    m = max(resp) or 1.0
    return [v / m for v in resp]


def main():
    rng = random.Random(42)
    with open(os.path.join(DATA, "manholes.geojson"), encoding="utf-8") as f:
        manholes = json.load(f)["features"]

    rain = rainfall_series()

    node_fill = {}
    peaks = {}
    for feat in manholes:
        p = feat["properties"]
        muid = str(p["muid"])
        lag = rng.randint(1, 6)                    # 15–90 min lag
        decay = rng.uniform(0.90, 0.97)
        resp = response_series(rain, lag, decay)
        # scale so ~SURCHARGE_SHARE of nodes exceed ground level at peak
        if rng.random() < SURCHARGE_SHARE:
            factor = rng.uniform(1.02, 1.20)
        else:
            factor = rng.uniform(0.35, 0.98)
        series = [round(min(v * factor, 1.35), 3) for v in resp]
        node_fill[muid] = series
        peaks[muid] = max(series)

    sim = {"stepMinutes": STEP_MIN, "steps": STEPS, "start": "00:00",
           "rainfall": rain, "nodeFill": node_fill}
    out = os.path.join(DATA, "simulation.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(sim, f, separators=(",", ":"))
    print(f"simulation: {len(node_fill)} nodes x {STEPS} steps -> {out} "
          f"({os.path.getsize(out)//1024} KB)")

    build_flood_zones(manholes, node_fill)


# ---------------------------------------------------------------- flood zones

def convex_hull(pts):
    """Monotone chain convex hull."""
    pts = sorted(set(pts))
    if len(pts) <= 2:
        return list(pts)

    def cross(o, a, b):
        return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])

    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def expand(hull, meters=180.0):
    """Push hull vertices outward from the centroid (cheap buffer)."""
    cx = sum(p[0] for p in hull) / len(hull)
    cy = sum(p[1] for p in hull) / len(hull)
    deg_lon = meters / (111320.0 * math.cos(math.radians(cy)))
    deg_lat = meters / 110540.0
    out = []
    for x, y in hull:
        dx, dy = x - cx, y - cy
        norm = math.hypot(dx, dy) or 1.0
        out.append([round(x + dx / norm * deg_lon, 6),
                    round(y + dy / norm * deg_lat, 6)])
    out.append(out[0])
    return out


def build_flood_zones(manholes, node_fill):
    coords = {str(f["properties"]["muid"]): f["geometry"]["coordinates"]
              for f in manholes}
    flooded = [m for m, s in node_fill.items() if max(s) > 1.0]

    # cluster on a ~500 m grid, merge singletons into nothing
    cell = 0.005
    clusters = {}
    for m in flooded:
        x, y = coords[m]
        clusters.setdefault((round(x / cell), round(y / cell)), []).append(m)

    # merge adjacent cells
    merged = []
    used = set()
    keys = list(clusters)
    for k in keys:
        if k in used:
            continue
        group, stack = [], [k]
        while stack:
            c = stack.pop()
            if c in used:
                continue
            used.add(c)
            group.extend(clusters[c])
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    n = (c[0]+dx, c[1]+dy)
                    if n in clusters and n not in used:
                        stack.append(n)
        if len(group) >= 3:
            merged.append(group)

    features = []
    for i, group in enumerate(merged):
        pts = [tuple(coords[m]) for m in group]
        hull = convex_hull(pts)
        if len(hull) < 3:
            continue
        ring = expand(hull)
        severity = []
        for t in range(STEPS):
            vals = [max(0.0, min((node_fill[m][t] - 0.9) / 0.35, 1.0))
                    for m in group]
            severity.append(round(sum(vals) / len(vals), 3))
        features.append({
            "type": "Feature",
            "properties": {"zone": i + 1, "nodes": len(group),
                           "severity": severity},
            "geometry": {"type": "Polygon", "coordinates": [ring]},
        })

    out = os.path.join(DATA, "flood-zones.geojson")
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f,
                  separators=(",", ":"))
    print(f"flood zones: {len(features)} zones from {len(flooded)} "
          f"surcharged manholes -> {out}")


if __name__ == "__main__":
    main()

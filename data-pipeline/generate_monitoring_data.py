"""Generate synthetic real-time monitoring data for Phase 3 (Quan trắc).

Usage: python generate_monitoring_data.py

Outputs (../shared/data/):
  rain-stations.json
    [{ "code", "name", "lng", "lat", "elevationM", "status", "batteryPct",
       "signal", "rain10min": [mm per 10-min step] }]   # length = STEPS
  culverts.json
    [{ "name", "lng", "lat", "riverSeries": [m], "insideSeries": [m],
       "gateSeries": [1|0] }]                            # 1 = mở (open), 0 = đóng

Everything is deterministic (seeded RNG). There are NO real rain gauges / culvert
telemetry in the source data — this is DEMO DATA in the same spirit as
generate_mock_sim.py, just persisted to Supabase (see 20260724120000_monitoring_stations.sql).

Time base: STEPS steps of STEP_MIN minutes over 24h, origin 00:00 — identical index
convention to simulation.json so the web app can anchor "now" via useCurrentSimStep.
"""
import json
import math
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "shared", "data")

STEP_MIN = 10
STEPS = 144          # 24 h at 10 min
SEED = 42

# 3 trạm mưa quan trắc. total24h = mục tiêu tổng lượng mưa 24h (mm), khác nhau để
# xếp hạng có ý nghĩa; toạ độ nằm trong map bounds [[105.939, 10.213], [106.05, 10.262]].
STATIONS = [
    # code,      name,             lng,      lat,     elev, total24h
    ("VLM_01", "Trạm Mỹ Thuận",  105.9500, 10.2545, 1.85, 78.6),
    ("VLM_02", "Trạm 1",         105.9787, 10.2415, 1.60, 65.3),
    ("VLM_03", "Trạm 2",         106.0100, 10.2300, 1.30, 51.0),
]

# 8 cống có cửa van, đặt gần các trục sông/kênh trong bounds.
CULVERTS = [
    # name,          lng,      lat
    ("Ngã Cậy",     105.9600, 10.2480),
    ("Cà Dâm",      105.9700, 10.2350),
    ("Ông Thẩm",    105.9850, 10.2450),
    ("Tân Hữu",     105.9710, 10.2310),
    ("Kinh Cụt",    105.9680, 10.2380),
    ("Cầu Lầu",     105.9760, 10.2500),
    ("Cầu Kè",      106.0200, 10.2450),
    ("Long Thạnh",  105.9950, 10.2560),
]


def hyetograph(total24h, peak_hour, rng):
    """Gamma-shaped 10-min rain series (mm per step) normalised to sum == total24h."""
    shape = []
    for i in range(STEPS):
        t = i * STEP_MIN / 60.0
        x = max(t - (peak_hour - 5.5), 0.0)   # mưa bắt đầu ~5.5h trước đỉnh
        v = (x ** 2.2) * math.exp(-x / 1.9)
        v *= rng.uniform(0.85, 1.15)          # nhiễu 10-phút để đường diễn biến gồ ghề
        shape.append(max(v, 0.0))
    s = sum(shape) or 1.0
    return [round(total24h * v / s, 2) for v in shape]


def tide_series(baseline, amplitude, phase, rng):
    """Mực nước ngoài sông (m): triều bán nhật + nhiễu nhỏ."""
    out = []
    for i in range(STEPS):
        t = i * STEP_MIN / 60.0
        v = baseline + amplitude * math.sin(2 * math.pi * (t / 12.42) + phase)
        v += rng.uniform(-0.03, 0.03)
        out.append(round(v, 3))
    return out


def response_series(rain, lag_steps, decay):
    """Đáp ứng bể chứa tuyến tính của mực nước trong cống theo mưa (0..1)."""
    resp, state = [], 0.0
    for i in range(STEPS):
        inflow = rain[i - lag_steps] if i >= lag_steps else 0.0
        state = state * decay + inflow * (1 - decay)
        resp.append(state)
    m = max(resp) or 1.0
    return [v / m for v in resp]


def main():
    rng = random.Random(SEED)

    # ---- rain stations ----
    stations = []
    area_rain = None
    for code, name, lng, lat, elev, total in STATIONS:
        peak_hour = rng.uniform(6.5, 9.0)
        rain = hyetograph(total, peak_hour, rng)
        if area_rain is None:
            area_rain = rain
        battery = rng.randint(72, 99)
        signal = rng.choice(["good", "good", "good", "fair", "weak"])
        status = "online" if rng.random() > 0.05 else "offline"
        stations.append({
            "code": code, "name": name, "lng": lng, "lat": lat,
            "elevationM": elev, "status": status, "batteryPct": battery,
            "signal": signal, "rain10min": rain,
        })

    out = os.path.join(DATA, "rain-stations.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(stations, f, ensure_ascii=False, separators=(",", ":"))
    print(f"rain-stations: {len(stations)} stations x {STEPS} steps -> {out}")

    # ---- culverts ----
    culverts = []
    for name, lng, lat in CULVERTS:
        river = tide_series(rng.uniform(0.9, 1.2), rng.uniform(0.35, 0.6),
                            rng.uniform(0, 2 * math.pi), rng)
        # trong cống = mực nền + đáp ứng mưa khu vực, thấp hơn sông khi triều cao
        base_in = rng.uniform(0.3, 0.5)
        resp = response_series(area_rain, rng.randint(2, 8), rng.uniform(0.90, 0.96))
        inside = [round(base_in + 0.9 * r + rng.uniform(-0.02, 0.02), 3) for r in resp]
        # cửa van: đóng (0) khi mực sông cao hơn trong cống + biên (chống xâm nhập),
        # mở (1) khi tiêu thoát được ra sông.
        gate = [0 if river[i] > inside[i] + 0.15 else 1 for i in range(STEPS)]
        culverts.append({
            "name": name, "lng": lng, "lat": lat,
            "riverSeries": river, "insideSeries": inside, "gateSeries": gate,
        })

    out = os.path.join(DATA, "culverts.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(culverts, f, ensure_ascii=False, separators=(",", ":"))
    print(f"culverts: {len(culverts)} culverts x {STEPS} steps -> {out}")


if __name__ == "__main__":
    main()

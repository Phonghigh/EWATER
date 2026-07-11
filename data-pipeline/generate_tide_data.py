"""Generate a synthetic semi-diurnal tide curve for the demo.

Usage: python generate_tide_data.py   (run after crawl_rain_data.py)

Output (../shared/data/):
  tide-demo.json
    { "note": "...", "periodHours": 12.4167, "baselineM": .., "amplitudeM": ..,
      "seed": 42, "generatedAt": "<ISO8601>",
      "time": [...same as rain-forecast.json...], "levelM": [meters, ...] }

Vĩnh Long has no real tide gauge — it sits ~80-100 km inland on a Mekong
tributary, well outside the coverage of any free tide/marine API. This
script instead generates a deterministic (seeded RNG), semi-diurnal
(~12h25m period) sine curve as a stand-in, with a deliberately modest
amplitude: real tidal range at the coast is on the order of 1-2 m, but
tidal energy attenuates heavily travelling this far upriver through the
delta's channel network, so this demo curve uses a much smaller swing.
This is DEMO DATA, not a real gauge reading.
"""
import json
import math
import os
import random
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "shared", "data")

PERIOD_HOURS = 12.0 + 25 / 60  # semi-diurnal, ~12h25m
BASELINE_M = 1.2
AMPLITUDE_M = 0.2
JITTER_M = 0.02
SEED = 42


def main():
    with open(os.path.join(DATA, "rain-forecast.json"), encoding="utf-8") as f:
        rain = json.load(f)
    time = rain["time"]

    rng = random.Random(SEED)
    phase = rng.uniform(0, 2 * math.pi)

    start = datetime.fromisoformat(time[0])
    level = []
    for t in time:
        h = (datetime.fromisoformat(t) - start).total_seconds() / 3600.0
        v = BASELINE_M + AMPLITUDE_M * math.sin(2 * math.pi * h / PERIOD_HOURS + phase)
        v += rng.uniform(-JITTER_M, JITTER_M)
        level.append(round(v, 3))

    out = {
        "note": "DEMO DATA — synthetic semi-diurnal tide, not a real gauge "
                "reading (no tide station exists this far up the Mekong "
                "tributary system).",
        "periodHours": round(PERIOD_HOURS, 4),
        "baselineM": BASELINE_M,
        "amplitudeM": AMPLITUDE_M,
        "seed": SEED,
        "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "time": time,
        "levelM": level,
    }
    out_path = os.path.join(DATA, "tide-demo.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"tide demo: {len(level)} hourly points -> {out_path} "
          f"({os.path.getsize(out_path)} bytes)")


if __name__ == "__main__":
    main()

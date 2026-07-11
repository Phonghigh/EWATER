"""Fetch a real hourly rainfall forecast for Vĩnh Long from Open-Meteo.

Usage: python crawl_rain_data.py

Output (../shared/data/):
    rain-forecast.json
    { "source": "open-meteo.com", "latitude": .., "longitude": ..,
        "generatedAt": "<ISO8601>", "stepHours": 1,
        "time": ["2026-07-10T00:00", ...], "precipitation": [mm/h, ...] }
    Covers today through 2 days ahead. This is real, live forecast data
    (unlike the rest of shared/data/, which is static/synthetic demo data).
"""
import json
import os
from datetime import datetime, timedelta

import requests

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "shared", "data")

# Vĩnh Long city center (see shared/config/map-style.json "center")
LAT, LON = 10.2415, 105.9787

FORECAST_DAYS = 3  # today + 2 days ahead


def main():
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={LAT}&longitude={LON}"
        "&hourly=precipitation&timezone=auto"
    )
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    data = response.json()

    hourly_time = data["hourly"]["time"]
    hourly_precip = data["hourly"]["precipitation"]

    today = datetime.now().date()
    cutoff = today + timedelta(days=FORECAST_DAYS - 1)
    time, precipitation = [], []
    for t, p in zip(hourly_time, hourly_precip):
        if datetime.fromisoformat(t).date() <= cutoff:
            time.append(t)
            precipitation.append(p)

    out = {
        "source": "open-meteo.com",
        "latitude": LAT,
        "longitude": LON,
        "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "stepHours": 1,
        "time": time,
        "precipitation": precipitation,
    }
    out_path = os.path.join(DATA, "rain-forecast.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"rain forecast: {len(time)} hourly points -> {out_path} "
        f"({os.path.getsize(out_path)} bytes)")


if __name__ == "__main__":
    main()

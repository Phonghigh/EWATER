# P1-05 — Card "Dự báo thời tiết"

**Date:** 2026-07-22 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Added a weather-forecast card to the Dashboard built entirely from the real
`data.rainForecast` series (hourly strip + 3h/6h/12h/24h rain totals +
rainy-hour count) — no invented temperatures or fake probability figures.

## 2. Where it fits
- Phase 1 (Dashboard, Tab 1) in [tasks/INDEX.md](../../tasks/INDEX.md),
  right after the flood-map preview (P1-03; P1-04 was cancelled).
- Sits next to `FloodMapPreview` in a new two-column row on the Dashboard.

## 3. The problem
The mockup's weather panel shows a per-hour temperature strip (26°C, 27°C,
...) and an "Xác suất mưa lớn: 85%" probability figure. Neither has any real
data source in this project: `RainForecast` (`web/src/types.ts`) only has
`time`, `precipitation`, and `stepHours` — no temperature field, no
probability field, anywhere in Supabase. Every prior Phase 1 task
(P1-01/P1-02/P1-03) held a hard line against inventing numbers the source
data doesn't have, so this task had to find a version of "weather forecast
card" that's honest about what's real (rainfall) vs. what would have to be
fabricated (temperature, probability) — and drop the fabricated parts rather
than fake them.

## 4. Concepts introduced

### Treating a static demo series as self-referential, not wall-clock-aligned
- **Plain definition:** `shared/data/rain-forecast.json` is a fixed 72-hour
  snapshot generated on a specific date (2026-07-10) — its timestamps don't
  correspond to whatever the real "now" is when someone opens the app.
- **Why it shows up here:** the natural instinct is to find "the current
  hour" in the array and center the display there — but there is no current
  hour in this data relative to real time. The fix (documented in the
  phase-1 spec) is the same move P1-02 already made for the simulation step:
  treat index `0` (`generatedAt`) as the series' own reference point and
  slice forward from there, rather than trying to align a static demo
  snapshot to a live clock it was never designed to track.

### Replacing a fabricated metric with a real derived one
- **Plain definition:** instead of inventing "85% xác suất mưa lớn," count
  how many of the next 24 real hourly values are `> 0` and show that count
  directly ("N/24 giờ có mưa"). It's a smaller, less flashy number, but every
  digit in it is traceable to a real value in the source array.
- **Why it shows up here:** this is the same "derive from real data, don't
  approximate what isn't there" discipline as `dashboardService`'s
  deterministic pump/gate split (P1-01) — a real (if less impressive)
  computed fact beats a plausible-looking invented one.

## 5. How it was approached
- Rain-intensity labels (`Không mưa`/`Mưa nhỏ`/`Mưa vừa`/`Mưa to`) are a
  fixed-threshold function of the real `precipitation` value at each hour —
  deterministic, not random, matching P1-01's mock-vs-random-mock precedent.
- Considered keeping a static mock temperature chip (TopBar already has one,
  documented as mock) to visually match the mockup more closely — rejected
  for this card specifically: TopBar's single flat 26°C is a page-chrome
  decoration, but a *per-hour* fake temperature strip would look like real
  data at a glance, which is a much easier mistake for a future reader to
  copy elsewhere. Left temperature off entirely instead.
- Reused the existing `cloud-rain` icon for every hourly slot rather than
  adding a per-condition icon set (sunny/cloudy/rainy) — there's no real
  "sky condition" field to justify different icons, only a rain-amount
  number, so one consistent icon keeps the card honest about what it
  actually knows.

## 6. Where it got stuck (if anywhere)
No real snags. Verified the card's math against the raw JSON with a
throwaway Python check before trusting the component: 3h/6h/12h sums are all
`0.0mm` and 24h is `2.3mm` for this particular demo window (the storm in this
dataset happens later in the 72h series, outside the first 24 hours) — that
asymmetry is a property of the real data, not a bug in the windowing logic.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs   # run from repo root
cd web && npm run build
cd web && npm run dev         # visit /, check the hourly strip + 4 rain
                               # windows + "N/24 giờ có mưa" line
```
Cross-check the numbers directly against source data:
```bash
python3 -c "
import json
d=json.load(open('shared/data/rain-forecast.json'))
p=d['precipitation']
for h in [3,6,12,24]: print(h,'h:', round(sum(p[:h]),1),'mm')
print('rainy/24:', sum(1 for v in p[:24] if v>0))
"
```
Expected: `tsc`/`check-i18n`/`build` clean; card numbers match the Python
cross-check exactly (verified while building this task: 3h/6h/12h = 0.0mm,
24h = 2.3mm, 4/24 rainy hours).

## 8. Gotchas / things to remember
- Don't add a fake temperature or probability field to this card later to
  "match the mockup more" — there is still no real source for either; if one
  gets added to Supabase in a future phase, wire it in for real instead.
- The hourly strip always starts at index `0` of `rainForecast.time`, not at
  "the current hour" — there is no live-time alignment for this dataset (see
  §4). If a later phase adds a live weather API, this placeholder should be
  replaced the same way `step = simulation.steps - 1` is flagged for
  replacement once P2-01 lands.

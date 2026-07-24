// Dẫn xuất số liệu quan trắc (Phase 3) từ RainStation[] / Culvert[] đã nạp sẵn.
// KHÔNG truy vấn thêm — thuần tính toán trên mảng đã có trong AppData, giống
// dashboardService.ts. Chuỗi số liệu là bước 10 phút, 144 bước, gốc 00:00
// (xem generate_monitoring_data.py + 20260724120000_monitoring_stations.sql).
//
// "Hiện tại" (bước hiện thời) được neo theo đồng hồ thực trong ngày, đúng quy
// ước "no live now" của cả app: dữ liệu chỉ trải đúng 1 ngày nên giờ:phút thực
// hôm nay luôn rơi vào 1 bước đã có số liệu.

import type { Culvert, RainStation } from "../types";

export const MON_STEP_MIN = 10;
export const MON_STEPS = 144; // 24h @ 10 phút

/** Nhãn giờ (HH:MM) cho bước thứ `step` tính từ 00:00. */
export function monStepLabel(step: number): string {
  const total = step * MON_STEP_MIN;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Bước 10 phút ứng với giờ thực hiện tại (0..143). `now` tiêm được để test. */
export function currentMonitoringStep(now: Date = new Date()): number {
  const idx = Math.floor((now.getHours() * 60 + now.getMinutes()) / MON_STEP_MIN);
  return Math.max(0, Math.min(MON_STEPS - 1, idx));
}

/** Tổng mưa (mm) của `k` bước gần nhất kết thúc tại `step`, cuộn vòng qua đầu
 *  ngày (dữ liệu chỉ 1 ngày nên "24h trước" quay lại chính chuỗi đó). */
export function rainWindowSum(series: number[], step: number, k: number): number {
  if (series.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < k; i++) {
    const idx = (((step - i) % series.length) + series.length) % series.length;
    sum += series[idx] ?? 0;
  }
  return sum;
}

const STEPS_1H = 6;
const STEPS_3H = 18;
const STEPS_6H = 36;
const STEPS_24H = 144;

export type TrendDir = "up" | "down" | "flat";

/** Ngưỡng coi 2 cửa sổ 1h là "không đổi" (mm). Dưới mức này → dấu "−" thay vì
 *  mũi tên, tránh nhiễu khi mưa dao động li ti (đồng bộ quy ước GIS "Ổn định"). */
const TREND_FLAT_MM = 0.3;

/** So sánh cửa sổ 1h hiện tại với 1h ngay trước đó để suy ra xu hướng mưa. */
function rain1hTrend(series: number[], step: number): TrendDir {
  const now = rainWindowSum(series, step, STEPS_1H);
  const prev = rainWindowSum(series, step - STEPS_1H, STEPS_1H);
  const diff = now - prev;
  if (Math.abs(diff) <= TREND_FLAT_MM) return "flat";
  return diff > 0 ? "up" : "down";
}

export interface RainTableRow {
  code: string;
  name: string;
  status: string;
  r10min: number;
  r1h: number;
  r3h: number;
  r6h: number;
  r24h: number;
  trend: TrendDir;
}

/** Một dòng bảng "số liệu mưa thực đo" mỗi trạm tại bước hiện tại. */
export function rainTableRows(stations: RainStation[], step: number): RainTableRow[] {
  return stations.map((s) => ({
    code: s.code,
    name: s.name,
    status: s.status,
    r10min: round1(s.rain10min[step] ?? 0),
    r1h: round1(rainWindowSum(s.rain10min, step, STEPS_1H)),
    r3h: round1(rainWindowSum(s.rain10min, step, STEPS_3H)),
    r6h: round1(rainWindowSum(s.rain10min, step, STEPS_6H)),
    r24h: round1(rainWindowSum(s.rain10min, step, STEPS_24H)),
    trend: rain1hTrend(s.rain10min, step),
  }));
}

/** Ngưỡng mưa 24h (mm) coi là "rất lớn" cho Situation Banner — trùng bucket
 *  ">100" trong RAIN_BUCKETS (đỏ). */
export const HEAVY_RAIN_24H_MM = 100;

export interface MonSituation {
  level: "ok" | "alert";
  heavyRain: RainTableRow[]; // 24h >= HEAVY_RAIN_24H_MM
  offline: RainTableRow[]; // status !== 'online'
  onlineCount: number;
  totalCount: number;
  maxRain: { name: string; mm: number } | null; // trạm mưa 24h lớn nhất
  worst: RainTableRow | null; // điểm "Xem ngay" nhảy tới (mưa nặng nhất, else offline đầu)
}

/** Tổng hợp "tình huống" của trang quan trắc cho banner (exception-driven UI):
 *  có mưa rất lớn hoặc trạm mất kết nối thì cảnh báo, ngược lại là bình thường.
 *  Thuần tính toán trên các dòng bảng đã dựng — không truy vấn thêm. */
export function monSituation(rows: RainTableRow[]): MonSituation {
  const heavyRain = rows.filter((r) => r.r24h >= HEAVY_RAIN_24H_MM).sort((a, b) => b.r24h - a.r24h);
  const offline = rows.filter((r) => r.status !== "online");
  const onlineCount = rows.length - offline.length;
  const maxRain = rows.reduce<{ name: string; mm: number } | null>(
    (best, r) => (best && best.mm >= r.r24h ? best : { name: r.name, mm: r.r24h }),
    null,
  );
  const worst = heavyRain[0] ?? offline[0] ?? null;
  return {
    level: heavyRain.length > 0 || offline.length > 0 ? "alert" : "ok",
    heavyRain,
    offline,
    onlineCount,
    totalCount: rows.length,
    maxRain,
    worst,
  };
}

/** Lượng mưa 24h hiện tại theo trạm (dùng tô màu marker bản đồ). */
export function rain24hByStation(stations: RainStation[], step: number): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of stations) m.set(s.code, round1(rainWindowSum(s.rain10min, step, STEPS_24H)));
  return m;
}

export interface TopRainItem {
  name: string;
  mm: number;
}

/** Top-N trạm theo tổng mưa 24h, giảm dần. */
export function topRainStations(stations: RainStation[], step: number, n = 10): TopRainItem[] {
  return stations
    .map((s) => ({ name: s.name, mm: round1(rainWindowSum(s.rain10min, step, STEPS_24H)) }))
    .sort((a, b) => b.mm - a.mm)
    .slice(0, n);
}

/** Nhãn 8 khung giờ 3 tiếng: 00-03 … 21-24. */
export const HOUR_BUCKETS = ["00-03", "03-06", "06-09", "09-12", "12-15", "15-18", "18-21", "21-24"];
const STEPS_PER_BUCKET = (3 * 60) / MON_STEP_MIN; // 18 bước / khung 3h

/** Tổng mưa theo khung giờ trong ngày cho 1 trạm (mm mỗi khung). */
function bucketTotals(series: number[]): number[] {
  return HOUR_BUCKETS.map((_, b) => {
    let sum = 0;
    for (let i = 0; i < STEPS_PER_BUCKET; i++) sum += series[b * STEPS_PER_BUCKET + i] ?? 0;
    return round1(sum);
  });
}

export interface DistributionSeries {
  key: string; // 'total' | station.code
  name: string;
  values: number[]; // theo HOUR_BUCKETS
}

/** Phân bố mưa theo khung giờ: "Tổng" = trung bình các trạm (cùng thang mm với
 *  từng trạm), kèm tối đa 3 trạm đại diện gộp chung 1 biểu đồ. */
export function hourlyDistribution(stations: RainStation[], featured: RainStation[]): DistributionSeries[] {
  const perStation = stations.map((s) => bucketTotals(s.rain10min));
  const total = HOUR_BUCKETS.map((_, b) => {
    const vals = perStation.map((v) => v[b]);
    return vals.length ? round1(vals.reduce((a, c) => a + c, 0) / vals.length) : 0;
  });
  return [
    { key: "total", name: "", values: total }, // name điền bằng i18n ở component
    ...featured.map((s) => ({ key: s.code, name: s.name, values: bucketTotals(s.rain10min) })),
  ];
}

export type RainGranularity = "min10" | "hour" | "day";

export interface RainTrendPoint {
  label: string;
  [stationName: string]: number | string;
}

/** Dữ liệu biểu đồ diễn biến mưa: tối đa 6 mốc tính từ hiện tại, mỗi mốc là
 *  tổng mưa của 1 cửa sổ tuỳ độ phân giải (10 phút / giờ / 4 giờ). Dữ liệu chỉ
 *  trải 24h nên "ngày" hiển thị 6 khối 4 giờ trong ngày thay vì 6 ngày. */
export function rainTrend(
  selected: RainStation[],
  granularity: RainGranularity,
  step: number,
): { data: RainTrendPoint[]; stationNames: string[] } {
  const windowSteps = granularity === "min10" ? 1 : granularity === "hour" ? 6 : 24;
  const marks = 6;
  const stationNames = selected.map((s) => s.name);

  const data: RainTrendPoint[] = [];
  for (let m = marks - 1; m >= 0; m--) {
    const endStep = step - m * windowSteps;
    const point: RainTrendPoint = { label: monStepLabel(((endStep % MON_STEPS) + MON_STEPS) % MON_STEPS) };
    for (const s of selected) {
      point[s.name] = round1(rainWindowSum(s.rain10min, ((endStep % MON_STEPS) + MON_STEPS) % MON_STEPS, windowSteps));
    }
    data.push(point);
  }
  return { data, stationNames };
}

export interface CulvertRow {
  id: number;
  name: string;
  riverLevelM: number; // ngoài sông
  insideLevelM: number; // trong cống
  gateOpen: boolean; // true = mở, false = đóng
}

/** Một dòng bảng mực nước theo cống tại bước hiện tại. */
export function culvertRows(culverts: Culvert[], step: number): CulvertRow[] {
  return culverts.map((c) => ({
    id: c.id,
    name: c.name,
    riverLevelM: round2(c.riverSeries[step] ?? 0),
    insideLevelM: round2(c.insideSeries[step] ?? 0),
    gateOpen: (c.gateSeries[step] ?? 0) >= 0.5,
  }));
}

/** Thang màu lượng mưa 24h (mm) theo chú giải mockup — dùng chung cho marker
 *  bản đồ và legend. `min` là ngưỡng dưới (>=), duyệt từ nặng đến nhẹ. */
export const RAIN_BUCKETS: { min: number; color: string; label: string }[] = [
  { min: 100, color: "#b91c1c", label: ">100" },
  { min: 50, color: "#f97316", label: "50–100" },
  { min: 15, color: "#84cc16", label: "15–50" },
  { min: -1, color: "#38bdf8", label: "<15" },
];

export function rainColor(mm: number): string {
  return (RAIN_BUCKETS.find((b) => mm >= b.min) ?? RAIN_BUCKETS[RAIN_BUCKETS.length - 1]).color;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

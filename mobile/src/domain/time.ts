/** "HH:MM" label for a timestep. */
export function stepLabel(stepMinutes: number, step: number): string {
  const minutes = step * stepMinutes;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "1h30" / "45 phút" style duration label. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h${mins > 0 ? mins : ""}`;
  return `${mins} phút`;
}

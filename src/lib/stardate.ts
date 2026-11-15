/* Mission time helpers. Stardate is a TNG-style display date: 1000 units per year, counted from mission day 1. */
export const STARDATE_EPOCH = 47000;
export function stardate(day: number, clockMin: number): string {
  const v = STARDATE_EPOCH + ((day - 1) + clockMin / 1440) * (1000 / 365.25);
  return (Math.floor(v * 10) / 10).toFixed(1);
}

/** SIMULATED one-way Earth delay in minutes along a Mars mission (light time grows with distance). */
const DELAY_POINTS: [number, number][] = [[1, 0.1], [30, 2.6], [60, 7.4], [90, 13.6], [112, 18], [150, 20.8], [200, 22.1], [260, 22.3], [330, 19.5], [400, 12.8], [470, 5.2], [520, 0.1]];
export function earthDelayMin(day: number, clockMin = 0): number {
  const t = day + clockMin / 1440;
  for (let i = 1; i < DELAY_POINTS.length; i++) {
    const [d0, v0] = DELAY_POINTS[i - 1], [d1, v1] = DELAY_POINTS[i];
    if (t <= d1) return v0 + ((v1 - v0) * Math.max(0, t - d0)) / (d1 - d0);
  }
  return DELAY_POINTS[DELAY_POINTS.length - 1][1];
}
export function fmtDelay(min: number): string {
  if (min < 1) return `${Math.round(min * 60)} s`;
  const m = Math.floor(min), s = Math.round((min - m) * 60);
  return s === 60 ? `${m + 1} min 00 s` : `${m} min ${String(s).padStart(2, '0')} s`;
}

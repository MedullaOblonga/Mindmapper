import { T } from '../logic/thresholds';

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** DESIGN §8.1: early-mission usual = median of weeks 3..8; for weeks 6..8 the median of weeks 3..w-1; none before week 6. */
export function usualForWeek(byWeek: Record<number, number>, week: number): number | null {
  const [from, to] = T.usualWeeks;
  const last = Math.min(to, week - 1);
  const xs: number[] = [];
  for (let w = from; w <= last; w++) if (byWeek[w] !== undefined && !Number.isNaN(byWeek[w])) xs.push(byWeek[w]);
  if (xs.length < T.minWeeksForUsual) return null;
  return median(xs);
}

/** Largest-remainder rounding of parts to percentages that sum to 100. All-zero input gives all zero. */
export function roundTo100(parts: number[]): number[] {
  const total = parts.reduce((a, b) => a + b, 0);
  if (total <= 0) return parts.map(() => 0);
  const exact = parts.map(p => (p / total) * 100);
  const out = exact.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length][1]] += 1;
  return out;
}

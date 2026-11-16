import { median } from '../lib/stats';
import { marksFor } from '../state/view';
import type { View } from '../state/view';

/* Every threshold is a placeholder, like the others in thresholds.ts. */
export const PRESS_DROP = 0.6;      // placeholder: the last two weeks average at most 60% of your usual weekly presses
export const PRESS_MIN_DAYS = 14;   // placeholder: two full weeks of presses before comparing

export interface PressCount { high: number; low: number; total: number }
export interface PressLook {
  perWeek: PressCount;                 // a week's worth: the last 14 days, halved, so one uneven week does not decide
  usual: PressCount | null;          // median week of days 15 to 56
  lowShare: number | null;           // low ÷ all presses, last 14 days
  usualLowShare: number | null;
  fewerOverall: boolean;             // both buttons dropped together
}

function count(v: View, from: number, to: number): PressCount {
  let high = 0, low = 0;
  for (let d = Math.max(1, from); d <= to; d++) for (const m of marksFor(v.scenario, v.events, d)) m.mood === 'high' ? high++ : low++;
  return { high, low, total: high + low };
}

/**
 * Presses per week over the last two weeks against your usual week.
 * When both buttons drop together, fewer low presses most likely means fewer presses, not fewer low moments,
 * so the fair comparison is the share of presses that were low.
 */
export function pressLook(v: View): PressLook {
  const two = count(v, v.day - 13, v.day);
  const perWeek = { high: Math.round(two.high / 2), low: Math.round(two.low / 2), total: Math.round(two.total / 2) };
  const weeks = [3, 4, 5, 6, 7, 8].filter(w => 7 * w <= v.day).map(w => count(v, 7 * w - 6, 7 * w));
  const usual = weeks.length >= 3 ? { high: median(weeks.map(w => w.high)), low: median(weeks.map(w => w.low)), total: median(weeks.map(w => w.total)) } : null;
  const lowShare = two.total ? two.low / two.total : null;
  const usualLowShare = usual && usual.total ? usual.low / usual.total : null;
  const fewerOverall = !!usual && v.day >= PRESS_MIN_DAYS && usual.total > 0 && perWeek.total <= PRESS_DROP * usual.total
    && perWeek.high < usual.high && perWeek.low <= usual.low;
  return { perWeek, usual, lowShare, usualLowShare, fewerOverall };
}

export const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)}%`);

/** The sentence for the High and low screen, or null when presses are near your usual. */
export function fewerPressesText(p: PressLook): string | null {
  if (!p.fewerOverall || !p.usual) return null;
  return `You have been pressing less overall: about ${p.perWeek.total} presses a week over the last two weeks, against a usual ${p.usual.total}. `
    + `Both buttons dropped together, so fewer lows here most likely means fewer presses, not fewer low moments. `
    + `Lows were ${pct(p.lowShare)} of your presses, against a usual ${pct(p.usualLowShare)}.`;
}

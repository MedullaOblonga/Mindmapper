import { usualForWeek, median } from '../lib/stats';
import { fmtDuration, weekOf } from '../lib/time';
import { T } from './thresholds';
import type { LedgerItem, LedgerKey, Scenario } from '../types';

export interface LedgerFlags { countWristDinners: boolean; quietKeys: LedgerKey[];
  movedUsual: Partial<Record<LedgerKey, { fromWeek: number; value: number }>>; }

interface Def { key: LedgerKey; side: 'draw' | 'refill'; reserve: LedgerItem['reserve']; label: string; scaleMax: number; unit: (n: number) => string; usualIs?: boolean; }
const n = (x: number) => String(Math.round(x * 10) / 10);
export const LEDGER_DEFS: Def[] = [
  { key: 'sleep', side: 'draw', reserve: 'rest', label: 'Sleep', scaleMax: 600, unit: v => `${fmtDuration(v)} a night` },
  { key: 'suitPrepLong', side: 'draw', reserve: 'rest', label: 'Long suit-prep days', scaleMax: 7, unit: v => `${n(v)} this week` },
  { key: 'daysSinceRest', side: 'draw', reserve: 'rest', label: 'Days since a full rest day', scaleMax: 14, unit: v => n(v) },
  { key: 'callsMissed', side: 'draw', reserve: 'connection', label: 'Call windows missed', scaleMax: 4, unit: v => `${n(v)} this week`, usualIs: true },
  { key: 'noisyNights', side: 'draw', reserve: 'calm', label: 'Noisy nights', scaleMax: 7, unit: v => `${n(v)} this week`, usualIs: true },
  { key: 'dinners', side: 'refill', reserve: 'connection', label: 'Dinners with crew', scaleMax: 7, unit: v => `${n(v)} this week` },
  { key: 'callsSam', side: 'refill', reserve: 'connection', label: 'Calls with Sam', scaleMax: 5, unit: v => `${n(v)} ${v === 1 ? 'call' : 'calls'}` },
  { key: 'callsMom', side: 'refill', reserve: 'connection', label: 'Calls with Mom', scaleMax: 5, unit: v => `${n(v)} ${v === 1 ? 'call' : 'calls'}` },
  { key: 'gym', side: 'refill', reserve: 'movement', label: 'Gym', scaleMax: 7, unit: v => `${n(v)} ${v === 1 ? 'session' : 'sessions'}` },
  { key: 'greenhouse', side: 'refill', reserve: 'calm', label: 'Greenhouse time', scaleMax: 7, unit: v => `${n(v)} ${v === 1 ? 'session' : 'sessions'}` },
  { key: 'copingDone', side: 'refill', reserve: 'calm', label: 'Coping tasks done', scaleMax: 7, unit: v => `${n(v)} this week` },
];
export const ledgerDef = (k: LedgerKey) => LEDGER_DEFS.find(d => d.key === k)!;

/** Raw weekly value of a ledger measure, before any user extras. */
export function rawValue(s: Scenario, key: LedgerKey, week: number, countWristDinners: boolean): number | null {
  const row = s.weeks[week - 1];
  if (!row) return null;
  if (key === 'sleep') {
    const ds = s.days.filter(d => d.week === week);
    return ds.length ? ds.reduce((a, d) => a + d.sleepMin, 0) / ds.length : null;
  }
  if (key === 'copingDone') return null;
  let v = row.ledger[key as keyof typeof row.ledger];
  if (key === 'dinners' && week === 6 && countWristDinners) v += 3;
  return v;
}

export function earlyUsualFor(s: Scenario, key: LedgerKey, week: number, countWristDinners: boolean): number | null {
  const by: Record<number, number> = {};
  for (let w = T.usualWeeks[0]; w <= T.usualWeeks[1]; w++) { const v = rawValue(s, key, w, countWristDinners); if (v !== null) by[w] = v; }
  return usualForWeek(by, week);
}

/** Median of weeks w-3..w, rounded to a whole number for counts (DESIGN §8.1). */
export function recentUsual(s: Scenario, key: LedgerKey, week: number, countWristDinners: boolean): number | null {
  const xs: number[] = [];
  for (let w = week - T.newUsualWeeks + 1; w <= week; w++) { const v = rawValue(s, key, w, countWristDinners); if (v !== null) xs.push(v); }
  if (!xs.length) return null;
  const m = median(xs);
  return key === 'sleep' ? Math.round(m) : Math.round(m);
}

export function isAway(key: LedgerKey, value: number, usual: number): boolean {
  if (key === 'sleep') return Math.abs(value - usual) >= T.sleepShortMin;
  if (usual === 0) return value >= T.ledgerGap;
  return Math.abs(value - usual) >= T.ledgerGap && (value >= T.ledgerRatio * usual || value <= usual / T.ledgerRatio);
}
export function isFar(key: LedgerKey, side: 'draw' | 'refill', value: number, usual: number): boolean {
  if (key === 'sleep') return usual - value >= T.sleepShortMin;
  if (side === 'draw') return usual === 0 ? value >= T.ledgerGap : value - usual >= T.ledgerGap && value >= T.ledgerRatio * usual;
  return usual - value >= T.ledgerGap && value <= usual / T.ledgerRatio;
}

function sentence(d: Def, value: number, usual: number | null): string {
  if (d.key === 'copingDone' || usual === null) return `${d.unit(value)}.`;
  const same = d.key === 'sleep' ? Math.round(value) === Math.round(usual) : value === usual;
  if (same) return `${d.unit(value)}. Your usual.`;
  const u = d.key === 'sleep' ? fmtDuration(usual) : n(usual);
  if (d.usualIs) return `${d.unit(value)}. Your usual is ${u}.`;
  return `${d.unit(value)}. ${value > usual ? 'Above' : 'Below'} your usual ${u}.`;
}

export function ledgerForWeek(s: Scenario, week: number, extra: { copingDone: number; wristDinners: Record<number, number> },
  flags: LedgerFlags): LedgerItem[] {
  return LEDGER_DEFS.map(d => {
    let value = d.key === 'copingDone' ? extra.copingDone : rawValue(s, d.key, week, flags.countWristDinners) ?? 0;
    if (d.key === 'dinners' && flags.countWristDinners) value += extra.wristDinners[week] ?? 0;
    const early = d.key === 'copingDone' ? null : earlyUsualFor(s, d.key, week, flags.countWristDinners);
    const moved = flags.movedUsual[d.key];
    const usual = moved && moved.fromWeek <= week ? moved.value : early;
    const far = usual !== null && d.key !== 'copingDone' && isFar(d.key, d.side, value, usual);
    const away = usual !== null && d.key !== 'copingDone' && isAway(d.key, value, usual);
    return { key: d.key, side: d.side, reserve: d.reserve, label: d.label, value, usual, earlyUsual: early,
      scaleMax: d.scaleMax, sentence: sentence(d, value, usual), far, away };
  });
}

export const weekOfDay = weekOf;

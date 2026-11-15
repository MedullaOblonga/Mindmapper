import { params } from '../data/params';
import { roundTo100, usualForWeek } from '../lib/stats';
import { weekOf } from '../lib/time';
import { T } from './thresholds';
import type { Entry, Group } from '../types';

export const SHARE_GROUPS: Group[] = [...params.groupsOrder, 'other'];

const segsOfWeek = (entries: Entry[], week: number) => entries.flatMap(e => e.segments).filter(s => weekOf(s.day) === week);

export function weekCounts(entries: Entry[], week: number): Record<Group, number> {
  const out = Object.fromEntries(SHARE_GROUPS.map(g => [g, 0])) as Record<Group, number>;
  for (const s of segsOfWeek(entries, week)) out[s.group] += 1;
  return out;
}

export function weekShares(entries: Entry[], week: number): { group: Group; count: number; share: number; pct: number }[] | null {
  const c = weekCounts(entries, week);
  const total = SHARE_GROUPS.reduce((a, g) => a + c[g], 0);
  if (total === 0) return null;
  const pcts = roundTo100(SHARE_GROUPS.map(g => c[g]));
  return SHARE_GROUPS.map((g, i) => ({ group: g, count: c[g], share: c[g] / total, pct: pcts[i] }))
    .filter(x => x.group !== 'other' || x.count > 0);
}

export function feltCounts(entries: Entry[], group: Group, fromDay: number, toDay: number) {
  const out = { count: 0, good: 0, mixed: 0, hard: 0 };
  for (const e of entries) for (const s of e.segments) {
    if (s.group !== group || s.day < fromDay || s.day > toDay) continue;
    out.count += 1;
    if (s.felt) out[s.felt] += 1;
  }
  return out;
}

export function shareOf(entries: Entry[], group: Group, week: number): number | null {
  const c = weekCounts(entries, week);
  const total = SHARE_GROUPS.reduce((a, g) => a + c[g], 0);
  return total === 0 ? null : c[group] / total;
}

export function usualShare(entries: Entry[], group: Group, week: number): number | null {
  const by: Record<number, number> = {};
  for (let w = T.usualWeeks[0]; w <= T.usualWeeks[1]; w++) { const v = shareOf(entries, group, w); if (v !== null) by[w] = v; }
  return usualForWeek(by, week);
}

/** hard ÷ count for the group over the early-mission weeks (3..8, or 3..w-1 for weeks 6..8). */
export function usualHardShare(entries: Entry[], group: Group, week: number): number | null {
  if (week < T.usualWeeks[0] + T.minWeeksForUsual) return null;
  const last = Math.min(T.usualWeeks[1], week - 1);
  const f = feltCounts(entries, group, 7 * T.usualWeeks[0] - 6, 7 * last);
  return f.count === 0 ? null : f.hard / f.count;
}

import { params } from '../data/params';
import { weekOf } from '../lib/time';
import type { DayRecord, Scenario } from '../types';

/** Counts back from wake day `day`: consecutive wake days whose sleep started at or after midnight. */
export function pastMidnightRun(days: DayRecord[], day: number, ignore: number[] = []): { run: number; eveningDays: number[] } {
  const eveningDays: number[] = [];
  for (let d = day; d >= 1; d--) {
    const rec = days[d - 1];
    if (!rec || ignore.includes(d - 1) || rec.onsetMin < 0) break;
    eveningDays.unshift(d - 1);
  }
  return { run: eveningDays.length, eveningDays };
}

export type SignStatus = { id: string; status: 'showed' | 'not' | 'unknown'; text: string; days?: number[] };

function metric(s: Scenario, m: string, day: number): number | null {
  const w = weekOf(day);
  switch (m) {
    case 'lightOnNights': return w === 16 ? params.lightOnNights.week16 : 0;
    case 'secondMealSkipped': return 0;
    case 'lettersUnopened': return 0;
    case 'crewTapsHard': return null;
    case 'greenhouse': return s.weeks[w - 1]?.ledger.greenhouse ?? null;
    default: return null;
  }
}

export function signStatuses(s: Scenario, day: number, ignoreNights: number[] = []): SignStatus[] {
  return s.profile.signs.map(sign => {
    const r = sign.rule;
    if (r.metric === 'pastMidnightRun') {
      const { run, eveningDays } = pastMidnightRun(s.days, day, ignoreNights);
      return run >= (r.atLeast ?? 3)
        ? { id: sign.id, status: 'showed', text: `Showed up: ${run} nights in a row`, days: eveningDays }
        : { id: sign.id, status: 'not', text: 'Did not show up' };
    }
    const v = metric(s, r.metric, day);
    if (v === null) return { id: sign.id, status: 'unknown', text: 'Not enough data yet' };
    const showed = r.atLeast !== undefined ? v >= r.atLeast : r.atMost !== undefined ? v <= r.atMost : false;
    if (!showed) return { id: sign.id, status: 'not', text: 'Did not show up' };
    return { id: sign.id, status: 'showed', text: r.metric === 'greenhouse' ? 'Showed up this week' : `Showed up on ${v} nights` };
  });
}

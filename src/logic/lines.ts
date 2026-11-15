import { params } from '../data/params';
import { bodySeries, CO2_LIMIT } from './body';
import { pastMidnightRun } from './signs';
import { withThreshold } from './rules';
import type { AppEvent } from '../state/events';
import type { Scenario, ShareLogEntry, ShareRule } from '../types';

/* Lines agreed before launch (sharing level 3).
   Fixed lines are the limits to confidentiality that apply on Earth: imminent risk to self or to others.
   The tool never infers these from the diary or from any measurement. They are reported by the crew
   member or by the crew medical officer.
   Negotiable lines are agreed between the crew member and the flight surgeon, and the crew member can
   change them; each change is itself sent. */

export const FLIGHT_SURGEON = 'Flight surgeon';
const medical = params.people.crew.find(p => p.id === params.profile.supportMap.medical);
export const CMO_NAME = medical?.name ?? 'your crew medical officer';
export const CMO = `Crew medical officer (${CMO_NAME})`;

type RuleChange = Extract<AppEvent, { type: 'rule-change' }>;
const thresholdOn = (rule: ShareRule, evs: AppEvent[], d: number) =>
  ([...evs].reverse().find((e): e is RuleChange => e.type === 'rule-change' && e.ruleId === rule.id && e.day <= d))?.atLeast ?? rule.atLeast;

/** For each day 1..day: how many days or nights running the collar CO2 has been at or above the limit. */
export function co2Runs(s: Scenario, day: number): number[] {
  const b = bodySeries(s, [], day);
  const awake = new Map(b.co2day.map(p => [p.day, p.v])), asleep = new Map(b.co2sleep.map(p => [p.day, p.v]));
  const out: number[] = [0];
  for (let d = 1; d <= day; d++) out[d] = (awake.get(d) ?? 0) >= CO2_LIMIT || (asleep.get(d) ?? 0) >= CO2_LIMIT ? out[d - 1] + 1 : 0;
  return out;
}

export interface Crossing { day: number; message: string; ruleId: string; fixed: boolean; }

/** Every note the agreed lines have sent up to `day`, and the most recent one from the last 7 days. */
export function lineNotes(s: Scenario, day: number, evs: AppEvent[], ignoreNights: number[]): { log: ShareLogEntry[]; latest: Crossing | null } {
  const log: ShareLogEntry[] = [];
  let latest: Crossing | null = null;
  const note = (rule: ShareRule, d: number, id: string, message: string) => {
    log.push({ id, day: d, to: FLIGHT_SURGEON, text: message, auto: true, kind: 'line', ruleId: rule.id });
    if (day - d < 7 && (!latest || d >= latest.day)) latest = { day: d, message, ruleId: rule.id, fixed: !!rule.fixed };
  };
  const co2 = co2Runs(s, day);
  for (const rule of s.profile.shareRules.filter(r => r.auto)) {
    if (rule.metric === 'safetyReport') {
      for (const e of evs) if (e.type === 'safety' && e.ruleId === rule.id) {
        log.push({ id: `${e.id}-cmo`, day: e.day, to: CMO, text: rule.message ?? '', auto: true, kind: 'line', ruleId: rule.id });
        note(rule, e.day, e.id, rule.message ?? '');
      }
      continue;
    }
    const runOn = rule.metric === 'pastMidnightRun' ? (d: number) => pastMidnightRun(s.days, d, ignoreNights).run
      : rule.metric === 'co2Run' ? (d: number) => co2[d] : null;
    if (!runOn) continue;
    let prev = 0;
    for (let d = 1; d <= day; d++) {
      const atLeast = thresholdOn(rule, evs, d), run = runOn(d);
      if (run >= atLeast && prev < atLeast) note(rule, d, `auto-${rule.id}-${d}`, withThreshold(rule.message ?? '', rule.atLeast, atLeast));
      prev = run;
    }
  }
  return { log, latest };
}

/** What the flight surgeon can see: only what was addressed to them. */
export function surgeonLog(log: ShareLogEntry[]): ShareLogEntry[] { return log.filter(e => e.to === FLIGHT_SURGEON); }

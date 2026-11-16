import { bodyReadings, fmt, type Reading } from './body';
import { CMO_NAME, surgeonLog } from './lines';
import { delayMin, fmtDelay } from '../lib/delay';
import { D } from '../config';
import type { CheckSession, Scenario, ShareLogEntry, ShareRule } from '../types';

/* The flight surgeon's daily overview, in SBAR form (Situation, Background, Assessment, Recommendation).
   Built only from what the flight surgeon may see: the measured body trends and the notes addressed to them.
   The wording comes from fixed prototype rules. It is a summary to read, not a clinical judgement. */

export type Level = 'ok' | 'look' | 'alert';
export const LEVEL_LABEL: Record<Level, string> = { ok: 'Nothing to act on', look: 'Worth a look', alert: 'Imminent-risk alert' };
export const ACTIVE_DAYS = 7;

export interface Alert { id: string; day: number; ruleId: string; fixed: boolean; label: string; text: string; source?: ShareLogEntry['source']; }

/** A short name for a line that sent a note. Lines that have not sent one are never shown to the flight surgeon. */
function alertLabel(rule: ShareRule | undefined, e: ShareLogEntry): string {
  if (e.fixed) return 'Imminent risk to self or others';
  const n = e.text.match(/\b(\d+) (?:nights|days)/)?.[1] ?? String(rule?.atLeast ?? '');
  if (rule?.metric === 'pastMidnightRun') return `Sleep past midnight, ${n} nights running`;
  if (rule?.metric === 'co2Run') return `Collar CO2 at or above 3.0 mmHg, ${n} in a row`;
  return 'Agreed line crossed';
}

/** Confirmed alerts only: notes that an agreed line actually sent to the flight surgeon, up to `day`. Newest first. */
export function alertsUpTo(log: ShareLogEntry[], rules: ShareRule[], day: number): Alert[] {
  return surgeonLog(log).filter(e => e.kind === 'line' && e.day <= day)
    .map(e => ({ id: e.id, day: e.day, ruleId: e.ruleId ?? '', fixed: !!e.fixed, label: alertLabel(rules.find(r => r.id === e.ruleId), e), text: e.text, source: e.source }))
    .sort((a, b) => b.day - a.day || Number(b.fixed) - Number(a.fixed));
}
export const isActive = (a: Alert, day: number) => day - a.day < ACTIVE_DAYS;

export interface Sbar { day: number; level: Level; situation: string; background: string[]; assessment: string; recommendation: string[]; }

const ago = (n: number) => (n === 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`);
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

const ADVICE: Partial<Record<string, string>> = {
  sleep: 'Protect the sleep period for the next 7 nights.',
  speed: 'Second checker on safety-critical tasks. Repeat the reaction test.',
  co2day: 'Ask for a check of CO2 removal and airflow.',
  co2sleep: 'Ask for an airflow check in the sleep station.',
  rhr: 'Ask about illness and exercise load at the next check.',
  exercise: 'Ask what is in the way of exercise.',
  mass: 'Review food intake with the crew medical officer.',
  sbp: 'Repeat the cuff reading.', glucose: 'Repeat the fasting reading.', temp: 'Repeat the temperature. Ask about symptoms.',
};

export function sbarFor(day: number, readings: Reading[], alerts: Alert[], messages: ShareLogEntry[]): Sbar {
  const active = alerts.filter(a => isActive(a, day));
  const risk = active.find(a => a.fixed);
  const agreed = active.filter(a => !a.fixed);
  const far = readings.filter(r => r.status === 'sustained');
  const once = readings.filter(r => r.status === 'once');
  const names = far.map(r => r.def.name.toLowerCase());
  const level: Level = risk ? 'alert' : far.length || agreed.length ? 'look' : 'ok';

  const parts: string[] = [];
  if (risk) parts.push(`Imminent-risk note received ${ago(day - risk.day)}.`);
  if (far.length) parts.push(`${far.length} ${far.length === 1 ? 'measure' : 'measures'} outside ${far.length === 1 ? 'its line' : 'their lines'}: ${list(names)}.`);
  for (const a of agreed) parts.push(`${a.label} (day ${D(a.day)}).`);
  if (!parts.length) parts.push('All measures inside their lines. No alerts.');

  const background = [`Day ${D(day)}. Earth is ${fmtDelay(delayMin(day))} away, one way.`];
  for (const r of far) background.push(`${r.def.name}: ${fmt(r, r.last!.v)} ${r.def.unit}${r.usual !== null ? `, usual ${fmt(r, r.usual)}` : ''}.`);
  if (once.length) background.push(`Single readings outside: ${list(once.map(r => r.def.name.toLowerCase()))}.`);
  const recent = messages.filter(m => m.day <= day && day - m.day < ACTIVE_DAYS).length;
  if (recent) background.push(`${recent} ${recent === 1 ? 'note' : 'notes'} from the crew member this week.`);

  const assessment = risk
    ? (risk.source === 'entry' ? 'Possible risk to self or others, raised by a word check of the diary. Not confirmed.' : 'Risk to self or others, reported on board.')
    : far.length >= 2 ? 'Two or more measures have moved together. This is a pattern, not a single reading.'
    : far.length === 1 ? 'One measure is outside its line. Nothing else has moved with it.'
    : agreed.length ? 'An agreed line was crossed. Measures are otherwise inside their lines.'
    : once.length ? 'Single readings only. Not a pattern.'
    : 'On the usual pattern.';

  const recommendation: string[] = [];
  if (risk) recommendation.push(`Confirm with ${CMO_NAME}, the crew medical officer, who is with the crew member. A reply takes ${fmtDelay(delayMin(day))} each way.`);
  for (const r of far) { const t = ADVICE[r.def.id]; if (t && !recommendation.includes(t)) recommendation.push(t); }
  if (agreed.some(a => a.ruleId === 'co2collar') && !far.some(r => r.def.id.startsWith('co2'))) recommendation.push(ADVICE.co2sleep!);
  if (agreed.some(a => a.ruleId === 'midnight5') && !far.some(r => r.def.id === 'sleep')) recommendation.push(ADVICE.sleep!);
  if (!recommendation.length) recommendation.push('No action. Routine review.');

  return { day, level, situation: parts.join(' '), background, assessment, recommendation };
}

/** One overview per day for the last `span` days, oldest first. */
export function sbarDays(s: Scenario, checks: CheckSession[], log: ShareLogEntry[], day: number, span = 14): Sbar[] {
  const messages = surgeonLog(log).filter(e => e.kind === 'message');
  const out: Sbar[] = [];
  for (let d = Math.max(1, day - span + 1); d <= day; d++) {
    const cs = checks.filter(c => c.day <= d);
    out.push(sbarFor(d, bodyReadings(s, cs, d), alertsUpTo(log, s.profile.shareRules, d), messages));
  }
  return out;
}

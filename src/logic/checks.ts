import { ledgerNow } from './drafts';
import { usualOnset } from './cards';
import { moodWeek } from '../state/view';
import { median } from '../lib/stats';
import type { View } from '../state/view';

/* Rotating checks. One is offered on Today: the one most overdue, moved up when a related pattern has shifted.
   Intervals and triggers are placeholders, like every threshold in this prototype. */
export type CheckKind = 'reaction' | 'sleep' | 'mood' | 'workload' | 'connection';
export interface Item { text: string; min: number; max: number; anchors: Record<number, string> }
export interface CheckDef { kind: CheckKind; title: string; length: string; basis: string; interval: number; items?: Item[] }

const five = (lo: string, hi: string): Pick<Item, 'min' | 'max' | 'anchors'> => ({ min: 1, max: 5, anchors: { 1: lo, 5: hi } });
const poms = (text: string): Item => ({ text, min: 0, max: 4, anchors: { 0: 'Not at all', 2: 'Moderately', 4: 'Extremely' } });
const tlx = (text: string, lo = 'Very low', hi = 'Very high'): Item => ({ text, min: 1, max: 10, anchors: { 1: lo, 10: hi } });
const ucla = (text: string): Item => ({ text, min: 1, max: 3, anchors: { 1: 'Hardly ever', 2: 'Some of the time', 3: 'Often' } });

export const CHECKS: CheckDef[] = [
  { kind: 'reaction', title: 'Reaction speed test', length: '3-minute test, about 4 minutes with dials', interval: 4,
    basis: 'Modelled on NASA’s Reaction Self-Test (PVT-B)' },
  { kind: 'sleep', title: 'Sleep check', length: '4 questions, about 1 minute', interval: 14,
    basis: 'Short form modelled on the Pittsburgh Sleep Quality Index',
    items: [
      { text: 'How well did you sleep last night?', ...five('Very badly', 'Very well') },
      { text: 'How long did it take you to fall asleep?', min: 1, max: 5, anchors: { 1: 'Under 15 minutes', 3: 'About half an hour', 5: 'Over an hour' } },
      { text: 'How rested did you feel when you woke?', ...five('Not at all', 'Fully') },
      { text: 'How often did noise, light or thoughts wake you?', ...five('Never', 'Many times') },
    ] },
  { kind: 'mood', title: 'Mood check', length: '6 words, about 1 minute', interval: 14,
    basis: 'Modelled on the Profile of Mood States, which NASA used in flight (dataset H05)',
    items: [poms('Tense'), poms('Worn out'), poms('Cheerful'), poms('Irritable'), poms('Lonely'), poms('Full of energy')] },
  { kind: 'workload', title: 'Workload check', length: '6 scales, about 2 minutes', interval: 7,
    basis: 'NASA Task Load Index (NASA-TLX)',
    items: [tlx('How mentally demanding was today’s work?'), tlx('How physically demanding was it?'), tlx('How hurried or rushed was the pace?'),
      tlx('How well did you do what you set out to do?', 'Very badly', 'Very well'), tlx('How hard did you have to work to get there?'), tlx('How irritated or stressed did you feel?')] },
  { kind: 'connection', title: 'Connection check', length: '3 questions, under a minute', interval: 14,
    basis: 'Three-item loneliness scale (Hughes and others, 2004)',
    items: [ucla('How often do you feel you lack company?'), ucla('How often do you feel left out?'), ucla('How often do you feel cut off from others?')] },
];
export const checkDef = (k: string) => CHECKS.find(c => c.kind === k);

/** When each questionnaire was last done before the tool's record begins (simulated). */
const SIM_LAST: Record<Exclude<CheckKind, 'reaction'>, number> = { sleep: 98, mood: 92, workload: 105, connection: 84 };

export interface DueCheck { def: CheckDef; since: number; reason: string | null; score: number; doneToday: boolean }

function lastDone(v: View, kind: CheckKind): number {
  if (kind === 'reaction') return [...v.checks].reverse().find(c => c.counts || c.origin === 'user')?.day ?? 0;
  const own = [...v.events].reverse().find(e => e.type === 'questionnaire' && e.kind === kind);
  if (own) return own.day;
  const sim = SIM_LAST[kind];
  const def = checkDef(kind)!;
  return sim <= v.day ? sim : Math.max(0, v.day - def.interval + 2);
}

/** Why a check is offered now, from the patterns the tool already follows. */
function reasonFor(v: View, kind: CheckKind): string | null {
  const L = ledgerNow(v);
  const far = (k: string) => L.find(i => i.key === k)?.far ?? false;
  if (kind === 'reaction') {
    if (v.openCards.some(c => c.kind === 'check')) return 'Your last test had more slow responses than your usual.';
    return v.day % 4 === 0 ? 'Scheduled every fourth day.' : null;
  }
  if (kind === 'sleep') {
    const late = v.scenario.days.slice(Math.max(0, v.day - 3), v.day).every(d => d.onsetMin - usualOnset(v.scenario) >= 60);
    if (far('sleep')) return 'You have slept less than your usual this week.';
    return late ? 'Your sleep has started later than your usual for three nights.' : null;
  }
  if (kind === 'mood') {
    const w = Math.ceil(v.day / 7), usual = median([3, 4, 5, 6, 7, 8].filter(x => 7 * x <= v.day).map(x => moodWeek(v.scenario, v.events, x, v.day).low));
    const now = moodWeek(v.scenario, v.events, w, v.day);
    return now.days && usual && now.low / now.days >= 1.5 * (usual / 7) ? 'You have pressed low more often than your usual this week.' : null;
  }
  if (kind === 'workload') return far('suitPrepLong') ? 'You have had more long suit-prep days than your usual.' : null;
  return far('dinners') || far('callsSam') ? 'Fewer dinners with crew and calls home than your usual.' : null;
}

export function dueChecks(v: View): DueCheck[] {
  return CHECKS.map(def => {
    const last = lastDone(v, def.kind), since = v.day - last;
    const reason = reasonFor(v, def.kind);
    const doneToday = def.kind === 'reaction' ? v.checks.filter(c => c.day === v.day).length >= 2 : since === 0;
    const score = doneToday ? -1 : since / def.interval + (reason ? 1 : 0);
    return { def, since, reason, score, doneToday };
  }).sort((a, b) => b.score - a.score);
}

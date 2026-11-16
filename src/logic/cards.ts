import { params } from '../data/params';
import { D } from '../config';
import { groupShort } from '../data/topics';
import { median } from '../lib/stats';
import { fmtClock, fmtLater, weekDays } from '../lib/time';
import { feltCounts, shareOf, usualHardShare, usualShare } from './shares';
import { ledgerForWeek, type LedgerFlags } from './ledger';
import { signStatuses } from './signs';
import { T } from './thresholds';
import { capFirst, listWords, numWord, ratioWords } from './words';
import { copingLabel, pickCoping } from './coping';
import type { Card, CardAction, CardKind, CheckSession, Entry, Group, LedgerItem, LedgerKey, Scenario } from '../types';

export { WHY } from '../data/evidence';
export { ratioWords, countWord } from './words';

export interface CardContext { entries: Entry[]; checks: CheckSession[]; flags: LedgerFlags;
  quiet: { kind: CardKind; subject: string; untilDay: number }[];
  movedUsual: Record<string, { fromWeek: number; value: number }>;
  ignoreNights?: number[]; extra?: { copingDone: number; wristDinners: Record<number, number> }; }

const person = (id: string) => [...params.people.crew, ...params.people.home].find(p => p.id === id)?.name ?? id;
const WORK_MATE = person(params.profile.supportMap.work);

const talk = (route: string, label = 'Talk to someone'): CardAction => ({ id: 'talk', kind: 'talk', label, payload: { route } });
const write = (topic: string): CardAction => ({ id: 'write', kind: 'write', label: 'Write about it', payload: { prefill: `About ${topic.toLowerCase()}: ` } });
function coping(fit: string): CardAction | null {
  const t = pickCoping(fit, params.profile, null)[0];
  return t ? { id: `coping-${t.id}`, kind: 'coping', label: copingLabel(t), payload: { taskId: t.id, fit } } : null;
}

function moved(ctx: CardContext, key: string, week: number): number | null {
  const m = ctx.movedUsual[key];
  return m && m.fromWeek <= week ? m.value : null;
}
function quiet(ctx: CardContext, kind: CardKind, subject: string, reviewDay: number): boolean {
  return ctx.quiet.some(q => q.kind === kind && q.subject === subject && reviewDay < q.untilDay);
}

/* ---------- 1. topic shift ---------- */
function topicShift(s: Scenario, week: number, ctx: CardContext, g: Group): Card | null {
  const usual = moved(ctx, `topic:${g}`, week) ?? usualShare(ctx.entries, g, week);
  if (usual === null) return null;
  for (let w = week - T.shareRiseWeeks + 1; w <= week; w++) {
    const sh = shareOf(ctx.entries, g, w);
    if (sh === null || sh < usual + T.shareRisePoints || sh < T.shareRiseRatio * usual) return null;
  }
  const [a2] = weekDays(week - 1), [, b2] = weekDays(week);
  const last = feltCounts(ctx.entries, g, a2, b2);
  const hardUsual = usualHardShare(ctx.entries, g, week) ?? 0;
  if (last.count < T.hardMinEntries || last.hard / last.count < hardUsual + T.hardRisePoints) return null;
  const firstWeek = Math.max(1, week - 7);
  const [a1] = weekDays(firstWeek), [, b1] = weekDays(firstWeek + 1);
  const first = feltCounts(ctx.entries, g, a1, b1);
  const words = first.count > 0 ? ratioWords(last.count / first.count) : null;
  const topic = groupShort(g);
  const statement = words
    ? `${topic} has come up ${words} as often as in your first two weeks. More of it felt difficult.`
    : `${topic} has come up more often than in your first two weeks. More of it felt difficult.`;
  const actions: CardAction[] =
    g === 'home' ? [write(topic), { id: 'call-window', kind: 'call-window', label: 'Book a call window' }, talk('home')]
    : g === 'work' ? [write(topic), talk('work', `Talk to ${WORK_MATE}`), coping('work') ?? talk('work')]
    : g === 'crew' ? [write(topic), coping('crew') ?? talk('crew'), talk('crew')]
    : [write(topic), coping('stress') ?? talk(g), talk(g)];
  return { id: `${week}-topic-shift-${g}`, week, day: 7 * week, kind: 'topic-shift', subject: g,
    title: `${topic} is coming up more`, statement,
    evidence: { type: 'marks', group: g, rows: [
      { label: `Days ${D(a1)} to ${D(b1)}`, ...first },
      { label: `Days ${D(a2)} to ${D(b2)}`, ...last }] },
    actions: dedupe(actions), whyKey: 'why.topic-shift', dataTag: s.source === 'demo' ? 'ai-sample' : 'nasa-journal' };
}

/* ---------- 2. own sign ---------- */
function ownSign(s: Scenario, week: number, ctx: CardContext): Card | null {
  const day = 7 * week;
  const showed = signStatuses(s, day, ctx.ignoreNights).filter(x => x.status === 'showed' && !quiet(ctx, 'own-sign', x.id, day));
  if (!showed.length) return null;
  const signs = s.profile.signs;
  const withLine = showed.find(x => signs.find(z => z.id === x.id)?.shareRuleId);
  const pick = withLine ?? [...showed].sort((a, b) => (b.days?.length ?? 0) - (a.days?.length ?? 0))[0];
  const sign = signs.find(z => z.id === pick.id)!;
  const when = pick.days?.length ? `It showed up on days ${listWords(pick.days.map(D))}.` : `It showed up this week. ${pick.text}.`;
  const actions: CardAction[] = [];
  if (sign.steps?.length) {
    actions.push({ id: 'own-step', kind: 'own-step', label: 'Start step 1 tonight', payload: { text: sign.steps[0] } });
    const m = sign.steps[1]?.match(/^Message (\w+):\s*(.*)$/);
    if (m) actions.push({ id: 'own-step-2', kind: 'talk', label: `Message ${m[1]}`, payload: { route: 'home', to: m[1].toLowerCase(), text: m[2].replace(/[“”]/g, '') } });
  }
  actions.push(talk('sleep'));
  return { id: `${week}-own-sign-${sign.id}`, week, day, kind: 'own-sign', subject: sign.id, title: sign.quote,
    statement: `You wrote this sign yourself: “${sign.quote}” ${when}`,
    evidence: { type: 'quote', quote: sign.quote, note: `Written by you on day −${Math.abs(s.profile.writtenOnDay)}` },
    actions, whyKey: 'why.own-sign', dataTag: 'sim' };
}

/* ---------- 3. attention check ---------- */
export function checkUsual(earlier: CheckSession[], rtOverride: number | null) {
  const rts = earlier.map(c => c.meanRtMs);
  const rt = rtOverride ?? median(rts);
  const wobble = median(rts.map(x => Math.abs(x - median(rts))));
  const lapses = median(earlier.map(c => c.lapses));
  return { rt, wobble, lapses };
}
export function checkQualifies(sessions: CheckSession[], rtOverride: number | null = null): boolean {
  const full = sessions.filter(c => c.counts);
  if (full.length < T.minSessionsForUsual + 1) return false;
  const latest = full[full.length - 1], prev = full[full.length - 2];
  const u = checkUsual(full.slice(0, -1), rtOverride);
  if (latest.lapses > u.lapses + T.lapseOver) return true;
  if (full.length < T.minSessionsForUsual + T.rtRunSessions) return false;
  const u2 = checkUsual(full.slice(0, -2), rtOverride);
  const line = u2.rt + T.rtWobbleTimes * u2.wobble;
  return latest.meanRtMs > line && prev.meanRtMs > line;
}
function shortNights(s: Scenario, day: number): number {
  const usual = median(s.days.filter(d => d.day >= 15 && d.day <= 56).map(d => d.sleepMin));
  let n = 0;
  for (let d = day; d > Math.max(0, day - 7); d--) { if (s.days[d - 1].sleepMin <= usual - T.sleepShortMin) n++; else break; }
  return n;
}
function check(s: Scenario, week: number, ctx: CardContext): Card | null {
  const day = 7 * week;
  const sessions = ctx.checks.filter(c => c.day <= day).sort((a, b) => a.day - b.day || (a.slot === 'am' ? -1 : 1));
  if (!checkQualifies(sessions, moved(ctx, 'rt', week))) return null;
  const full = sessions.filter(c => c.counts);
  const latest = full[full.length - 1];
  if (quiet(ctx, 'check', latest.slot, day) || quiet(ctx, 'check', 'rt', day)) return null;
  const u = checkUsual(full.slice(0, -1), moved(ctx, 'rt', week));
  const part = latest.slot === 'am' ? 'morning' : 'evening';
  const n = shortNights(s, latest.day);
  const statement = `More slow responses than your usual on this ${part}’s attention test${n >= 2 ? `, after ${numWord(n)} short nights` : ''}.`;
  const actions: CardAction[] = [];
  const sc = s.days.slice(day, day + 2).flatMap(d => d.blocks).find(b => b.safetyCritical);
  if (sc) actions.push({ id: 'protective', kind: 'protective', label: `Ask ${WORK_MATE} to second-check the ${sc.label}`, payload: { to: params.profile.supportMap.work, block: sc.label } });
  const nap = pickCoping('fatigue', params.profile, null)[0];
  if (nap) actions.push({ id: `coping-${nap.id}`, kind: 'coping', label: copingLabel(nap), payload: { taskId: nap.id, fit: 'fatigue' } });
  actions.push(talk('attention'));
  const ul = Math.round(u.lapses), ur = Math.round(u.rt);
  return { id: `${week}-check-${latest.slot}`, week, day, kind: 'check', subject: latest.slot,
    title: 'Slow responses on the attention test', statement,
    evidence: { type: 'usual-rows', rows: [
      { label: 'Slow responses', value: latest.lapses, usual: ul, scaleMax: 10, text: `${latest.lapses}. Your usual is ${ul}.` },
      { label: 'Average response time', value: Math.round(latest.meanRtMs), usual: ur, scaleMax: 400, text: `${Math.round(latest.meanRtMs)} ms. Your usual is ${ur} ms.` }] },
    actions, whyKey: 'why.check', dataTag: latest.origin };
}

/* ---------- 4. ledger ---------- */
const FIT: Partial<Record<LedgerKey, string>> = { sleep: 'fatigue', noisyNights: 'fatigue', callsSam: 'home', callsMom: 'home', callsMissed: 'home' };
const REMINDER: Partial<Record<LedgerKey, string>> = { dinners: 'dinner', callsSam: 'callwindow', callsMom: 'callwindow', callsMissed: 'callwindow', sleep: 'winddown', suitPrepLong: 'winddown', daysSinceRest: 'winddown', noisyNights: 'winddown' };
function itemTitle(i: LedgerItem): string {
  if (i.key === 'sleep') return 'less sleep';
  return `${i.side === 'refill' ? 'fewer' : 'more'} ${i.label.toLowerCase()}`;
}
function itemValue(i: LedgerItem, v: number): string { return i.key === 'sleep' ? fmtDurationShort(v) : String(Math.round(v * 10) / 10); }
function fmtDurationShort(min: number) { const m = Math.round(min); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`; }

export function farItems(s: Scenario, week: number, ctx: CardContext): LedgerItem[] {
  const movedLedger: LedgerFlags['movedUsual'] = { ...ctx.flags.movedUsual };
  for (const [k, v] of Object.entries(ctx.movedUsual)) if (k.startsWith('ledger:')) movedLedger[k.slice(7) as LedgerKey] = v;
  const items = ledgerForWeek(s, week, ctx.extra ?? { copingDone: 0, wristDinners: {} }, { ...ctx.flags, movedUsual: movedLedger });
  const day = 7 * week;
  return items.filter(i => i.far && i.usual !== null && !ctx.flags.quietKeys.includes(i.key) && !quiet(ctx, 'ledger', i.key, day))
    .sort((a, b) => Math.abs(b.value - b.usual!) / b.scaleMax - Math.abs(a.value - a.usual!) / a.scaleMax);
}
function ledger(s: Scenario, week: number, ctx: CardContext): Card | null {
  const far = farItems(s, week, ctx);
  if (!far.length) return null;
  const top = far.slice(0, 2);
  const statement = top.length === 1
    ? `${top[0].label}: ${itemValue(top[0], top[0].value)} this week. Your usual is ${itemValue(top[0], top[0].usual!)}.`
    : top.map(i => `${i.label}: ${itemValue(i, i.value)}, usual ${itemValue(i, i.usual!)}.`).join(' ');
  const title = capFirst(top.map(itemTitle).join(' and '));
  const fit = FIT[top[0].key] ?? 'stress';
  const actions = dedupe([
    { id: 'reminder', kind: 'reminder', label: 'Add a wrist reminder', payload: { reminderId: REMINDER[top[0].key] ?? 'winddown' } },
    coping(fit) ?? talk('ledger'), talk('ledger')]);
  return { id: `${week}-ledger-${top[0].key}`, week, day: 7 * week, kind: 'ledger', subject: top[0].key, title, statement,
    evidence: { type: 'usual-rows', rows: top.map(i => ({ label: i.label, value: i.value, usual: i.usual!, scaleMax: i.scaleMax, text: i.sentence })) },
    actions, whyKey: 'why.ledger', dataTag: 'sim' };
}

/* ---------- 5. rhythm ---------- */
export function usualOnset(s: Scenario): number { return median(s.days.filter(d => d.day >= 15 && d.day <= 56).map(d => d.onsetMin)); }
function rhythm(s: Scenario, week: number, ctx: CardContext): Card | null {
  const day = 7 * week;
  if (quiet(ctx, 'rhythm', 'sleep', day)) return null;
  const usual = moved(ctx, 'sleepStart', week) ?? usualOnset(s);
  const nights = s.days.slice(day - T.onsetLateNights, day);
  if (nights.length < T.onsetLateNights || nights.some(d => d.onsetMin - usual < T.onsetLateMin || ctx.ignoreNights?.includes(d.day - 1))) return null;
  const late = Math.round(median(nights.map(d => d.onsetMin - usual)) / 5) * 5;
  return { id: `${week}-rhythm-sleep`, week, day, kind: 'rhythm', subject: 'sleep', title: 'Sleep is starting later',
    statement: `Your sleep has started about ${fmtLater(late)} later than your usual for ${numWord(T.onsetLateNights)} nights.`,
    evidence: { type: 'nights', rows: nights.map(d => ({ day: d.day, onsetMin: d.onsetMin, usualMin: usual })) },
    actions: [{ id: 'rebuild', kind: 'rebuild-day', label: 'Rebuild yesterday' },
      { id: 'reminder', kind: 'reminder', label: 'Start a wind-down reminder', payload: { reminderId: 'winddown' } }, talk('sleep')],
    whyKey: 'why.rhythm', dataTag: 'sim' };
}

function dedupe(a: CardAction[]): CardAction[] {
  const seen = new Set<string>();
  return a.filter(x => (seen.has(x.label) ? false : (seen.add(x.label), true)));
}

const SLEEP_SIGNS = ['midnight', 'light'];

/** Every qualifying card for the review at the end of `week`, in DESIGN §8.2 order. No cap. */
export function candidateCards(s: Scenario, week: number, ctx: CardContext): Card[] {
  if (week * 7 <= T.settlingDays) return [];
  const day = 7 * week;
  const out: Card[] = [];
  for (const g of params.groupsOrder) {
    if (quiet(ctx, 'topic-shift', g, day)) continue;
    const c = topicShift(s, week, ctx, g);
    if (c) out.push(c);
  }
  const sign = ownSign(s, week, ctx);
  if (sign) out.push(sign);
  const chk = check(s, week, ctx);
  if (chk) out.push(chk);
  const led = ledger(s, week, ctx);
  if (led) out.push(led);
  if (!(sign && SLEEP_SIGNS.includes(sign.subject))) { const r = rhythm(s, week, ctx); if (r) out.push(r); }
  return out;
}

export const fmtOnset = fmtClock;

import { params } from '../data/params';
import { buildScenario } from '../data/scenario';
import { buildJournalScenario } from '../data/journalScenario';
import { candidateCards, usualOnset, type CardContext } from '../logic/cards';
import type { LedgerFlags } from '../logic/ledger';
import { recentUsual } from '../logic/ledger';
import { shareOf } from '../logic/shares';
import { pastMidnightRun } from '../logic/signs';
import { FLIGHT_SURGEON, lineNotes, type Crossing } from '../logic/lines';
import { T } from '../logic/thresholds';
import { median } from '../lib/stats';
import { weekOf } from '../lib/time';
import type { Block, MoodMark, Branch, Source, Card, CardKind, CheckSession, Entry, Group, LedgerKey, Resolution, Scenario, ShareLogEntry } from '../types';
import type { AppEvent } from './events';

export interface ReminderView { id: string; text: string; wristLabel: string; buzz: ('short' | 'long')[]; on: boolean; oneOff: boolean; atMin?: number; }
export interface View { day: number; week: number; source: Source; branch: Branch; scenario: Scenario; entries: Entry[]; checks: CheckSession[];
  openCards: Card[]; raisedCards: Card[]; resolutions: Resolution[]; skippedThisWeek: number; shareLog: ShareLogEntry[];
  lineCrossed: Crossing | null; flags: LedgerFlags; reminders: ReminderView[];
  marksToday: MoodMark[]; entryToday: Entry | null; blocksToday: Block[];
  movedUsual: CardContext['movedUsual']; ignoreNights: number[]; events: AppEvent[]; }

type Resolve = Extract<AppEvent, { type: 'resolve' }>;
const KIND_ORDER: CardKind[] = ['topic-shift', 'own-sign', 'check', 'ledger', 'rhythm'];
const order = (c: Card) => KIND_ORDER.indexOf(c.kind) * 100 + (c.kind === 'topic-shift' ? params.groupsOrder.indexOf(c.subject as never) : 0);
const sameSubject = (a: Card, b: Card) => a.kind === b.kind && a.subject === b.subject;

/** A iff an 'acted' resolve exists for a week-16 card. */
export function branchFor(events: AppEvent[], override: Branch | null): Branch {
  if (override) return override;
  return events.some(e => e.type === 'resolve' && e.status === 'acted' && e.cardId.startsWith('16-') && e.day <= 112) ? 'A' : 'B';
}

interface Effects { countWristDinners: boolean; quiet: CardContext['quiet']; movedUsual: CardContext['movedUsual']; ignoreNights: number[]; uncounted: string[]; reminders: string[]; }
const noEffects = (): Effects => ({ countWristDinners: false, quiet: [], movedUsual: {}, ignoreNights: [], uncounted: [], reminders: [] });

/** What a resolution changes (DESIGN §8.4), given the card and the answer. */
export function applyResolution(fx: Effects, card: Card, r: { status: Resolution['status']; reason?: string; day: number }, s: Scenario, entries: Entry[], checks: CheckSession[]) {
  if (r.status === 'skipped') { fx.quiet.push({ kind: card.kind, subject: card.subject, untilDay: r.day + T.quietSkippedDays }); return; }
  const missing = r.status === 'not-right' && r.reason === 'missing';
  if (!(missing && card.kind === 'topic-shift')) fx.quiet.push({ kind: card.kind, subject: card.subject, untilDay: r.day + T.quietActedDays });
  if (missing) {
    if (card.kind === 'ledger' && card.subject === 'dinners') fx.countWristDinners = true;
    if (card.kind === 'check') fx.uncounted.push(`c${card.day}`);
    if (card.kind === 'own-sign' || card.kind === 'rhythm') {
      const nights = card.evidence.type === 'nights' ? card.evidence.rows.map(x => x.day - 1) : pastMidnightRun(s.days, card.day).eveningDays;
      fx.ignoreNights.push(...nights);
    }
  }
  if (r.status === 'not-right' && r.reason === 'new-usual') Object.assign(fx.movedUsual, newUsualFor(card, s, entries, checks));
}

/** DESIGN §8.1: median of weeks w-3..w for everything named on the card, applied from week w+1. */
export function newUsualFor(card: Card, s: Scenario, entries: Entry[], checks: CheckSession[]): CardContext['movedUsual'] {
  const w = card.week, fromWeek = w + 1, out: CardContext['movedUsual'] = {};
  const weeks = Array.from({ length: T.newUsualWeeks }, (_, i) => w - T.newUsualWeeks + 1 + i);
  if (card.kind === 'topic-shift') {
    const xs = weeks.map(k => shareOf(entries, card.subject as Group, k)).filter((x): x is number => x !== null);
    if (xs.length) out[`topic:${card.subject}`] = { fromWeek, value: median(xs) };
  } else if (card.kind === 'ledger' && card.evidence.type === 'usual-rows') {
    const keys = card.evidence.rows.map(r => LABEL_KEY[r.label]).filter(Boolean) as LedgerKey[];
    for (const k of keys) { const v = recentUsual(s, k, w, false); if (v !== null) out[`ledger:${k}`] = { fromWeek, value: v }; }
  } else if (card.kind === 'rhythm') {
    out.sleepStart = { fromWeek, value: Math.round(median(s.days.filter(d => weeks.includes(d.week)).map(d => d.onsetMin))) };
  } else if (card.kind === 'check') {
    const xs = checks.filter(c => c.counts && weeks.includes(weekOf(c.day))).map(c => c.meanRtMs);
    if (xs.length) out.rt = { fromWeek, value: Math.round(median(xs)) };
  }
  return out;
}
const LABEL_KEY: Record<string, LedgerKey> = { Sleep: 'sleep', 'Long suit-prep days': 'suitPrepLong', 'Days since a full rest day': 'daysSinceRest',
  'Call windows missed': 'callsMissed', 'Noisy nights': 'noisyNights', 'Dinners with crew': 'dinners', 'Calls with Sam': 'callsSam',
  'Calls with Mom': 'callsMom', Gym: 'gym', 'Greenhouse time': 'greenhouse', 'Coping tasks done': 'copingDone' };
export { usualOnset };

function applyEntries(s: Scenario, day: number, evs: AppEvent[]): Entry[] {
  const out: Entry[] = s.entries.filter(e => e.day <= day).map(e => ({ ...e, segments: e.segments.map(x => ({ ...x })) }));
  for (const e of evs) if (e.type === 'entry') out.push({ ...e.entry, segments: e.entry.segments.map(x => ({ ...x })) });
  const byId = new Map(out.flatMap(e => e.segments.map(x => [x.id, x] as const)));
  for (const e of evs) if (e.type === 'retag') {
    const seg = byId.get(e.segmentId);
    if (!seg) continue;
    if (e.group) { seg.group = e.group; seg.category = e.group === 'other' ? 'Uncategorised' : seg.category; }
    if (e.felt) { seg.felt = e.felt; seg.feltBy = 'you'; }
  }
  return out.sort((a, b) => a.day - b.day);
}

/** The scenario for a simulation: the demo story (two branches) or a real journal replayed (no branches, nothing scripted). */
export function scenarioFor(source: Source, branch: Branch): Scenario {
  return source === 'demo' ? buildScenario(branch) : buildJournalScenario(source);
}

export function buildView(day: number, events: AppEvent[], override: Branch | null, source: Source = 'demo'): View {
  const evs = events.filter(e => e.day <= day);
  const branch = source === 'demo' ? branchFor(evs, override) : 'A';
  const s = scenarioFor(source, branch);
  const scripted = source === 'demo';
  const entries = applyEntries(s, day, evs);
  const baseChecks: CheckSession[] = [...s.checks.filter(c => c.day <= day), ...evs.flatMap(e => (e.type === 'check' ? [e.session] : []))]
    .sort((a, b) => a.day - b.day || (a.slot === 'am' ? -1 : 1));
  const resolves = evs.filter((e): e is Resolve => e.type === 'resolve');
  const extra = { copingDone: 0, wristDinners: {} as Record<number, number> };

  // Walk the weekly reviews.
  const all: { card: Card; res: Resolution | null; reason?: string; resDay?: number; stale?: boolean }[] = [];
  const raisedByWeek = new Map<number, Card[]>();
  const R = Math.floor(day / 7);
  const effectsUpTo = (w: number) => {
    const fx = noEffects();
    for (const x of all) if (x.res && x.card.week < w) applyResolution(fx, x.card, { status: x.res.status, reason: x.reason, day: x.resDay! }, s, entries, baseChecks);
    return fx;
  };
  for (let w = 3; w <= R; w++) {
    const fx = effectsUpTo(w);
    const reviewDay = 7 * w;
    const checks = baseChecks.filter(c => c.day <= reviewDay).map(c => (fx.uncounted.includes(`c${c.day}`) ? { ...c, counts: false } : c));
    const ctx: CardContext = { entries: entries.filter(e => e.day <= reviewDay), checks,
      flags: { countWristDinners: fx.countWristDinners, quietKeys: [], movedUsual: {} }, quiet: fx.quiet, movedUsual: fx.movedUsual,
      ignoreNights: fx.ignoreNights, extra };
    const cands = candidateCards(s, w, ctx);
    const carried = all.filter(x => !x.res && !x.stale && x.card.week < w && cands.some(c => sameSubject(c, x.card))).map(x => x.card);
    // stale open cards drop out silently
    for (const x of all) if (!x.res && !x.stale && x.card.week < w && !carried.includes(x.card)) x.stale = true;
    const fresh = cands.filter(c => !carried.some(k => sameSubject(k, c)));
    const raised = [...carried, ...fresh].sort((a, b) => order(a) - order(b)).slice(0, T.maxCardsPerWeek);
    raisedByWeek.set(w, raised);
    for (const c of raised) {
      if (all.some(x => x.card.id === c.id)) continue;
      const ev = resolves.find(e => e.cardId === c.id);
      let res: Resolution | null = null, reason: string | undefined, resDay: number | undefined;
      if (ev) { res = { cardId: c.id, day: ev.day, status: ev.status, title: ev.title, choice: ev.choice, effect: ev.effect }; reason = ev.reason; resDay = ev.day; }
      else {
        const sc = scripted ? params.scriptedResolutions.find(x => x.day === c.day && x.cardKind === c.kind) : undefined;
        if (sc && day > sc.day) { res = { cardId: c.id, day: sc.day, status: sc.status, title: c.title, choice: sc.choice, effect: sc.effect }; reason = sc.reason; resDay = sc.day; }
      }
      all.push({ card: c, res, reason, resDay });
    }
    // a resolve of a carried card resolves it now
    for (const x of all) if (!x.res && !x.stale) {
      const ev = resolves.find(e => e.cardId === x.card.id);
      if (ev) { x.res = { cardId: x.card.id, day: ev.day, status: ev.status, title: ev.title, choice: ev.choice, effect: ev.effect }; x.reason = ev.reason; x.resDay = ev.day; }
    }
  }

  const raisedCards = raisedByWeek.get(R) ?? [];
  const openCards = raisedCards.filter(c => !all.find(x => x.card.id === c.id)?.res);
  const resolutions = all.filter(x => x.res && x.res.status !== 'skipped').map(x => x.res!).sort((a, b) => b.day - a.day);
  const skippedThisWeek = all.filter(x => x.res?.status === 'skipped' && raisedCards.some(c => c.id === x.card.id)).length;

  // Display flags include every resolution up to `day`.
  const fxAll = effectsUpTo(Infinity);
  const flagsMoved: LedgerFlags['movedUsual'] = {};
  for (const [k, v] of Object.entries(fxAll.movedUsual)) if (k.startsWith('ledger:')) flagsMoved[k.slice(7) as LedgerKey] = v;
  const flags: LedgerFlags = { countWristDinners: fxAll.countWristDinners, quietKeys: [], movedUsual: flagsMoved };
  const checks = baseChecks.map(c => (fxAll.uncounted.includes(`c${c.day}`) ? { ...c, counts: false } : c));

  // Lines agreed before launch (level 3), checked daily.
  const lines = lineNotes(s, day, evs, fxAll.ignoreNights, entries);
  const shareLog: ShareLogEntry[] = lines.log;
  const lineCrossed: View['lineCrossed'] = lines.latest;
  for (const e of evs) {
    if (e.type === 'share') shareLog.push({ id: e.id, day: e.day, to: e.to, text: e.text, auto: false, kind: 'message' });
    if (e.type === 'rule-change') shareLog.push({ id: e.id, day: e.day, to: FLIGHT_SURGEON, text: e.text, auto: false, kind: 'rule-change', ruleId: e.ruleId });
  }
  shareLog.sort((a, b) => b.day - a.day);

  // Reminders
  const reminders: ReminderView[] = s.profile.reminders.filter(r => r.fromDay <= day)
    .map(r => ({ id: r.id, text: r.text, wristLabel: r.wristLabel, buzz: r.buzz as ('short' | 'long')[], on: r.on, oneOff: false, atMin: r.atMin }));
  if (scripted) for (const sc of params.scriptedResolutions) if (sc.enablesReminder && day > sc.day) { const r = reminders.find(x => x.id === sc.enablesReminder); if (r) r.on = true; }
  for (const e of evs) if (e.type === 'reminder') {
    const r = reminders.find(x => x.id === e.reminderId);
    if (r) { if (e.on !== undefined) r.on = e.on; if (e.text) r.text = e.text; if (e.buzz) r.buzz = e.buzz; }
    else if (e.text) reminders.push({ id: e.reminderId, text: e.text, wristLabel: e.text.length > 22 ? `${e.text.slice(0, 20)}…` : e.text,
      buzz: e.buzz ?? ['short'], on: e.on ?? true, oneOff: e.reminderId.startsWith('once-') });
  }

  const marksToday = marksFor(s, evs, day);
  const blocksToday = blocksFor(s, evs, day);
  const entryToday = [...entries].reverse().find(e => e.day === day) ?? null;

  return { day, week: weekOf(day), source, branch, scenario: s, entries, checks, openCards, raisedCards, resolutions, skippedThisWeek, shareLog,
    lineCrossed, flags, reminders, marksToday, entryToday, blocksToday, movedUsual: fxAll.movedUsual, ignoreNights: fxAll.ignoreNights, events: evs };
}

/** Wrist presses on a day: simulated ones plus the astronaut's own. */
export function marksFor(s: Scenario, evs: AppEvent[], day: number): MoodMark[] {
  const own = evs.flatMap(e => (e.type === 'mark' && e.day === day ? [{ min: e.min, blockLabel: e.blockLabel, mood: e.mood ?? 'low' }] : []));
  return [...(s.days[day - 1]?.marks ?? []), ...own].sort((a, b) => a.min - b.min);
}
/** The day's blocks with the astronaut's felt taps and added blocks applied. */
export function blocksFor(s: Scenario, evs: AppEvent[], day: number): Block[] {
  const base = (s.days[day - 1]?.blocks ?? []).map(b => ({ ...b }));
  for (const e of evs) if (e.type === 'block-add' && e.block.day === day) base.push({ ...e.block });
  for (const e of evs) if (e.type === 'block-felt') { const b = base.find(x => x.id === e.blockId); if (b) b.felt = e.felt; }
  return base.sort((a, b) => (a.kind === 'sleep' ? -1 : b.kind === 'sleep' ? 1 : a.startMin - b.startMin));
}
/** High and low presses per week. */
export function moodWeek(s: Scenario, evs: AppEvent[], week: number, upToDay: number): { high: number; low: number; days: number } {
  let high = 0, low = 0, days = 0;
  for (let d = 7 * week - 6; d <= Math.min(7 * week, upToDay); d++) { days++; for (const m of marksFor(s, evs, d)) m.mood === 'high' ? high++ : low++; }
  return { high, low, days };
}

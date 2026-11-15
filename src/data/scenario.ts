import { params } from './params';
import history from './nasa/check_history.json';
import { SENTENCES, GROUP_CATEGORY } from './sentences';
import { mulberry32 } from '../lib/prng';
import { dayIndex, weekOf } from '../lib/time';
import type { Block, BlockKind, Branch, CheckSession, DayRecord, Entry, Felt, RealGroup, Scenario, Segment, WeekRow } from '../types';

const G = params.generation;
const LAST = params.mission.lastDay;

export function weeksFor(branch: Branch): WeekRow[] {
  return [...params.weeks, ...(branch === 'A' ? params.weeksBranchA : params.weeksBranchB)];
}

function onsetFor(day: number, row: WeekRow, branch: Branch): number {
  const ex = G.explicitOnsetMin[String(day)]
    ?? (branch === 'A' ? G.explicitOnsetMinBranchA : G.explicitOnsetMinBranchB)[String(day)];
  if (ex !== undefined) return ex;
  return row.onsetMeanMin + G.onsetOffsetsMin[dayIndex(day) - 1];
}

type BT = [string, number, number];
const bt = (k: string) => G.blockTimes[k] as unknown as BT;
const btList = (k: string) => G.blockTimes[k] as unknown as [string, number, number, string][];

function blocksFor(day: number, row: WeekRow, onset: number, wake: number): Block[] {
  const i = dayIndex(day);
  const first = (k: string, n: number) => (G.blockDayIndexes[k] ?? []).slice(0, n).includes(i);
  const counters: Partial<Record<BlockKind, number>> = {};
  const out: Block[] = [];
  const add = (kind: BlockKind, label: string, s: number, e: number, source: Block['source']) => {
    const n = (counters[kind] = (counters[kind] ?? 0) + 1);
    out.push({ id: `d${day}-${kind}-${n}`, day, kind, label, startMin: s, endMin: e, source, felt: null });
  };
  add('sleep', 'Sleep', onset, wake, 'wearable');
  const restDay = i === 7 && row.ledger.daysSinceRest < 7;
  if (!restDay) {
    const list = first('suitPrepLong', row.ledger.suitPrepLong) ? btList('suitPrepLongDay') : btList('normalDay');
    for (const [label, s, e] of list) add('work', label, s, e, 'timeline');
  }
  if (first('greenhouse', row.ledger.greenhouse)) { const [l, s, e] = bt('greenhouse'); add('greenhouse', l, s, e, 'timeline'); }
  if (first('dinners', row.ledger.dinners)) { const [l, s, e] = bt('dinner'); add('dinner', l, s, e, 'timeline'); }
  if (first('gym', row.ledger.gym)) { const [l, s, e] = bt('gym'); add('gym', l, s, e, 'timeline'); }
  if (first('callsMom', row.ledger.callsMom)) { const [l, s, e] = bt('callMom'); add('call', l, s, e, 'messages'); }
  if (first('callsSam', row.ledger.callsSam)) { const [l, s, e] = bt(row.week === 16 ? 'callSamWeek16' : 'callSam'); add('call', l, s, e, 'messages'); }
  for (const sc of params.mission.safetyCriticalBlocks) if (sc.day === day) {
    const n = (counters.work = (counters.work ?? 0) + 1);
    out.push({ id: `d${day}-work-${n}`, day, kind: 'work', label: sc.label, startMin: sc.startMin, endMin: sc.endMin, source: 'timeline', felt: null, safetyCritical: true });
  }
  return out.sort((a, b) => (a.kind === 'sleep' ? -1 : b.kind === 'sleep' ? 1 : a.startMin - b.startMin));
}

export function blockAt(blocks: Block[], min: number): Block | null {
  return blocks.find(b => b.kind !== 'sleep' && b.startMin <= min && min < b.endMin) ?? null;
}

function buildDays(branch: Branch, weeks: WeekRow[]): DayRecord[] {
  const days: DayRecord[] = [];
  for (let day = 1; day <= LAST; day++) {
    const week = weekOf(day), row = weeks[week - 1], i = dayIndex(day);
    const sleepMin = row.sleepMeanMin + G.sleepDurationOffsetsMin[i - 1];
    const onsetMin = onsetFor(day, row, branch);
    const wakeMin = onsetMin + sleepMin;
    const blocks = blocksFor(day, row, onsetMin, wakeMin);
    if (day === 112) for (const b of blocks) {
      const f = params.day112BlockFelt[b.label];
      if (f !== undefined) b.felt = f;
    }
    const marks = params.markedMoments.filter(m => m.day === day)
      .map(m => ({ min: m.min, blockLabel: blockAt(blocks, m.min)?.label ?? null }));
    days.push({ day, week, dayIndex: i, onsetMin, wakeMin, sleepMin, blocks, marks, dials: { ...row.dials } });
  }
  return days;
}

function buildEntries(branch: Branch, weeks: WeekRow[]): Entry[] {
  const rand = mulberry32(G.seed);
  const cyc: Record<string, number> = {};
  const used: Record<string, number> = {};
  const pickText = (g: RealGroup, f: Felt) => {
    const list = SENTENCES[g][f];
    const k = `${g}.${f}`;
    const base = used[k] ?? Math.floor(rand() * list.length);
    used[k] = base + 1;
    return list[base % list.length];
  };
  const byDay = new Map<number, { text: string; category: string; group: RealGroup; felt: Felt }[]>();
  const push = (day: number, s: { text: string; category: string; group: RealGroup; felt: Felt }) => {
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(s);
  };
  for (const row of weeks) {
    const w = row.week;
    const idx = w === 16 ? G.journalDayIndexes.week16 : G.journalDayIndexes.default;
    const jdays = idx.map(i => 7 * w - 7 + i);
    const remaining: Record<RealGroup, number> = { ...row.segments };
    const homeLeft = { ...row.homeFelt };
    const anchors = params.anchorEntries.filter(a => weekOf(a.day) === w && (!a.branch || a.branch === branch));
    for (const a of anchors) {
      push(a.day, { text: a.text, category: a.category, group: a.group, felt: a.felt });
      remaining[a.group] -= 1;
      if (a.group === 'home') homeLeft[a.felt] -= 1;
    }
    const queue: { group: RealGroup; felt: Felt }[] = [];
    for (const g of params.groupsOrder) {
      if (g === 'home') {
        for (const f of ['good', 'mixed', 'hard'] as Felt[]) for (let k = 0; k < homeLeft[f]; k++) queue.push({ group: g, felt: f });
        continue;
      }
      const cycle = G.feltCycles[g];
      for (let k = 0; k < remaining[g]; k++) {
        const c = cyc[g] ?? 0; cyc[g] = c + 1;
        queue.push({ group: g, felt: cycle[c % cycle.length] });
      }
    }
    queue.forEach((q, k) => push(jdays[k % jdays.length], { text: pickText(q.group, q.felt), category: GROUP_CATEGORY[q.group], group: q.group, felt: q.felt }));
  }
  return [...byDay.keys()].sort((a, b) => a - b).map(day => ({
    id: `d${day}`, day, origin: 'ai-sample' as const,
    segments: byDay.get(day)!.map((s, n): Segment => ({ id: `d${day}-s${n + 1}`, day, text: s.text, category: s.category, group: s.group,
      felt: s.felt, feltBy: 'tool', origin: 'ai-sample' })),
  }));
}

function buildChecks(branch: Branch): CheckSession[] {
  const sessions = (history as { sessions: { meanRtMs: number; lapses: number; falseStarts: number; trials: number }[] }).sessions;
  const out: CheckSession[] = [];
  const mk = (day: number, slot: 'am' | 'pm', s: { meanRtMs: number; lapses: number; falseStarts: number; trials: number }, origin: CheckSession['origin']): CheckSession => ({
    id: `c${day}-${slot}`, day, slot, trials: s.trials, meanRtMs: s.meanRtMs, speed: Math.round((1000 / s.meanRtMs) * 1000) / 1000,
    lapses: s.lapses, falseStarts: s.falseStarts, durationS: 180, counts: true, origin });
  let k = 0;
  for (let day = 4; day <= 108; day += 4) for (const slot of ['am', 'pm'] as const) out.push(mk(day, slot, sessions[k++], 'nasa-replay'));
  const d = G.checks.day112am;
  out.push(mk(112, 'am', d, 'sim'));
  let j = 0;
  for (const day of [116, 120, 124]) for (const slot of ['am', 'pm'] as const) {
    if (branch === 'A') out.push(mk(day, slot, sessions[k++], 'nasa-replay'));
    else out.push(mk(day, slot, { meanRtMs: 262 + G.checks.rtPatternB[j], lapses: 3 + G.checks.lapsePatternB[j], falseStarts: 0, trials: 46 }, 'sim'));
    j++;
  }
  return out;
}

const cache: Partial<Record<Branch, Scenario>> = {};
export function buildScenario(branch: Branch): Scenario {
  if (cache[branch]) return cache[branch]!;
  const weeks = weeksFor(branch);
  const s: Scenario = { branch, days: buildDays(branch, weeks), entries: buildEntries(branch, weeks), checks: buildChecks(branch), weeks, profile: params.profile };
  cache[branch] = s;
  return s;
}

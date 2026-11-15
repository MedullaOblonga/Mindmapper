import { fmtClock } from '../lib/time';
import type { Block, Felt, Scenario } from '../types';

const angle = (min: number) => (min / 1440) * 2 * Math.PI - Math.PI / 2;
export const ringPoint = (min: number, r: number, cx: number, cy: number) => {
  const a = angle(min);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

/** SVG arc, midnight at the top, clockwise. A sleep block with a negative start is drawn from 1440 + start to end. */
export function arcPath(startMin: number, endMin: number, r: number, cx: number, cy: number): string {
  let s = startMin, e = endMin;
  if (s < 0) s += 1440;
  let span = e - s;
  if (span <= 0) span += 1440;
  span = Math.min(span, 1439.9);
  e = s + span;
  const p0 = ringPoint(s, r, cx, cy), p1 = ringPoint(e, r, cx, cy);
  const large = span > 720 ? 1 : 0;
  const f = (n: number) => Math.round(n * 100) / 100;
  return `M ${f(p0.x)} ${f(p0.y)} A ${r} ${r} 0 ${large} 1 ${f(p1.x)} ${f(p1.y)}`;
}

/** Bedtime of `day` in minutes after its 00:00: the next night's sleep start (capped at midnight). */
export function bedtimeOf(s: Scenario, day: number): number {
  const next = s.days[day];
  return next && next.onsetMin < 0 ? 1440 + next.onsetMin : 1440;
}

/** Scheduled blocks plus the free time between them, from waking to bedtime. The wrist fills free time. */
export function withFreeTime(blocks: Block[], wakeMin: number, bedMin: number, day: number, minLen = 30): Block[] {
  const busy = blocks.filter(b => b.kind !== 'sleep').map(b => [b.startMin, b.endMin] as const).sort((a, b) => a[0] - b[0]);
  const free: Block[] = [];
  let t = wakeMin, n = 0;
  const push = (a: number, b: number) => { if (b - a >= minLen) free.push({ id: `d${day}-free-${++n}`, day, kind: 'free', label: 'Free time', startMin: a, endMin: b, source: 'timeline', felt: null }); };
  for (const [a, b] of busy) { if (a > t) push(t, Math.min(a, bedMin)); t = Math.max(t, b); }
  if (bedMin > t) push(t, bedMin);
  return [...blocks, ...free].sort((a, b) => (a.kind === 'sleep' ? -1 : b.kind === 'sleep' ? 1 : a.startMin - b.startMin));
}

export function blockRange(b: Block): string { return `${fmtClock(b.startMin)} to ${fmtClock(b.endMin)}`; }
export const SOURCE_TEXT: Record<Block['source'], string> = { wearable: 'From your wearable', timeline: 'From the mission timeline', messages: 'From your messages', you: 'Added by you' };

type Grid = { morning: (Felt | string | null)[]; afternoon: (Felt | string | null)[]; evening: (Felt | string | null)[] };
/** DESIGN §7.5: name the part of the day with the most "hard" marks (4 or more), and the calmest part if it has 1 or fewer. */
export function dayPartSentence(grid: Grid): string {
  const parts = (['morning', 'afternoon', 'evening'] as const).map(p => ({ p, hard: grid[p].filter(x => x === 'hard').length, n: grid[p].length }));
  const most = [...parts].sort((a, b) => b.hard - a.hard)[0];
  if (most.hard < 4) return 'No part of the day stands out this week.';
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  let out = `${cap(most.p)}s felt hard on ${most.hard} of the last ${most.n} days.`;
  const least = parts.filter(x => x.p !== most.p).sort((a, b) => a.hard - b.hard)[0];
  if (least.hard <= 1) out += ` ${cap(least.p)}s mostly did not.`;
  return out;
}

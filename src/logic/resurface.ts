import { params } from '../data/params';
import { groupShort } from '../data/topics';
import { weekOf } from '../lib/time';
import { shareOf, usualShare } from './shares';
import type { Group, Segment } from '../types';
import type { View } from '../state/view';

export const RESURFACE_RISE = 0.08;     // placeholder: a topic is "coming up more" at 8 points above its usual share
export const RESURFACE_AGE = 28;        // placeholder: only sentences at least four weeks old come back

const ANCHORS = new Set(params.anchorEntries.map(a => a.text));
const own = (s: Segment) => s.origin === 'user' || ANCHORS.has(s.text);

export interface Resurfaced { seg: Segment; why: string; group: Group }

/** The topic most above its usual share in the latest week with entries, if any is clearly above. */
function risingTopic(v: View): { group: Group; now: number; usual: number } | null {
  let w = weekOf(v.day);
  const has = (wk: number) => v.entries.some(e => weekOf(e.day) === wk && e.day <= v.day);
  if (!has(w)) w -= 1;
  if (w < 1 || !has(w)) return null;
  let best: { group: Group; now: number; usual: number } | null = null;
  for (const g of params.groupsOrder) {
    const now = shareOf(v.entries.filter(e => e.day <= v.day), g, w), usual = usualShare(v.entries, g, w);
    if (now === null || usual === null || now - usual < RESURFACE_RISE) continue;
    if (!best || now - usual > best.now - best.usual) best = { group: g, now, usual };
  }
  return best;
}

/** One earlier sentence, chosen the same way all day so it does not jump on every visit. */
function pick(segs: Segment[], day: number): Segment | null {
  const pool = segs.filter(own).length ? segs.filter(own) : segs;
  return pool.length ? [...pool].sort((a, b) => a.day - b.day)[day % pool.length] : null;
}

/**
 * Brings back one sentence from earlier in the diary.
 * When a topic is coming up more than usual: a sentence about it from at least four weeks ago.
 * Otherwise: something written about four weeks ago.
 */
export function resurface(v: View): Resurfaced | null {
  const old = v.entries.flatMap(e => e.segments).filter(s => s.day <= v.day - RESURFACE_AGE);
  if (!old.length) return null;
  const r = risingTopic(v);
  if (r) {
    const seg = pick(old.filter(s => s.group === r.group), v.day);
    if (seg) return { seg, group: r.group, why: `${groupShort(r.group)} is coming up more in your diary than usual: ${Math.round(r.now * 100)}% of the latest week, against a usual ${Math.round(r.usual * 100)}%.` };
  }
  for (let d = v.day - RESURFACE_AGE; d >= v.day - RESURFACE_AGE - 6 && d >= 1; d--) {
    const segs = old.filter(s => s.day === d);
    const seg = segs.find(own) ?? segs[0];
    if (seg) return { seg, group: seg.group, why: 'Four weeks ago in your diary.' };
  }
  return null;
}

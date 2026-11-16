import type { View } from '../state/view';

export type Recorded = 'entry' | 'walkthrough' | null;

/**
 * Whether today is recorded. Words are optional: a written entry counts, and so does the walk-through on its own,
 * either confirmed with "Count today" or by tapping how every part of the planned day felt.
 */
export function recordedToday(v: View): Recorded {
  if (v.entryToday) return 'entry';
  if (v.events.some(e => e.type === 'walkthrough' && e.day === v.day)) return 'walkthrough';
  const parts = v.blocksToday.filter(b => b.kind !== 'sleep' && b.kind !== 'free');
  const tapped = new Set(v.events.flatMap(e => (e.type === 'block-felt' && e.day === v.day ? [e.blockId] : [])));
  return parts.length > 0 && parts.every(b => tapped.has(b.id)) ? 'walkthrough' : null;
}

import { blockAt } from '../data/scenario';
import type { View } from '../state/view';

const loadedAt = typeof performance !== 'undefined' ? performance.now() : 0;
/** The scenario clock is 19:42 on the current day plus real time since load (DESIGN §7.14). */
export function scenarioNow(): number {
  const secs = ((typeof performance !== 'undefined' ? performance.now() : 0) - loadedAt) / 1000;
  return Math.min(1439, 19 * 60 + 42 + Math.floor(secs / 60));
}
export function markNow(v: View): { min: number; blockLabel: string | null } {
  const min = scenarioNow();
  return { min, blockLabel: blockAt(v.scenario.days[v.day - 1].blocks, min)?.label ?? null };
}

import { blockAt } from '../data/scenario';
import { clockNow } from '../state/clock';
import type { Mood } from '../types';
import type { View } from '../state/view';

export function markNow(v: View, mood: Mood): { min: number; blockLabel: string | null; mood: Mood } {
  const min = clockNow();
  return { min, blockLabel: blockAt(v.blocksToday, min)?.label ?? null, mood };
}

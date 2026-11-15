import { T } from './thresholds';
import type { CheckSession } from '../types';

export interface Trial { rtMs: number | null; falseStart: boolean; timedOut: boolean; }

/** DESIGN §8.7, after PVT-B (Basner, Mollicone and Dinges 2011). */
export function scoreTrials(trials: Trial[], durationS: number, day: number, slot: 'am' | 'pm'): CheckSession {
  const valid = trials.filter(t => !t.falseStart && !t.timedOut && t.rtMs !== null && t.rtMs >= T.falseStartMs).map(t => t.rtMs!);
  const timedOut = trials.filter(t => t.timedOut).length;
  const falseStarts = trials.filter(t => t.falseStart || (t.rtMs !== null && t.rtMs < T.falseStartMs && !t.timedOut)).length;
  const mean = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  const speed = valid.length ? valid.reduce((a, b) => a + 1000 / b, 0) / valid.length : 0;
  return { id: `c${day}-${slot}`, day, slot, trials: valid.length, meanRtMs: Math.round(mean * 100) / 100, speed: Math.round(speed * 1000) / 1000,
    lapses: valid.filter(rt => rt >= T.lapseMs).length + timedOut, falseStarts, durationS, counts: durationS >= 180, origin: 'user' };
}

/** Uniform 1000..4000 ms. */
export function nextWaitMs(rand: () => number): number { return 1000 + Math.floor(rand() * 3001); }

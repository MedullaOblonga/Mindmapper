import { params } from '../data/params';
import { weekDays } from '../lib/time';
import { feltCounts, shareOf, usualHardShare, usualShare } from './shares';
import { T } from './thresholds';
import type { Entry, Group } from '../types';

/** A topic that came up more than its usual for several weeks in a row, and whether the tool would have said so. */
export interface Rise {
  group: Group; fromWeek: number; toWeek: number; usual: number; peak: number;
  hard: number; hardUsual: number; count: number; carded: boolean; why: string;
}

/**
 * Walks the weekly picture the same way the weekly review does (DESIGN §8.2), but keeps every rise, including the ones
 * that raise no card. A card needs both: the topic up for three weeks running, and more of it felt difficult.
 */
export function topicRises(entries: Entry[], lastWeek: number): Rise[] {
  const out: Rise[] = [];
  const first = Math.floor(T.settlingDays / 7) + 1;
  for (const g of params.groupsOrder) {
    let run: { w: number; sh: number }[] = [];
    const close = () => {
      if (run.length >= T.shareRiseWeeks) {
        const to = run[run.length - 1].w;
        const usual = usualShare(entries, g, run[0].w) ?? 0;
        const [a] = weekDays(Math.max(run[0].w, to - 1)), [, b] = weekDays(to);
        const f = feltCounts(entries, g, a, b);
        const hard = f.count ? f.hard / f.count : 0, hardUsual = usualHardShare(entries, g, to) ?? 0;
        const carded = f.count >= T.hardMinEntries && hard >= hardUsual + T.hardRisePoints;
        const why = carded ? 'More of it felt difficult than usual, so the weekly review raises a card.'
          : f.count < T.hardMinEntries ? `Too few sentences in the last two weeks (${f.count}) to say how it felt, so no card.`
          : `It did not feel more difficult than usual (${Math.round(hard * 100)}% difficult, usual ${Math.round(hardUsual * 100)}%), so the tool stays quiet.`;
        out.push({ group: g, fromWeek: run[0].w, toWeek: to, usual, peak: Math.max(...run.map(r => r.sh)), hard, hardUsual, count: f.count, carded, why });
      }
      run = [];
    };
    for (let w = first; w <= lastWeek; w++) {
      const usual = usualShare(entries, g, w), sh = shareOf(entries, g, w);
      if (usual !== null && sh !== null && sh >= usual + T.shareRisePoints && sh >= T.shareRiseRatio * usual) run.push({ w, sh });
      else close();
    }
    close();
  }
  return out.sort((a, b) => a.fromWeek - b.fromWeek);
}

/** Weeks with no entry: the weekly picture has a gap there, and a rise cannot run across it. */
export function emptyWeeks(entries: Entry[], lastWeek: number): number[] {
  return Array.from({ length: lastWeek }, (_, i) => i + 1).filter(w => shareOf(entries, 'work', w) === null && w > 1);
}

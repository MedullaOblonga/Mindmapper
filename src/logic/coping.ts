import type { CopingTask, Profile } from '../types';

export type HelpLog = { taskId: string; uses: number; medianChange: number }[];

/** DESIGN §8.3: filter by fit, preferences first, then fewest "did not help", drop anything longer than the free minutes. Dislikes sit last. */
export function pickCoping(fit: string, profile: Profile, minutesFree: number | null, log: HelpLog = profile.helpedLog): CopingTask[] {
  const notHelped = (id: string) => { const l = log.find(x => x.taskId === id); return l && l.medianChange >= 0 ? l.uses : 0; };
  const disliked = (t: CopingTask) => /guided|audio|breathing/i.test(t.label) && profile.dislikes.some(d => /guided/i.test(d)) ? 1 : 0;
  return profile.copingMenu
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.fits.includes(fit))
    .filter(({ t }) => minutesFree === null || t.minutes <= minutesFree)
    .sort((a, b) => disliked(a.t) - disliked(b.t) || Number(b.t.fromPreferences) - Number(a.t.fromPreferences)
      || notHelped(a.t.id) - notHelped(b.t.id) || a.i - b.i)
    .map(x => x.t);
}

export const copingLabel = (t: CopingTask) => (t.id === 'nap20' ? '20-minute nap' : t.label);

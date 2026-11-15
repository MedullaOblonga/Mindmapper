import type { Profile } from '../types';

/** Things from the astronaut's own list that fit the free minutes (coping menu lengths, else 15 minutes). Up to three. */
export function pickFree(minutes: number, profile: Profile): { label: string; minutes: number }[] {
  return profile.enjoys
    .map(label => ({ label, minutes: profile.copingMenu.find(c => c.label.toLowerCase() === label.toLowerCase())?.minutes ?? 15 }))
    .filter(x => x.minutes <= minutes)
    .slice(0, 3);
}

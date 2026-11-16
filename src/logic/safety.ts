import { params } from '../data/params';
import type { Entry, Profile, ShareLogEntry } from '../types';

/* Word check for the one fixed line: possible risk to self or to others.
   A stand-in, like the keyword tagger. It runs on the device and only says "this entry matches".
   It will miss real risk and it will match harmless sentences; it has not been validated.
   The entry's words are never sent. Only the fact of a match is. */
const PHRASES = [
  /\bbetter off without me\b/i,
  /\b(no|can(?:no|\u2019|')?t see (?:the|any)) point in (?:going on|living|any of (?:it|this))\b/i,
  /\bnot worth living\b/i,
  /\b(?:do not|don(?:\u2019|')?t) want to (?:be here|wake up|go on|live)\b/i,
  /\bwish I (?:was|were) dead\b/i,
  /\b(?:end|ending) (?:it all|my life)\b/i,
  /\bsuicid/i,
  /\b(?:kill|hurt|harm) (?:myself|him|her|them|someone)\b/i,
];
export function matchesSafetyLine(text: string): boolean { return PHRASES.some(re => re.test(text)); }
export function entryMatches(e: Entry): boolean { return e.segments.some(s => matchesSafetyLine(s.text)); }

export interface ReliefStep { id: 'person' | 'own' | 'protect'; text: string; short: string; }   // short: a few words, said to the astronaut
const nameOf = (id: string) => [...params.people.crew, ...params.people.home].find(p => p.id === id)?.name ?? id;

/** What the tool offers on board straight away. Built from the plan written before launch. Supports, not treatment. */
export function reliefSteps(profile: Profile): ReliefStep[] {
  const cmo = nameOf(profile.supportMap.medical), mate = nameOf(profile.supportMap.work);
  const own = profile.copingMenu.find(c => c.fromPreferences && c.fits.includes('lowmood'));
  return [
    { id: 'person', text: `${cmo}, the crew medical officer, comes to talk now. Nobody waits for Earth.`, short: `${cmo} comes to talk` },
    ...(own ? [{ id: 'own' as const, short: `${own.label}, ${own.minutes} min`, text: `From the crew member\u2019s own list: ${own.label.toLowerCase()}, ${own.minutes} minutes, with company if wanted.` }] : []),
    { id: 'protect', text: `${mate} second-checks safety-critical work for the next two days.`, short: `${mate} double-checks your work` },
  ];
}

/** Notes from the fixed line that reached the flight surgeon in the last `days` days. */
export function recentSafetyNotes(log: ShareLogEntry[], day: number, days = 7): ShareLogEntry[] {
  return log.filter(e => e.kind === 'line' && e.fixed && e.to === 'Flight surgeon' && day - e.day < days && e.day <= day);
}

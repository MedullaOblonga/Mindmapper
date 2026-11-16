import { params } from './params';
import history from './nasa/check_history.json';
import williams from './journals/williams.json';
import anderson from './journals/anderson.json';
import { blockAt, blocksFor } from './scenario';
import { tagEntry, type ExtraFelt, type ExtraKeywords } from '../logic/tagger';
import { mulberry32 } from '../lib/prng';
import { dayIndex, weekOf } from '../lib/time';
import type { CheckSession, DayRecord, Entry, MoodMark, Scenario, Source, WeekRow } from '../types';

/*
 * A second kind of simulation: a real NASA astronaut journal, replayed on the Mars timeline.
 * Real: the diary text (as published on nasa.gov) and the reaction tests (NASA bed-rest record, replayed in order).
 * Simulated and plain: sleep, the day's timeline, wrist presses and body measures. They are the demo's
 * early-mission usual week repeated, with no story in it, so any pattern the tool finds comes from the writing.
 */

export interface JournalEntryData { n: number; title: string; day: number | null; dayFrom: string; words: number; url: string; archive: string; text: string }
export interface JournalData { source: Exclude<Source, 'demo'>; author: string; mission: string; launch: string; lastDay: number; note: string;
  people: { crew: string[]; home: string[] }; entries: JournalEntryData[] }

export const JOURNALS: Record<Exclude<Source, 'demo'>, JournalData> = { williams: williams as JournalData, anderson: anderson as JournalData };

const G = params.generation;
const PLAIN_ROW = params.weeks[2];   // the demo's week 3, an early-mission usual week, repeated with no story in it
const rowFor = (w: number): WeekRow => ({ ...PLAIN_ROW, week: w });

/** Plain wrist presses: the usual two highs and one low a day, spread unevenly over each week. */
function plainMarks(day: number, blocks: DayRecord['blocks'], wakeMin: number, seed: number): MoodMark[] {
  const w = weekOf(day), rand = mulberry32(seed * 7919 + w * 104729);
  const perDay = Array.from({ length: 7 }, () => [0, 0]);
  for (let n = 0; n < 14; n++) perDay[Math.floor(rand() * 7)][0] += 1;
  for (let n = 0; n < 7; n++) perDay[Math.floor(rand() * 7)][1] += 1;
  const [high, low] = perDay[dayIndex(day) - 1];
  const r = mulberry32(seed * 31 + day * 7919);
  const out: MoodMark[] = [];
  const place = (kinds: string[], mood: MoodMark['mood']) => {
    const pool = blocks.filter(b => kinds.includes(b.kind));
    let min: number;
    if (pool.length && r() < 0.8) { const b = pool[Math.floor(r() * pool.length)]; min = b.startMin + Math.floor(r() * Math.max(1, b.endMin - b.startMin)); }
    else min = mood === 'low' ? 1290 + Math.floor(r() * 90) : Math.max(wakeMin + 20, 840) + Math.floor(r() * 120);
    out.push({ min, blockLabel: blockAt(blocks, min)?.label ?? null, mood });
  };
  for (let k = 0; k < high; k++) place(['gym', 'dinner', 'call', 'greenhouse', 'meal'], 'high');
  for (let k = 0; k < low; k++) place(['work'], 'low');
  return out.sort((a, b) => a.min - b.min);
}

function plainDays(lastDay: number, seed: number): { days: DayRecord[]; weeks: WeekRow[] } {
  const weeks = Array.from({ length: Math.ceil(lastDay / 7) }, (_, i) => rowFor(i + 1));
  const days: DayRecord[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const week = weekOf(day), row = weeks[week - 1], i = dayIndex(day);
    const onsetMin = row.onsetMeanMin + G.onsetOffsetsMin[i - 1];
    const sleepMin = row.sleepMeanMin + G.sleepDurationOffsetsMin[i - 1];
    const wakeMin = onsetMin + sleepMin;
    const blocks = blocksFor(day, row, onsetMin, wakeMin, false);
    days.push({ day, week, dayIndex: i, onsetMin, wakeMin, sleepMin, blocks, marks: plainMarks(day, blocks, wakeMin, seed), dials: { ...row.dials } });
  }
  return { days, weeks };
}

/** The volunteer's real reaction-test sessions from the NASA bed-rest record, morning and evening every fourth day. */
function replayChecks(lastDay: number): CheckSession[] {
  const sessions = (history as { sessions: { meanRtMs: number; lapses: number; falseStarts: number; trials: number }[] }).sessions;
  const out: CheckSession[] = [];
  let k = 0;
  for (let day = 4; day <= lastDay; day += 4) for (const slot of ['am', 'pm'] as const) {
    if (k >= sessions.length) break;
    const s = sessions[k++];
    out.push({ id: `c${day}-${slot}`, day, slot, trials: s.trials, meanRtMs: s.meanRtMs, speed: Math.round((1000 / s.meanRtMs) * 1000) / 1000,
      lapses: s.lapses, falseStarts: s.falseStarts, durationS: 180, counts: true, origin: 'nasa-replay' });
  }
  return out;
}

/*
 * Words for writing from orbit, used for the replays only. The demo's word lists were written for a Mars-cruise diary;
 * these were added after reading the two journals, so they are tuned on the text being scored. Treat the results as a
 * first look, not a validation. Same categories as before (Stuster's), only more words.
 */
export const SPACEFLIGHT_WORDS: ExtraKeywords[] = [
  { category: 'Work', group: 'work', keywords: ['spacewalk', 'progress', 'soyuz', 'shuttle', 'science', 'engineer', 'install', 'reboost', 're-boost',
    'solar array', 'truss', 'canadarm', 'robotic arm', 'module', 'hatch', 'undock', 'docking', 'cargo', 'unload', 'thruster', 'computer', 'research',
    'investigation', 'mission', 'increment', 'assembly', 'airlock', 'gyroscope', 'cmg', 'hardware'] },
  { category: 'Organization/Management', group: 'work', keywords: ['mcc', 'houston', 'moscow', 'control center', 'flight controller', 'capcom', 'schedule'] },
  { category: 'Recreation/Leisure', group: 'timeoff', keywords: ['flew over', 'flown over', 'cool places', 'sunrise', 'sunset', 'planet', 'the view', 'views',
    'photograph', 'pictures', 'picture', 'football', 'super bowl', 'patriots', 'movie', 'marathon', 'weekend', 'saturday', 'sunday'] },
  { category: 'Event', group: 'timeoff', keywords: ['christmas', 'new year', "valentine", "st patrick", 'cinco de mayo', "mother's day", 'thanksgiving'] },
  { category: 'Food', group: 'body', keywords: ['tofu', 'garlic', 'vegetable', 'dessert', 'drink', 'juice', 'tea', 'cook', 'recipe', 'tortilla', 'shrimp',
    'cookie', 'chocolate', 'breakfast', 'lunch', 'dinner', 'menu', 'bonus container'] },
  { category: 'Exercise', group: 'body', keywords: ['calves', 'muscle', 'bone', 'sweat', 'running', 'weights', 'cycling', 'ergometer', 'ared', 'cevis', 'tvis'] },
  { category: 'Group Interaction', group: 'crew', keywords: ['crewmate', 'crewmates', 'visitors', 'the boys', 'the guys', 'company', 'all of us', 'welcomed'] },
  { category: 'Outside Communications', group: 'home', keywords: ['grandfather', 'grandchild', 'dog', 'parents', 'mother', 'father', 'loved ones', 'phone call', 'e-mail', 'email'] },
  { category: 'Adjustment', group: 'self', keywords: ['emotional', 'overwhelm', 'privilege', 'i must admit', 'daydream', 'hard to believe', 'i miss', 'lucky'] },
];
export const SPACEFLIGHT_FELT: ExtraFelt = {
  good: ['awesome', 'cool', 'amazing', 'wonderful', 'beautiful', 'love', 'excited', 'fantastic', 'incredible', 'blast', 'neat', 'terrific', 'grand', 'lucky', 'privilege'],
  hard: ['tough', 'difficult', 'scary', 'sorry', 'hated', 'unfortunately', 'sadly', 'exhausting', 'overwhelming', 'emotional', 'stressful', 'challenging', 'trouble'],
};

/** The journal's in-flight entries, tagged on the device like the astronaut's own, plus spaceflight words and the crew's real names. */
export function journalEntries(j: JournalData): Entry[] {
  const names: ExtraKeywords[] = [
    { category: 'Group Interaction', group: 'crew', keywords: j.people.crew, caseSensitive: true },
    { category: 'Outside Communications', group: 'home', keywords: j.people.home, caseSensitive: true },
  ];
  return j.entries.filter(e => e.day !== null && e.day <= j.lastDay).map(e => {
    const id = `${j.source}-${e.n}`;
    return { id, day: e.day!, origin: 'nasa-journal' as const,
      segments: tagEntry(e.text, e.day!, id, [...SPACEFLIGHT_WORDS, ...names], SPACEFLIGHT_FELT).map(s => ({ ...s, origin: 'nasa-journal' as const })) };
  });
}

const cache: Partial<Record<Source, Scenario>> = {};
export function buildJournalScenario(source: Exclude<Source, 'demo'>): Scenario {
  if (cache[source]) return cache[source]!;
  const j = JOURNALS[source];
  const { days, weeks } = plainDays(j.lastDay, source === 'williams' ? 11 : 23);
  const s: Scenario = { source, branch: 'A', days, weeks, entries: journalEntries(j), checks: replayChecks(j.lastDay), profile: params.profile };
  cache[source] = s;
  return s;
}

/** The last day of each simulation, and the day it opens on. */
export const lastDayOf = (source: Source) => (source === 'demo' ? params.mission.lastDay : JOURNALS[source].lastDay);
export const openingDayOf = (source: Source) => (source === 'demo' ? 112 : Math.max(...JOURNALS[source].entries.flatMap(e => (e.day ? [e.day] : []))));

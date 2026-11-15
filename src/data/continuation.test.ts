import { buildScenario } from './scenario';
import { buildView } from '../state/view';
import { bodyReadings } from '../logic/body';
import { entryMatches } from '../logic/safety';

const fnv = (s: string) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); };
const story = (b: 'A' | 'B') => { const s = buildScenario(b); return fnv(JSON.stringify([s.days.filter(d => d.day <= 126), s.entries.filter(e => e.day <= 126), s.checks.filter(c => c.day <= 126)])); };

it('days 1 to 126 are exactly the original story, in both branches', () => {
  expect(story('A')).toBe('6cb37291');
  expect(story('B')).toBe('19b2fd26');
});
it('the continuation runs from day 127 to day 250 with diary entries, sleep and tests', () => {
  for (const b of ['A', 'B'] as const) {
    const s = buildScenario(b);
    expect(s.days[249].day).toBe(250);
    expect(s.weeks).toHaveLength(36);
    const later = s.entries.filter(e => e.day > 126);
    expect(later.length).toBeGreaterThan(80);
    expect(Math.max(...later.map(e => e.day))).toBeLessThanOrEqual(250);
    const tests = s.checks.filter(c => c.day > 126);
    expect(tests).toHaveLength(62);                               // every fourth day, morning and evening, days 128 to 248
    expect(tests.every(c => c.origin === 'nasa-replay')).toBe(true);
  }
});
it('is quiet: no cards, no notes to Earth and no diary match after the story', () => {
  for (const b of ['A', 'B'] as const) {
    for (let w = 19; w <= 35; w++) expect(buildView(7 * w, [], b).raisedCards, `${b} week ${w}`).toEqual([]);
    const v = buildView(250, [], b);
    expect(v.openCards).toEqual([]);
    expect(v.shareLog.filter(e => e.day > 126)).toEqual([]);
    expect(buildScenario(b).entries.filter(e => e.day > 126).some(entryMatches)).toBe(false);
    expect(v.lineCrossed).toBeNull();
  }
});
it('simulated body measures stay inside their lines; only replayed real tests may cross', () => {
  for (const b of ['A', 'B'] as const) {
    const s = buildScenario(b);
    const crossed = new Set<string>();
    for (let d = 133; d <= 250; d++) for (const r of bodyReadings(s, s.checks.filter(c => c.day <= d), d)) if (r.status === 'sustained') crossed.add(r.def.id);
    expect([...crossed].filter(id => id !== 'speed'), b).toEqual([]);
  }
});
it('branch B recovers: sleep is back near the usual by week 21', () => {
  const B = buildScenario('B');
  const mean = (w: number) => B.days.filter(d => d.week === w).reduce((a, d) => a + d.sleepMin, 0) / 7;
  expect(mean(18)).toBeLessThan(360);
  expect(mean(21)).toBeGreaterThan(410);
  expect(mean(30)).toBeGreaterThan(425);
});

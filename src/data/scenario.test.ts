import { buildScenario } from './scenario';
import { params } from './params';
import { weekOf } from '../lib/time';
import type { Scenario } from '../types';

const A = buildScenario('A'), B = buildScenario('B');
const segs = (s: Scenario, w: number) => s.entries.flatMap(e => e.segments).filter(x => weekOf(x.day) === w);
it('has 126 days and is deterministic', () => {
  expect(A.days).toHaveLength(126);
  expect(JSON.stringify(buildScenario('A'))).toBe(JSON.stringify(A));
});
it('matches the weekly tables exactly', () => {
  for (const row of params.weeks) for (const g of params.groupsOrder)
    expect(segs(A, row.week).filter(s => s.group === g).length, `w${row.week} ${g}`).toBe(row.segments[g]);
  const home16 = segs(A, 16).filter(s => s.group === 'home');
  expect(home16.filter(s => s.felt === 'hard')).toHaveLength(5);
});
it('reproduces the story numbers', () => {
  const d112 = A.days[111];
  expect([d112.onsetMin, d112.sleepMin, d112.wakeMin]).toEqual([42, 358, 400]);
  expect(A.days.slice(109, 112).every(d => d.onsetMin >= 0)).toBe(true);
  expect(A.days[108].onsetMin).toBeLessThan(0);
  const journalDays = new Set(A.entries.filter(e => e.day >= 57 && e.day <= 112).map(e => e.day));
  expect(journalDays.size).toBe(41);
  expect(A.entries.some(e => e.day === 112)).toBe(false);
  expect(A.entries.flatMap(e => e.segments).some(s => s.text.startsWith('I keep doing the math'))).toBe(true);
});
it('has checks every fourth day and the day-112 morning result', () => {
  expect(A.checks.filter(c => c.day === 8)).toHaveLength(2);
  const c = A.checks.find(c => c.day === 112 && c.slot === 'am')!;
  expect([c.meanRtMs, c.lapses, c.origin]).toEqual([281, 4, 'sim']);
  const first = A.checks[0];
  expect([first.day, first.slot, first.meanRtMs, first.origin]).toEqual([4, 'am', 193, 'nasa-replay']);
  expect(A.checks.filter(c => c.day <= 108 && c.origin === 'nasa-replay')).toHaveLength(54);
  expect(A.checks.some(c => c.day === 112 && c.slot === 'pm')).toBe(false);
});
it('branches after day 112', () => {
  expect(JSON.stringify(A.days.slice(0, 112))).toBe(JSON.stringify(B.days.slice(0, 112)));
  expect(A.days[113].onsetMin).toBeLessThan(0);
  expect(B.days[113].onsetMin).toBeGreaterThanOrEqual(0);
});
it('day 112 blocks and marks', () => {
  const d = A.days[111];
  expect(d.blocks.map(b => b.label)).toEqual(['Sleep', 'Suit prep', 'Experiments', 'Gym', 'Call with Sam']);
  expect(d.marks).toEqual([{ min: 647, blockLabel: 'Suit prep' }, { min: 1274, blockLabel: 'Call with Sam' }]);
  expect(A.days[112].blocks.some(b => b.safetyCritical && b.label === 'EVA prep review')).toBe(true);
});

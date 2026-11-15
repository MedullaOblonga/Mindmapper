import { buildScenario } from '../data/scenario';
import { weekShares, feltCounts } from './shares';
const A = buildScenario('A');
it('family share goes from 10% to 33%', () => {
  const pct = (w: number) => weekShares(A.entries, w)!.find(x => x.group === 'home')!.pct;
  expect(pct(9)).toBe(10); expect(pct(16)).toBe(33);
  expect(weekShares(A.entries, 16)!.reduce((a, x) => a + x.pct, 0)).toBe(100);
  expect(weekShares([], 16)).toBeNull();
});
it('counts how family felt', () => {
  expect(feltCounts(A.entries, 'home', 57, 70)).toEqual({ count: 4, good: 4, mixed: 0, hard: 0 });
  expect(feltCounts(A.entries, 'home', 99, 112)).toEqual({ count: 15, good: 4, mixed: 2, hard: 9 });
});

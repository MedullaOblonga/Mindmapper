import { usualForWeek, roundTo100, median } from './stats';
it('usualForWeek follows DESIGN §8.1', () => {
  const d = { 3: 5, 4: 5, 5: 5, 6: 2, 7: 5, 8: 5, 9: 9, 16: 1 };
  expect(usualForWeek(d, 5)).toBeNull();
  expect(usualForWeek(d, 6)).toBe(5);
  expect(usualForWeek(d, 9)).toBe(5);
  expect(usualForWeek(d, 16)).toBe(5);
});
it('roundTo100 sums to 100', () => {
  expect(roundTo100([8, 8, 3, 3, 1, 1, 0]).reduce((a, b) => a + b)).toBe(100);
  expect(roundTo100([0, 0, 0])).toEqual([0, 0, 0]);
});
it('median of empty is NaN', () => { expect(median([])).toBeNaN(); expect(median([1, 3])).toBe(2); });

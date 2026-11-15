import { stardate, earthDelayMin, fmtDelay } from './stardate';
it('stardate grows with the mission and within a day', () => {
  expect(stardate(1, 0)).toBe('47000.0');
  expect(stardate(112, 19 * 60 + 42)).toBe('47306.1');
  expect(Number(stardate(113, 0))).toBeGreaterThan(Number(stardate(112, 1439)) - 0.01);
});
it('earth delay follows the trajectory', () => {
  expect(earthDelayMin(112)).toBeCloseTo(18, 5);
  expect(earthDelayMin(12)).toBeLessThan(earthDelayMin(42));
  expect(earthDelayMin(42)).toBeLessThan(earthDelayMin(98));
  expect(earthDelayMin(98, 600)).toBeGreaterThan(earthDelayMin(98, 0));
  expect(fmtDelay(18)).toBe('18 min 00 s'); expect(fmtDelay(0.5)).toBe('30 s');
});

import { stardate } from './stardate';
it('stardate grows with the mission and within a day', () => {
  expect(stardate(1, 0)).toBe('47000.0');
  expect(stardate(112, 19 * 60 + 42)).toBe('47306.1');
  expect(Number(stardate(113, 0))).toBeGreaterThan(Number(stardate(112, 1439)) - 0.01);
});

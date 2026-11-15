import { delayMin, delayWords, fmtDelay, TRANSFER_DAYS } from './delay';

it('starts at zero and grows along the outbound leg', () => {
  expect(delayMin(0)).toBeCloseTo(0, 5);
  for (let d = 1; d <= 126; d++) expect(delayMin(d)).toBeGreaterThan(delayMin(d - 1));
});
it('gives the demo-day values', () => {
  expect(delayMin(112)).toBeCloseTo(2.59, 1);
  expect(fmtDelay(delayMin(112))).toBe('2 min 35 s');
  expect(delayWords(delayMin(112))).toBe('3 minutes');
});
it('is continuous at arrival and stays inside the Earth to Mars range', () => {
  expect(Math.abs(delayMin(TRANSFER_DAYS) - delayMin(TRANSFER_DAYS + 0.01))).toBeLessThan(0.01);
  for (let d = 0; d <= 520; d += 5) expect(delayMin(d)).toBeLessThan(22.5);
});
it('formats short delays in seconds', () => {
  expect(fmtDelay(0.5)).toBe('30 s');
  expect(delayWords(0.5)).toBe('30 seconds');
  expect(delayWords(1.2)).toBe('1 minute');
});

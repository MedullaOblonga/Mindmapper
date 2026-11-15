import { AU_KM, delayMin, delayWords, distanceAu, distanceMillionKm, fmtDelay, TRANSFER_DAYS } from './delay';

it('starts at zero and grows on every day of the demo', () => {
  expect(distanceAu(0)).toBeCloseTo(0, 6);
  expect(delayMin(0)).toBeCloseTo(0, 5);
  for (let d = 1; d <= 250; d++) expect(delayMin(d)).toBeGreaterThan(delayMin(d - 1));
});
it('the delay is the distance from Earth on that mission day, at the speed of light', () => {
  for (const d of [12, 42, 98, 112, 203, 250]) {
    const km = distanceAu(d) * AU_KM;
    expect(delayMin(d)).toBeCloseTo(km / 299_792.458 / 60, 3);
  }
});
it('matches the geometry at arrival: Earth has run 75 degrees ahead of Mars', () => {
  // Earth moves 0.9856 degrees a day for 258.87 days = 255.1 degrees; the spacecraft is at 180 degrees, 1.5237 au out.
  const sep = (255.14 - 180) * Math.PI / 180;
  const expected = Math.sqrt(1 + 1.5237 ** 2 - 2 * 1.5237 * Math.cos(sep));
  expect(distanceAu(TRANSFER_DAYS)).toBeCloseTo(expected, 2);
  expect(distanceAu(TRANSFER_DAYS)).toBeCloseTo(1.593, 2);
  expect(delayMin(TRANSFER_DAYS)).toBeCloseTo(13.25, 1);
});
it('gives the demo-day values with no offset', () => {
  expect(fmtDelay(delayMin(12))).toBe('10 s');
  expect(delayMin(112)).toBeCloseTo(2.59, 1);
  expect(fmtDelay(delayMin(112))).toBe('2 min 35 s');
  expect(delayWords(delayMin(112))).toBe('3 minutes');
  expect(Math.round(distanceMillionKm(112))).toBe(47);
  expect(fmtDelay(delayMin(203))).toBe('8 min 58 s');
  expect(delayMin(250)).toBeCloseTo(12.62, 1);
  expect(Math.round(distanceMillionKm(250))).toBe(227);
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

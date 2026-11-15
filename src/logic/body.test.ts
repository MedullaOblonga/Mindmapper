import { buildScenario } from '../data/scenario';
import { MEASURES, NASA, bodyReadings, bodySeries, measure, readMeasure, usualOf, type Point } from './body';

const B = buildScenario('B');
const at = (day: number) => Object.fromEntries(bodyReadings(B, B.checks.filter(c => c.day <= day), day).map(r => [r.def.id, r]));

it('keeps only measured things', () => {
  const names = MEASURES.map(m => m.name.toLowerCase()).join(' ');
  expect(names).not.toMatch(/mood|stress|fatigue|cabin/);
  expect(MEASURES.map(m => m.id)).toContain('speed');
});
it('takes the reaction line from the NASA records', () => {
  expect(NASA.speedDrop).toBe(0.08);
  expect(NASA.people).toBe(28);
  expect(NASA.single).toBeLessThanOrEqual(0.06);
  expect(NASA.twoInRow).toBeLessThan(NASA.single);
  const speed = measure('speed');
  expect(speed.line).toEqual({ type: 'pct-usual', drop: 0.08 });
});
it('needs enough early readings before it has a usual', () => {
  const pts: Point[] = Array.from({ length: 40 }, (_, i) => ({ day: i + 1, v: 50 + (i % 3) }));
  expect(usualOf(pts, 20, 14)).toBeNull();
  expect(usualOf(pts, 40, 14)!.usual).toBe(51);
});
it('one reading outside is not a pattern; two tests in a row are', () => {
  const def = measure('speed');
  const base: Point[] = Array.from({ length: 12 }, (_, i) => ({ day: 16 + i * 4, v: 4.5 }));
  const once = readMeasure(def, [...base, { day: 64, v: 4.0 }], 64);
  expect(once.status).toBe('once');
  const twice = readMeasure(def, [...base, { day: 64, v: 4.0 }, { day: 64.5, v: 4.1 }], 64);
  expect(twice.status).toBe('sustained');
  expect(twice.lo).toBeCloseTo(4.5 * 0.92, 5);
  const fine = readMeasure(def, [...base, { day: 64, v: 4.2 }, { day: 64.5, v: 4.4 }], 64);
  expect(fine.status).toBe('inside');
});
it('day 112: short sleep and two slow tests are sustained; one slow test alone is not', () => {
  const r = at(112);
  expect(r.sleep.status).toBe('sustained');
  expect(r.sleep.statusText).toBe('Outside the NASA line on 3 of the last 5 nights');
  expect(r.speed.status).toBe('sustained');      // day 108 evening and day 112 morning, both 8% or more below usual
  expect(at(110).speed.status).toBe('once');
  expect(r.exercise.status).toBe('inside');
  expect(r.co2sleep.status).toBe('inside');
});
it('the simulated pocket shows in the sleep-period CO2 only', () => {
  const r = at(101);
  expect(r.co2sleep.status).toBe('sustained');
  expect(r.co2day.status).toBe('inside');
  expect(at(98).co2sleep.status).toBe('inside');
});
it('early days are still learning for lines that need a usual', () => {
  const r = at(10);
  expect(r.rhr.status).toBe('learning');
  expect(r.speed.status).toBe('learning');
  expect(r.sleep.status).not.toBe('learning');   // fixed NASA line needs no usual
});
it('series are deterministic and stop at today', () => {
  const a = bodySeries(B, B.checks, 60), b = bodySeries(B, B.checks, 60);
  expect(a).toEqual(b);
  for (const pts of Object.values(a)) expect(pts.every(p => p.day <= 60.5)).toBe(true);
  expect(a.mass[0]).toEqual({ day: 1, v: 74.2 });
});

import { buildScenario } from '../data/scenario';
import { ledgerForWeek } from './ledger';
const A = buildScenario('A');
it('ledger week 16 matches the design', () => {
  const L = ledgerForWeek(A, 16, { copingDone: 0, wristDinners: {} }, { countWristDinners: false, quietKeys: [], movedUsual: {} });
  const get = (k: string) => L.find(i => i.key === k)!;
  expect(get('sleep').sentence).toBe('5h 58m a night. Below your usual 7h 10m.');
  expect(get('dinners').sentence).toBe('1 this week. Below your usual 5.');
  expect(L.filter(i => i.far).map(i => i.key).sort()).toEqual(['callsMissed', 'callsSam', 'dinners', 'noisyNights', 'sleep', 'suitPrepLong']);
  expect(L.filter(i => i.away).map(i => i.key).sort()).toEqual(['callsMissed', 'callsSam', 'dinners', 'noisyNights', 'sleep', 'suitPrepLong']);
  expect(get('gym').away).toBe(false);
  const moved = ledgerForWeek(A, 17, { copingDone: 0, wristDinners: {} }, { countWristDinners: false, quietKeys: [], movedUsual: { dinners: { fromWeek: 17, value: 3 } } }).find(i => i.key === 'dinners')!;
  expect([moved.usual, moved.earlyUsual]).toEqual([3, 5]);
});
it('week 6 dinners depend on the wrist flag', () => {
  const f = (b: boolean) => ledgerForWeek(A, 6, { copingDone: 0, wristDinners: {} }, { countWristDinners: b, quietKeys: [], movedUsual: {} }).find(i => i.key === 'dinners')!;
  expect([f(false).value, f(false).far]).toEqual([2, true]); expect([f(true).value, f(true).far]).toEqual([5, false]);
});

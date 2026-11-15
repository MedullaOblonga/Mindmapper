import { buildScenario } from '../data/scenario';
import { pastMidnightRun, signStatuses } from './signs';
const A = buildScenario('A');
it('midnight sign', () => {
  expect(pastMidnightRun(A.days, 112)).toEqual({ run: 3, eveningDays: [109, 110, 111] });
  expect(pastMidnightRun(buildScenario('B').days, 114).run).toBe(5);
  const st = signStatuses(A, 112);
  expect(st.find(x => x.id === 'midnight')!.text).toBe('Showed up: 3 nights in a row');
  expect(st.find(x => x.id === 'short')!.status).toBe('unknown');
  expect(st.find(x => x.id === 'light')!.text).toBe('Showed up on 2 nights');
});

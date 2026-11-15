import { scoreTrials, nextWaitMs } from './pvt';
it('scores per PVT-B rules', () => {
  const t = [240, 260, 355, 500, 90].map(rt => ({ rtMs: rt, falseStart: rt < 100, timedOut: false }));
  const s = scoreTrials([...t, { rtMs: null, falseStart: false, timedOut: true }], 180, 112, 'pm');
  expect([s.trials, s.lapses, s.falseStarts, s.counts]).toEqual([4, 3, 1, true]);
  expect(Math.round(s.meanRtMs)).toBe(339);
  expect(scoreTrials(t, 30, 112, 'pm').counts).toBe(false);
});
it('waits 1 to 4 seconds', () => {
  expect(nextWaitMs(() => 0)).toBe(1000); expect(nextWaitMs(() => 0.9999999)).toBe(4000);
});
it('empty run does not produce NaN', () => {
  const s = scoreTrials([], 30, 112, 'am');
  expect(Number.isNaN(s.meanRtMs)).toBe(false); expect(s.trials).toBe(0);
});

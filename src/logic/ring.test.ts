import { arcPath, dayPartSentence, withFreeTime, bedtimeOf } from './ring';
import { params } from '../data/params';
import { buildScenario } from '../data/scenario';

it('draws arcs clockwise from midnight at the top', () => {
  expect(arcPath(0, 360, 100, 200, 200)).toBe('M 200 100 A 100 100 0 0 1 300 200');
  expect(arcPath(-60, 400, 100, 0, 0)).toMatch(/A 100 100 0 0 1/);
  expect(arcPath(480, 1320, 100, 0, 0)).toMatch(/0 1 1 /);
});
it('names the hardest part of the day', () => {
  expect(dayPartSentence(params.dayPartFelt as never)).toBe('Evenings felt hard on 5 of the last 7 days. Mornings mostly did not.');
  expect(dayPartSentence({ morning: ['good'], afternoon: ['good'], evening: ['hard'] })).toBe('No part of the day stands out this week.');
});
it('fills the gaps in the mission plan with free time', () => {
  const s = buildScenario('A'), d = s.days[111];
  const all = withFreeTime(d.blocks, d.wakeMin, bedtimeOf(s, 112), 112);
  const free = all.filter(b => b.kind === 'free').map(b => [b.startMin, b.endMin]);
  expect(free).toContainEqual([840, 960]);       // 14:00 to 16:00
  expect(all.map(b => b.label)).toEqual(['Sleep', 'Free time', 'Suit prep', 'Lunch', 'Free time', 'Experiments', 'Free time', 'Gym', 'Call with Sam', 'Free time']);
});

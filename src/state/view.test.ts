import { buildView } from './view';
import type { AppEvent } from './events';
import type { Branch } from '../types';
const v = (day: number, ev: AppEvent[] = [], o: Branch | null = null) => buildView(day, ev, o);
it('story chapters', () => {
  expect(v(12).openCards).toEqual([]);
  expect(v(42).openCards.map(c => c.title)).toEqual(['Fewer dinners with crew']);
  expect(v(98).openCards).toEqual([]);
  expect(v(98).resolutions[0]).toMatchObject({ day: 42, status: 'not-right', effect: 'It now counts dinners you log from your wrist too.' });
  expect(v(112).openCards.map(c => c.kind)).toEqual(['topic-shift', 'own-sign', 'check']);
  expect(v(112).resolutions.map(r => r.day)).toEqual([105, 42]);
});
it('never shows the future', () => {
  const act: AppEvent = { id: 'e1', day: 112, type: 'resolve', cardId: v(112).openCards[0].id, status: 'acted', title: 't', choice: 'c', effect: 'e', kind: 'topic-shift', subject: 'home' };
  expect(v(112, [act]).openCards).toHaveLength(2);
  expect(v(98, [act]).resolutions.some(r => r.day === 112)).toBe(false);
  expect(v(42, [act]).openCards).toHaveLength(1);
  expect(v(112, [act]).resolutions[0].day).toBe(112);
});
it('branches', () => {
  expect(v(119).branch).toBe('B');
  expect(v(119).lineCrossed).toMatchObject({ day: 114 });
  expect(v(119).shareLog[0]).toMatchObject({ day: 114, auto: true });
  expect(v(113).lineCrossed).toBeNull();
  expect(v(119, [], 'A').lineCrossed).toBeNull();
});
it('a new usual stops the same card coming back', () => {
  const card = v(112).openCards[0];
  const nu: AppEvent = { id: 'e2', day: 112, type: 'resolve', cardId: card.id, status: 'not-right', reason: 'new-usual', title: card.title, choice: 'That’s not right', effect: 'x', kind: 'topic-shift', subject: 'home' };
  expect(v(112, [nu]).openCards.map(c => c.kind)).toEqual(['own-sign', 'check']);
  expect(v(126, [nu]).openCards.some(c => c.kind === 'topic-shift')).toBe(false);
  expect(v(126, [nu]).resolutions.some(r => r.status === 'not-right' && r.day === 112)).toBe(true);
});
it('day 42 flag shows on the ledger only after the correction', () => {
  expect(v(42).flags.countWristDinners).toBe(false);
  expect(v(43).flags.countWristDinners).toBe(true);
});

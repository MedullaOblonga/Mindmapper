import { buildScenario } from '../data/scenario';
import { candidateCards, ratioWords, type CardContext } from './cards';
const A = buildScenario('A');
const ctx = (over: Partial<CardContext> = {}): CardContext => ({ entries: A.entries, checks: A.checks,
  flags: { countWristDinners: false, quietKeys: [], movedUsual: {} }, quiet: [], movedUsual: {}, ...over });
it('day 42: one ledger card about dinners', () => {
  const c = candidateCards(A, 6, ctx());
  expect(c.map(x => x.kind)).toEqual(['ledger']);
  expect(c[0].statement).toBe('Dinners with crew: 2 this week. Your usual is 5.');
  expect(c[0].title).toBe('Fewer dinners with crew');
});
it('weeks 7 to 14 are quiet', () => { for (let w = 7; w <= 14; w++) expect(candidateCards(A, w, ctx()), `w${w}`).toEqual([]); });
it('day 105: one ledger card, two items', () => {
  const c = candidateCards(A, 15, ctx());
  expect(c).toHaveLength(1);
  expect(c[0].title).toBe('Fewer dinners with crew and more long suit-prep days');
});
it('day 112: family, own sign, check come first, in that order', () => {
  const c = candidateCards(A, 16, ctx());
  expect(c.slice(0, 3).map(x => [x.kind, x.subject])).toEqual([['topic-shift', 'home'], ['own-sign', 'midnight'], ['check', 'am']]);
  expect(c[0].statement).toBe('Family has come up nearly four times as often as in your first two weeks. More of it felt difficult.');
  expect(c[0].evidence).toMatchObject({ type: 'marks', rows: [{ label: 'Days 57 to 70', count: 4, good: 4 }, { label: 'Days 99 to 112', count: 15, hard: 9 }] });
  expect(c[0].actions.map(a => a.label)).toEqual(['Write about it', 'Book a call window', 'Talk to someone']);
  expect(c[1].statement).toContain('It showed up on days 109, 110 and 111.');
  expect(c[2].actions[0].label).toBe('Ask Ana to second-check the EVA prep review');
  expect(c.some(x => x.kind === 'rhythm')).toBe(false);
});
it('a bigger share without harder entries makes no card', () => {
  const softened = A.entries.map(e => ({ ...e, segments: e.segments.map(s => s.group === 'home' ? { ...s, felt: 'good' as const } : s) }));
  expect(candidateCards(A, 16, ctx({ entries: softened })).some(x => x.kind === 'topic-shift')).toBe(false);
});
it('quiet periods and ratio words', () => {
  expect(candidateCards(A, 16, ctx({ quiet: [{ kind: 'topic-shift', subject: 'home', untilDay: 130 }] }))[0].kind).toBe('own-sign');
  expect(ratioWords(3.75)).toBe('nearly four times'); expect(ratioWords(2.1)).toBe('about twice'); expect(ratioWords(1.2)).toBeNull();
});
it('weeks 1 and 2 never produce cards', () => { expect(candidateCards(A, 1, ctx())).toEqual([]); expect(candidateCards(A, 2, ctx())).toEqual([]); });

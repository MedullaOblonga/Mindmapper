import { buildJournalScenario, JOURNALS, lastDayOf, openingDayOf } from './journalScenario';
import { buildView } from '../state/view';
import { createStoreForTest, STORAGE_KEY } from '../state/store';
import { topicRises } from '../logic/scan';
import { entryMatches } from '../logic/safety';

describe.each(['williams', 'anderson'] as const)('%s journal replay', src => {
  const s = buildJournalScenario(src), j = JOURNALS[src];
  it('replays only the in-flight entries, on their mission days, as real NASA text', () => {
    const flown = j.entries.filter(e => e.day !== null);
    expect(s.entries.map(e => e.day)).toEqual(flown.map(e => e.day));
    expect(s.entries.every(e => e.origin === 'nasa-journal' && e.segments.every(x => x.origin === 'nasa-journal'))).toBe(true);
    const text = s.entries.flatMap(e => e.segments.map(x => x.text)).join(' ');
    expect(text).not.toMatch(/Credit: NASA/);
    expect(s.days).toHaveLength(lastDayOf(src));
    expect(s.checks.every(c => c.origin === 'nasa-replay')).toBe(true);
  });
  it('has none of the demo story in it: no scripted cards, notes to Earth or safety matches', () => {
    for (let w = 3; w <= Math.ceil(openingDayOf(src) / 7); w++) {
      const v = buildView(7 * w, [], null, src);
      expect(v.raisedCards.filter(c => c.kind !== 'topic-shift'), `week ${w}`).toEqual([]);
    }
    expect(buildView(openingDayOf(src), [], null, src).shareLog).toEqual([]);
    expect(s.entries.some(entryMatches)).toBe(false);
  });
});

it('Williams: crew comes up more in weeks 17 to 19, but it did not feel harder, so the tool stays quiet', () => {
  const s = buildJournalScenario('williams');
  const r = topicRises(s.entries, 26);
  expect(r.map(x => [x.group, x.fromWeek, x.carded])).toEqual([['crew', 17, false]]);
});
it('Anderson: entries a week or two apart leave gaps, so no three-week rise can form', () => {
  expect(topicRises(buildJournalScenario('anderson').entries, 22)).toEqual([]);
});

it('switching simulation keeps each one separate, and switching back restores the demo as it was', () => {
  localStorage.clear();
  const st = createStoreForTest();
  st.getState().setDay(98);
  st.getState().add({ type: 'dismiss', what: 'tonight' });
  st.getState().setSource('williams');
  expect(st.getState().source).toBe('williams');
  expect(st.getState().day).toBe(openingDayOf('williams'));
  expect(st.getState().events).toEqual([]);
  st.getState().setDay(500);
  expect(st.getState().day).toBe(lastDayOf('williams'));
  st.getState().setSource('demo');
  expect(st.getState().day).toBe(98);
  expect(st.getState().events).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).day).toBe(98);   // the demo keeps its original key
  expect(createStoreForTest().getState().source).toBe('demo');           // and is what reopens
});

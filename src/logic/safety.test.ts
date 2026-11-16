import { buildScenario } from '../data/scenario';
import { buildView } from '../state/view';
import { entryMatches, matchesSafetyLine, recentSafetyNotes, reliefSteps } from './safety';
import { FLIGHT_SURGEON, surgeonLog } from './lines';
import { tagEntry } from './tagger';
import type { AppEvent } from '../state/events';

it('matches phrases that point to risk to self or others, and leaves ordinary hard days alone', () => {
  for (const t of ['They would be better off without me.', 'I can’t see the point in going on like this.', 'Some nights I do not want to wake up.', 'I could hurt someone.'])
    expect(matchesSafetyLine(t), t).toBe(true);
  for (const t of ['Third long suit-prep day this week.', 'Wrote Sam three pages. Deleted two.', 'This checklist is killing me, in the usual way.', 'No point in redoing the filter swap today.'])
    expect(matchesSafetyLine(t), t).toBe(false);
});
it('only the day-98 sample entry matches, in both story branches', () => {
  for (const b of ['A', 'B'] as const) expect(buildScenario(b).entries.filter(entryMatches).map(e => e.day)).toEqual([98]);
});
it('day 98: the note goes to the medical officer and the flight surgeon, without diary text', () => {
  expect(buildView(97, [], null).shareLog).toEqual([]);
  const v = buildView(98, [], null);
  expect(v.shareLog.map(e => e.to).sort()).toEqual(['Crew medical officer (Mei)', FLIGHT_SURGEON]);
  const note = surgeonLog(v.shareLog)[0];
  expect(note).toMatchObject({ day: 98, auto: true, kind: 'line', ruleId: 'risk', fixed: true, source: 'entry', concern: 'self' });
  expect(note.text).toBe('Safety note agreed before launch: a diary entry on day 98 matched the safety line for thoughts of self-harm. The crew medical officer has been told. No diary content is included.');
  const words = v.entries.find(e => e.day === 98)!.segments.map(s => s.text);
  for (const w of words) expect(v.shareLog.map(e => e.text).join(' ')).not.toContain(w);
  expect(v.lineCrossed).toMatchObject({ day: 98, fixed: true });
});
it('the notice window is 7 days', () => {
  expect(recentSafetyNotes(buildView(104, [], null).shareLog, 104)).toHaveLength(1);
  expect(recentSafetyNotes(buildView(105, [], null).shareLog, 105)).toHaveLength(0);
});
it('an entry the astronaut writes is checked the same way', () => {
  const entry = { id: 'u50', day: 50, origin: 'user' as const, segments: tagEntry('Long day. I wish I were dead.', 50, 'u50') };
  const v = buildView(50, [{ id: 'e1', day: 50, type: 'entry', entry } as AppEvent], null);
  expect(surgeonLog(v.shareLog)).toHaveLength(1);
  expect(surgeonLog(v.shareLog)[0].text).not.toContain('wish');
});
it('relief comes from the plan written before launch', () => {
  const steps = reliefSteps(buildScenario('B').profile);
  expect(steps.map(s => s.id)).toEqual(['person', 'own', 'protect']);
  expect(steps[0].text).toMatch(/^Mei, the crew medical officer, comes to talk now/);
  expect(steps[1].text).toContain('greenhouse time, 15 minutes');
});

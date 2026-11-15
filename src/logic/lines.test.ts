import { buildScenario } from '../data/scenario';
import { buildView } from '../state/view';
import { co2Runs, lineNotes, surgeonLog, FLIGHT_SURGEON } from './lines';
import type { AppEvent } from '../state/events';

const B = buildScenario('B');
const ev = (e: Record<string, unknown>, day: number, id: string) => ({ ...e, day, id }) as AppEvent;

it('the collar CO2 line crosses once, on the second night of the simulated pocket', () => {
  expect(co2Runs(B, 102).slice(98, 103)).toEqual([0, 1, 2, 3, 0]);
  const notes = lineNotes(B, 126, [], []).log.filter(e => e.ruleId === 'co2collar');
  expect(notes).toHaveLength(1);
  expect(notes[0]).toMatchObject({ day: 100, to: FLIGHT_SURGEON, auto: true, kind: 'line' });
  expect(notes[0].text).toContain('3.0 mmHg for 2 days or nights in a row');
});
it('the CO2 line is negotiable: a higher threshold moves the crossing and the wording', () => {
  const change = ev({ type: 'rule-change', ruleId: 'co2collar', atLeast: 3, text: 'Rule changed' }, 50, 'r1');
  const notes = lineNotes(B, 126, [change], []).log.filter(e => e.ruleId === 'co2collar');
  expect(notes).toHaveLength(1);
  expect(notes[0].day).toBe(101);
  expect(notes[0].text).toContain('for 3 days or nights in a row');
});
it('the fixed line sends only when a risk is reported, to the medical officer and the flight surgeon', () => {
  expect(lineNotes(B, 126, [], []).log.some(e => e.ruleId === 'risk')).toBe(false);
  const { log, latest } = lineNotes(B, 60, [ev({ type: 'safety', ruleId: 'risk' }, 58, 's1')], []);
  const risk = log.filter(e => e.ruleId === 'risk');
  expect(risk.map(e => e.to).sort()).toEqual(['Crew medical officer (Mei)', FLIGHT_SURGEON]);
  expect(latest).toMatchObject({ day: 58, ruleId: 'risk', fixed: true });
});
it('the surgeon log holds only what was addressed to the flight surgeon', () => {
  const events = [
    ev({ type: 'share', to: 'Ana', text: 'For Ana only.' }, 110, 'a'),
    ev({ type: 'share', to: 'Crew medical officer (Mei)', text: 'For Mei only.' }, 110, 'b'),
    ev({ type: 'share', to: 'Ground psychologist', text: 'For the psychologist only.' }, 111, 'c'),
    ev({ type: 'share', to: FLIGHT_SURGEON, text: 'For the flight surgeon.' }, 111, 'd'),
  ];
  const v = buildView(112, events, null);
  const s = surgeonLog(v.shareLog);
  expect(s.every(e => e.to === FLIGHT_SURGEON)).toBe(true);
  expect(s.map(e => e.text)).toContain('For the flight surgeon.');
  expect(s.map(e => e.text).join(' ')).not.toMatch(/For (Ana|Mei|the psychologist) only/);
});

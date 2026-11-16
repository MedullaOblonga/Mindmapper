import { buildScenario } from '../data/scenario';
import { buildView } from '../state/view';
import { alertsUpTo, sbarDays, sbarFor } from './sbar';
import { bodyReadings } from './body';
import { surgeonLog } from './lines';

const day = (d: number, b: 'A' | 'B' = 'B') => {
  const v = buildView(d, [], b);
  const alerts = alertsUpTo(v.shareLog, v.scenario.profile.shareRules, d);
  return { v, alerts, sbar: sbarFor(d, bodyReadings(v.scenario, v.checks, d), alerts, surgeonLog(v.shareLog).filter(e => e.kind === 'message')) };
};

it('alerts are only lines that sent a note, with short labels', () => {
  expect(day(60).alerts).toEqual([]);
  expect(day(98).alerts.map(a => a.label)).toEqual(['Thoughts of self-harm']);
  expect(day(119).alerts.map(a => [a.day, a.label])).toEqual([
    [114, 'Sleep past midnight, 5 nights running'], [100, 'Collar CO2 at or above 3.0 mmHg, 2 in a row'], [98, 'Thoughts of self-harm']]);
});
it('levels: quiet, pattern, alert', () => {
  expect(day(60).sbar).toMatchObject({ level: 'ok', situation: 'All measures inside their lines. No alerts.', assessment: 'On the usual pattern.', recommendation: ['No action. Routine review.'] });
  expect(day(98).sbar.level).toBe('alert');
  expect(day(112).sbar.level).toBe('look');
  expect(day(203).sbar.level).toBe('ok');
});
it('an alert stays active for 7 days, then the overview goes back to the measures', () => {
  expect(day(104).sbar.level).toBe('alert');
  expect(day(105).sbar.level).not.toBe('alert');
  expect(day(101).sbar.situation).toContain('Collar CO2 at or above 3.0 mmHg, 2 in a row (day 100).');
});
it('uses nothing from the diary', () => {
  const words = buildScenario('B').entries.flatMap(e => e.segments).map(s => s.text);
  for (const d of [98, 112, 119]) { const t = JSON.stringify(day(d).sbar); for (const w of words) expect(t).not.toContain(w); }
});
it('gives one overview per day for the last 14 days', () => {
  const v = buildView(112, [], 'B');
  const days = sbarDays(v.scenario, v.checks, v.shareLog, 112);
  expect(days.map(d => d.day)).toEqual(Array.from({ length: 14 }, (_, i) => 99 + i));
  expect(sbarDays(v.scenario, v.checks, v.shareLog, 5).map(d => d.day)).toEqual([1, 2, 3, 4, 5]);
});

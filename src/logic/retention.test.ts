import { buildView } from '../state/view';
import { pressLook, fewerPressesText } from './presses';
import { recordedToday } from './recorded';
import { resurface } from './resurface';
import type { AppEvent } from '../state/events';

it('presses fade in the quiet weeks and are read as fewer presses, not fewer lows', () => {
  for (const b of ['A', 'B'] as const) {
    const early = pressLook(buildView(70, [], b));
    expect(early.fewerOverall).toBe(false);
    const late = pressLook(buildView(220, [], b));
    expect(late.usual!.total).toBe(21);
    expect(late.perWeek.total).toBeLessThanOrEqual(0.6 * 21);
    expect(late.fewerOverall).toBe(true);
    expect(fewerPressesText(late)).toMatch(/pressing less overall/);
    expect(Math.abs(late.lowShare! - late.usualLowShare!)).toBeLessThan(0.2);   // the mix is about the same
  }
});
it('more lows with steady presses is not called fewer presses (the story weeks)', () => {
  const p = pressLook(buildView(112, [], 'A'));
  expect(p.fewerOverall).toBe(false);
  expect(fewerPressesText(p)).toBeNull();
});
it('a day counts as recorded by the walk-through alone', () => {
  const v = buildView(112, [], 'A');
  expect(recordedToday(v)).toBeNull();
  const ev = { id: 'w1', day: 112, type: 'walkthrough' } as AppEvent;
  expect(recordedToday(buildView(112, [ev], 'A'))).toBe('walkthrough');
  const taps = v.blocksToday.filter(x => x.kind !== 'sleep' && x.kind !== 'free')
    .map((x, i) => ({ id: `f${i}`, day: 112, type: 'block-felt', blockId: x.id, felt: 'good' }) as AppEvent);
  expect(recordedToday(buildView(112, taps, 'A'))).toBe('walkthrough');
  expect(recordedToday(buildView(112, taps.slice(1), 'A'))).toBeNull();
});
it('brings back a sentence from at least four weeks ago, from the demo diary', () => {
  for (const day of [60, 98, 112, 200, 250]) {
    const v = buildView(day, [], 'A');
    const r = resurface(v)!;
    expect(r, `day ${day}`).not.toBeNull();
    expect(r.seg.day).toBeLessThanOrEqual(day - 28);
    expect(v.entries.some(e => e.segments.some(s => s.text === r.seg.text))).toBe(true);
  }
  expect(resurface(buildView(20, [], 'A'))).toBeNull();
});

import { useNavigate } from 'react-router-dom';
import { useClock } from '../../state/clock';
import type { View } from '../../state/view';

export const EVENING_MIN = 19 * 60;

/** True in the evening when today's diary entry is not written and the astronaut has not said "Not tonight". */
export function entryDue(v: View, clockMin: number): boolean {
  const dismissed = v.events.some(e => e.type === 'dismiss' && e.what === 'tonight' && e.day === v.day);
  return clockMin >= EVENING_MIN && !v.entryToday && !dismissed;
}

/** A light along the top edge of the screen that pulses until tonight's entry is written. */
export function BedtimeLight({ v }: { v: View }) {
  const clock = useClock(15000);
  if (!entryDue(v, clock)) return null;
  return <div className="bedlight" aria-hidden="true"><i className="bedlight-glow" /></div>;
}

export function EntryDueChip({ v }: { v: View }) {
  const clock = useClock(15000);
  const nav = useNavigate();
  if (!entryDue(v, clock)) return null;
  return (
    <span role="status">
      <button className="bedlight-chip" onClick={() => nav('/journal', { state: { focus: true } })}>
        <span className="bedlight-dot" aria-hidden="true" />Tonight’s entry is not written yet<span className="bedlight-go">Write now</span>
      </button>
    </span>
  );
}

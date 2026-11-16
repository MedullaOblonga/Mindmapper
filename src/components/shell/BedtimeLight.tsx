import { useNavigate } from 'react-router-dom';
import { useClock } from '../../state/clock';
import type { View } from '../../state/view';
import { recordedToday } from '../../logic/recorded';

export const EVENING_MIN = 19 * 60;

/** True in the evening when today is not recorded (no entry and no walk-through) and the astronaut has not said "Not tonight". */
export function entryDue(v: View, clockMin: number): boolean {
  const dismissed = v.events.some(e => e.type === 'dismiss' && e.what === 'tonight' && e.day === v.day);
  return clockMin >= EVENING_MIN && !recordedToday(v) && !dismissed;
}

/** A light along the top edge of the screen that pulses until today is recorded. */
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
      <button className="bedlight-chip" onClick={() => nav('/journal')}>
        <span className="bedlight-dot" aria-hidden="true" />Today is not recorded yet<span className="bedlight-go">Walk through it</span>
      </button>
    </span>
  );
}

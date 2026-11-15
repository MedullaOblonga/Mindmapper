import { Lock, Radio, Stethoscope } from 'lucide-react';
import type { Viewer } from '../../state/store';
import { MISSION_LENGTH } from '../../config';
import { useClock } from '../../state/clock';
import { stardate } from '../../lib/stardate';
import { delayMin, distanceMillionKm, fmtDelay } from '../../lib/delay';

export function TopBar({ day, shared, onOpenLog, due, viewer = 'astronaut' }: { day: number; shared: number; onOpenLog?: () => void; due?: React.ReactNode; viewer?: Viewer }) {
  const clock = useClock(1000);
  const pct = Math.round((day / MISSION_LENGTH) * 1000) / 10;
  const now = day + clock / 1440;
  const delay = delayMin(now);   // light time for the distance from Earth on this mission day
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="t-label num" title={`Mission day ${day} of ${MISSION_LENGTH}`}>{`STARDATE ${stardate(day, clock)}`}</span>
        <div className="mission-meter" role="img" aria-label={`Mission day ${day} of ${MISSION_LENGTH}, ${pct} percent complete`}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="t-label num topbar-delay" title={`One-way light time. On mission day ${day} the spacecraft is about ${Math.round(distanceMillionKm(now))} million km from Earth, on a minimum-energy transfer to Mars`}>
          <Radio size={14} aria-hidden="true" /><span className="topbar-wide">Delay to </span>{`Earth ${fmtDelay(delay)}`}<span className="topbar-wide"> one way</span>
        </span>
      </div>
      {viewer === 'surgeon' ? (
        <div className="topbar-right">
          <span className="private private--earth"><Stethoscope size={16} aria-hidden="true" /><span>Flight surgeon view, on Earth. The diary is not included.</span></span>
        </div>
      ) : (
        <div className="topbar-right">
          {due}
          <span className="private" title="Your diary stays on this device. Only you can read it.">
            <Lock size={16} aria-hidden="true" />
            <span>Your diary stays on this device. Only you can read it.</span>
          </span>
          <a href="#share-log" className="t-head link-tap"
            onClick={e => { e.preventDefault(); onOpenLog?.(); }}>
            {shared === 0 ? 'Share log: nothing shared' : `Share log: ${shared} shared`}
          </a>
        </div>
      )}
    </header>
  );
}

import { Lock, Radio, Stethoscope } from 'lucide-react';
import type { Viewer } from '../../state/store';
import { MISSION_LENGTH, missionDay } from '../../config';
import { useClock } from '../../state/clock';
import { stardate } from '../../lib/stardate';
import { delayMin, fmtDelay } from '../../lib/delay';

export function TopBar({ day, shared, onOpenLog, due, viewer = 'astronaut' }: { day: number; shared: number; onOpenLog?: () => void; due?: React.ReactNode; viewer?: Viewer }) {
  const clock = useClock(1000);
  const md = missionDay(day);
  const pct = Math.round((md / MISSION_LENGTH) * 1000) / 10;
  const delay = delayMin(md + clock / 1440);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="t-label num" title={`Mission day ${md} of ${MISSION_LENGTH}`}>{`STARDATE ${stardate(md, clock)}`}</span>
        <div className="mission-meter" role="img" aria-label={`Mission day ${md} of ${MISSION_LENGTH}, ${pct} percent complete`}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="t-label num topbar-delay" title="One-way light time, computed for this mission day from the orbits of Earth and Mars">
          <Radio size={14} aria-hidden="true" /><span className="topbar-wide">Delay to </span>{`Earth ${fmtDelay(delay)}`}<span className="topbar-wide"> one way</span>
        </span>
      </div>
      {viewer === 'surgeon' ? (
        <div className="topbar-right">
          <span className="private private--earth"><Stethoscope size={16} aria-hidden="true" /><span>Flight surgeon view, on Earth. Shared notes only.</span></span>
        </div>
      ) : (
        <div className="topbar-right">
          {due}
          <span className="private" title="Stays on this device. Only you can see it.">
            <Lock size={16} aria-hidden="true" />
            <span>Stays on this device. Only you can see it.</span>
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

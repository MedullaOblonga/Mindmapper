import { Lock, Radio } from 'lucide-react';
import { MISSION_LENGTH } from '../../config';
import { useClock } from '../../state/clock';
import { stardate } from '../../lib/stardate';
import { delayMin, fmtDelay } from '../../lib/delay';

export function TopBar({ day, shared, onOpenLog }: { day: number; shared: number; onOpenLog?: () => void }) {
  const clock = useClock(1000);
  const pct = Math.round((day / MISSION_LENGTH) * 1000) / 10;
  const delay = delayMin(day + clock / 1440);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="t-label num" title={`Mission day ${day} of ${MISSION_LENGTH}`}>{`STARDATE ${stardate(day, clock)}`}</span>
        <div className="mission-meter" role="img" aria-label={`Mission day ${day} of ${MISSION_LENGTH}, ${pct} percent complete`}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="t-label num topbar-delay" title="One-way light time, computed for this mission day from the orbits of Earth and Mars">
          <Radio size={14} aria-hidden="true" /><span className="topbar-wide">Delay to </span>{`Earth ${fmtDelay(delay)}`}<span className="topbar-wide"> one way</span>
        </span>
      </div>
      <div className="topbar-right">
        <span className="private">
          <Lock size={16} aria-hidden="true" />
          <span>Stays on this device. Only you can see it.</span>
        </span>
        <a href="#share-log" className="t-head link-tap"
          onClick={e => { e.preventDefault(); onOpenLog?.(); }}>
          {shared === 0 ? 'Share log: nothing shared' : `Share log: ${shared} shared`}
        </a>
      </div>
    </header>
  );
}

import { Lock, Radio } from 'lucide-react';
import { MISSION_LENGTH } from '../../config';
import { useClock } from '../../state/clock';
import { stardate, earthDelayMin, fmtDelay } from '../../lib/stardate';

export function TopBar({ day, shared, onOpenLog }: { day: number; shared: number; onOpenLog?: () => void }) {
  const clock = useClock(1000);
  const pct = Math.round((day / MISSION_LENGTH) * 1000) / 10;
  const delay = earthDelayMin(day, clock);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="t-label num" title={`Mission day ${day} of ${MISSION_LENGTH}`}>{`STARDATE ${stardate(day, clock)}`}</span>
        <div className="mission-meter" role="img" aria-label={`Mission day ${day} of ${MISSION_LENGTH}, ${pct} percent complete`}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="t-small num delay" title="Simulated one-way signal time to Earth">
          <Radio size={14} aria-hidden="true" />{`Earth delay ${fmtDelay(delay)}`}<span className="sr-only"> one way</span>
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

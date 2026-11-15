import { Lock } from 'lucide-react';
import { MISSION_LENGTH } from '../../config';

export function TopBar({ day, shared, onOpenLog }: { day: number; shared: number; onOpenLog?: () => void }) {
  const pct = Math.round((day / MISSION_LENGTH) * 1000) / 10;
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="t-label num">{`MISSION DAY ${day} OF ${MISSION_LENGTH}`}</span>
        <div className="mission-meter" role="img" aria-label={`Mission ${pct} percent complete`}>
          <i style={{ width: `${pct}%` }} />
        </div>
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

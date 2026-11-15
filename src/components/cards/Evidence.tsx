import { fmtClock } from '../../lib/time';
import { D } from '../../config';
import { MarkRow, UsualBar, cssVars, topicVar } from '../ui';
import type { CardEvidence } from '../../types';

export function Evidence({ ev, label }: { ev: CardEvidence; label?: string }) {
  if (ev.type === 'marks') return (
    <div className="evidence" aria-label={label}>
      {ev.rows.map(r => (
        <div className="evidence-row" key={r.label}>
          <div>{r.label}<br /><span className="num">{r.count}</span> {r.count === 1 ? 'mention' : 'mentions'}</div>
          <MarkRow good={r.good} mixed={r.mixed} hard={r.hard} group={ev.group} label={`${r.label}: ${r.good} felt good, ${r.mixed} mixed, ${r.hard} felt difficult`} />
        </div>
      ))}
    </div>
  );
  if (ev.type === 'quote') return (
    <div className="evidence">
      <p className="t-quote quote-lg">{`“${ev.quote}”`}</p>
      <div className="t-small">{ev.note}</div>
    </div>
  );
  if (ev.type === 'usual-rows') return (
    <div className="evidence">
      {ev.rows.map(r => (
        <div className="usual-item" key={r.label}>
          <div className="usual-item-head"><span className="t-head">{r.label}</span><span className="t-small">{r.text}</span></div>
          <UsualBar value={r.value} usual={r.usual} scaleMax={r.scaleMax} label={`${r.label}. ${r.text}`} />
        </div>
      ))}
    </div>
  );
  return (
    <div className="evidence">
      {ev.rows.map(r => (
        <div className="evidence-row" key={r.day}>
          <div>Night of day {D(r.day - 1)}</div>
          <span className="t-body num">{`Started ${fmtClock(r.onsetMin)}. Your usual ${fmtClock(r.usualMin)}.`}</span>
        </div>
      ))}
    </div>
  );
}
export { cssVars, topicVar };

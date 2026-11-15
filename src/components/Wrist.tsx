import { useEffect, useState } from 'react';
import { appStore } from '../state/store';
import { markNow, scenarioNow } from '../logic/mark';
import { fmtClock } from '../lib/time';
import type { View } from '../state/view';

export function WristDevice({ v }: { v: View }) {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t); }, [msg]);
  const mark = () => { appStore.getState().add({ type: 'mark', ...markNow(v) }); setMsg('Marked. It will be waiting tonight.'); };
  const next = v.reminders.find(r => r.on && r.atMin !== undefined);
  return (
    <div className="wrist" aria-label="Wrist device">
      <div className="wrist-strap" />
      <button className="wrist-face" onClick={mark} aria-label="Wrist face. Press to mark a moment">
        <span className="w-time num">{fmtClock(scenarioNow())}</span>
        <span className="w-main" aria-live="polite">{msg ?? 'Press to mark a moment'}</span>
        {!msg && <span className="w-hint">{next ? `Next: ${fmtClock(next.atMin!)} ${next.wristLabel.toLowerCase()}` : 'Hold for something to do'}</span>}
      </button>
      <button className="wrist-btn" aria-label="Wrist button" onClick={mark} />
      <div className="wrist-strap" />
    </div>
  );
}

export function WristInline({ v }: { v: View }) {
  const next = v.reminders.find(r => r.on && r.atMin !== undefined);
  return (
    <section className="panel panel--tight wrist-panel" aria-label="Your wrist">
      <div className="wrist-copy">
        <div className="t-head">Your wrist</div>
        <div className="t-body">Press when something stirs a feeling. The time and what you were doing are kept for tonight.</div>
        {next && <div className="t-small">{`Next buzz: ${fmtClock(next.atMin!)}, ${next.wristLabel.toLowerCase()}. A rule you set.`}</div>}
      </div>
      <WristDevice v={v} />
    </section>
  );
}

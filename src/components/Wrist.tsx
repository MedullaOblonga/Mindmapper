import { useState } from 'react';
import { appStore } from '../state/store';
import { useUI } from '../state/ui';
import { useClock } from '../state/clock';
import { markNow } from '../logic/mark';
import { bedtimeOf, withFreeTime } from '../logic/ring';
import { pickFree } from '../logic/freeTime';
import { fmtClock } from '../lib/time';
import type { View } from '../state/view';

/** The wrist device as two buttons: one for a high moment, one for a low moment. In free time it offers things to do. */
export function WristDock({ v }: { v: View }) {
  const ui = useUI();
  const now = useClock(15000);
  const [open, setOpen] = useState(false);
  const rec = v.scenario.days[v.day - 1];
  const all = withFreeTime(v.blocksToday, rec.wakeMin, bedtimeOf(v.scenario, v.day), v.day);
  const free = all.find(b => b.kind === 'free' && b.startMin <= now && now < b.endMin);
  const ideas = free ? pickFree(free.endMin - now, v.scenario.profile) : [];
  const press = (mood: 'high' | 'low') => {
    const m = markNow(v, mood);
    appStore.getState().add({ type: 'mark', ...m });
    ui.showToast(`Simulated wrist: marked a ${mood} moment at ${fmtClock(m.min)}${m.blockLabel ? `, during ${m.blockLabel}` : ''}. It will be waiting tonight.`);
  };
  const [flash, setFlash] = useState<'high' | 'low' | null>(null);
  const pressBand = (mood: 'high' | 'low') => { press(mood); setFlash(mood); setTimeout(() => setFlash(null), 1600); };
  return (
    <div className="wrist-rail" role="group" aria-label="Simulated wrist device" title="Simulated wristband. In flight these are two physical buttons on the band.">
      <span className="wrist-label t-label">Simulated<br />wrist</span>
      <div className="band" aria-hidden="false">
        <i className="band-strap band-strap--top" aria-hidden="true" />
        <div className="band-face">
          <span className="band-time num">{fmtClock(now)}</span>
          <span className="band-msg">{flash ? (flash === 'high' ? 'High marked' : 'Low marked') : 'Press a side button'}</span>
        </div>
        <button className="band-btn band-btn--top" onClick={() => pressBand('high')} aria-label="High moment" title="Top button: a high moment" />
        <button className="band-btn band-btn--bottom" onClick={() => pressBand('low')} aria-label="Low moment" title="Bottom button: a low moment" />
        <i className="band-strap band-strap--bottom" aria-hidden="true" />
      </div>
      <span className="band-key t-foot"><span>Top: high</span><span>Bottom: low</span></span>
      {open && free && (
        <div className="wrist-pop panel panel--tight">
          <div className="t-head">{`Free until ${fmtClock(free.endMin)}`}</div>
          <p className="t-small">From your own list, sized to the time you have.</p>
          <div className="btn-row">{ideas.map(i => (
            <button key={i.label} className="btn btn--sm" onClick={() => { appStore.getState().add({ type: 'activity', key: i.label === 'Greenhouse time' ? 'greenhouse' : 'other', label: i.label }); setOpen(false); ui.showToast(`${i.label}, ${i.minutes} minutes. Logged as done.`); }}>
              {`${i.label} · ${i.minutes} min`}</button>))}</div>
        </div>
      )}
      {free && <button className="wrist-mood wrist-free" aria-expanded={open} onClick={() => setOpen(o => !o)}>Free time</button>}
    </div>
  );
}

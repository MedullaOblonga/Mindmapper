import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClock, useClockStore } from '../../state/clock';
import { appStore } from '../../state/store';
import { usualOnset } from '../../logic/cards';
import { fmtClock } from '../../lib/time';
import type { View } from '../../state/view';

function chime() {
  try {
    const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctx = W.AudioContext ?? W.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.35].forEach((t, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = i ? 660 : 880; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.3);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.32);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch { /* no audio */ }
}

export function usualBedtime(v: View): number { const o = usualOnset(v.scenario); return o < 0 ? 1440 + o : o; }

/** At the bunk, near the usual bedtime, with no entry yet: a soft light pulses across the top of the screen. */
export function BedtimeLight({ v }: { v: View }) {
  const clock = useClock(5000);
  const atBunk = useClockStore(s => s.atBunk);
  const nav = useNavigate();
  const bed = usualBedtime(v);
  const near = Math.abs(clock - bed) <= 60 || (bed > 1380 && clock < 60);
  const dismissed = v.events.some(e => e.type === 'dismiss' && e.what === 'tonight' && e.day === v.day);
  const on = atBunk && near && !v.entryToday && !dismissed;
  const was = useRef(false);
  useEffect(() => { if (on && !was.current) chime(); was.current = on; }, [on]);
  if (!on) return null;
  return (
    <div className="bedlight" role="status" aria-live="polite">
      <i className="bedlight-glow" aria-hidden="true" />
      <div className="bedlight-bar">
        <span className="t-body">{`Near your usual bedtime (${fmtClock(bed)}). Tonight’s entry is not written yet.`}</span>
        <div className="btn-row">
          <button className="btn btn--primary btn--sm" onClick={() => { useClockStore.getState().setAtBunk(false); nav('/journal', { state: { focus: true } }); }}>Write now</button>
          <button className="btn btn--quiet btn--sm" onClick={() => appStore.getState().add({ type: 'dismiss', what: 'tonight' })}>Not tonight</button>
        </div>
      </div>
    </div>
  );
}

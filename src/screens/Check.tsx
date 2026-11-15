import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useView } from '../state/useView';
import { useApp, appStore } from '../state/store';
import { scoreTrials, nextWaitMs, type Trial } from '../logic/pvt';
import { checkUsual } from '../logic/cards';
import { T } from '../logic/thresholds';
import { Dial, type DialDef } from '../components/ui/Dial';
import { checkDef, type CheckDef } from '../logic/checks';
import { Tag, Toggle } from '../components/ui';
import type { CheckSession } from '../types';

const KSS: Record<number, string> = { 1: 'Extremely alert', 3: 'Alert', 5: 'Neither alert nor sleepy', 7: 'Sleepy, but no effort to keep awake', 9: 'Very sleepy, great effort to keep awake' };

function dialsFor(slot: 'am' | 'pm', anchors: Record<string, string>): DialDef[] {
  const stress: DialDef = { id: 'stress', label: 'Stress', min: 1, max: 10, anchors: Object.fromEntries(Object.entries(anchors).map(([k, v]) => [+k, v])) };
  const sleepy: DialDef = { id: 'sleepiness', label: 'Sleepiness', min: 1, max: 9, anchors: KSS };
  const third: DialDef = slot === 'am'
    ? { id: 'sleep', label: 'How did you sleep?', min: 1, max: 10, anchors: { 1: 'Badly', 10: 'Very well' } }
    : { id: 'work', label: 'How heavy was today’s work?', min: 1, max: 10, anchors: { 1: 'Light', 10: 'Very heavy' } };
  return [stress, sleepy, third];
}

const now = () => performance.now();

function AttentionTest({ durationS, onDone, onInterrupt }: { durationS: number; onDone: (t: Trial[]) => void; onInterrupt: () => void }) {
  const [display, setDisplay] = useState('');
  const [progress, setProgress] = useState(0);
  const r = useRef({ trials: [] as Trial[], stimAt: null as number | null, last: -Infinity, t0: 0, over: false,
    timers: new Set<ReturnType<typeof setTimeout>>(), tick: null as ReturnType<typeof setInterval> | null, clearMsg: null as ReturnType<typeof setTimeout> | null });
  const box = useRef<HTMLDivElement>(null);
  const cbs = useRef({ onDone, onInterrupt }); cbs.current = { onDone, onInterrupt };

  useEffect(() => {
    const s = r.current;
    const later = (fn: () => void, ms: number) => { const id = setTimeout(() => { s.timers.delete(id); fn(); }, ms); s.timers.add(id); return id; };
    const stopAll = () => { s.over = true; s.timers.forEach(clearTimeout); s.timers.clear(); if (s.tick) clearInterval(s.tick); if (s.clearMsg) clearTimeout(s.clearMsg); };
    let lapseTimer: ReturnType<typeof setTimeout> | null = null;
    const flash = (msg: string) => { setDisplay(msg); if (s.clearMsg) clearTimeout(s.clearMsg); s.clearMsg = setTimeout(() => setDisplay(d => (d === msg ? '' : d)), 1000); };
    const schedule = () => { later(stim, nextWaitMs(Math.random)); };
    const stim = () => {
      if (s.over) return;
      if (s.clearMsg) clearTimeout(s.clearMsg);
      s.stimAt = now(); setDisplay('0');
      lapseTimer = later(() => { s.trials.push({ rtMs: null, falseStart: false, timedOut: true }); s.stimAt = null; setDisplay(''); schedule(); }, 30000);
    };
    const respond = () => {
      if (s.over) return;
      const t = now();
      if (t - s.last < 150) return;            // a double tap is one response
      s.last = t;
      if (s.stimAt === null) { s.trials.push({ rtMs: null, falseStart: true, timedOut: false }); flash('Too early'); return; }
      const rt = t - s.stimAt;
      s.stimAt = null;
      if (lapseTimer) { clearTimeout(lapseTimer); s.timers.delete(lapseTimer); lapseTimer = null; }
      if (rt < T.falseStartMs) { s.trials.push({ rtMs: rt, falseStart: true, timedOut: false }); flash('Too early'); }
      else { s.trials.push({ rtMs: rt, falseStart: false, timedOut: false }); flash(String(Math.round(rt))); }
      schedule();
    };
    const interrupt = () => { if (s.over) return; stopAll(); cbs.current.onInterrupt(); };
    const onKey = (e: KeyboardEvent) => { if (e.code !== 'Space' && e.key !== ' ') return; e.preventDefault(); if (e.repeat) return; respond(); };
    const onVis = () => { if (document.visibilityState === 'hidden') interrupt(); };
    const el = box.current!;
    const onPointer = (e: PointerEvent) => { e.preventDefault(); respond(); };
    s.t0 = now();
    s.tick = setInterval(() => {
      setProgress(Math.min(1, (now() - s.t0) / (durationS * 1000)));
      if (s.stimAt !== null) setDisplay(String(Math.round(now() - s.stimAt)));
    }, 31);
    later(() => { stopAll(); cbs.current.onDone(s.trials); }, durationS * 1000);
    schedule();
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', interrupt);
    el.addEventListener('pointerdown', onPointer);
    el.focus();
    return () => {
      stopAll();
      document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', interrupt); el.removeEventListener('pointerdown', onPointer);
    };
  }, [durationS]);

  return (
    <div className="pvt">
      <div className="pvt-progress" role="progressbar" aria-label="Test progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><i style={{ width: `${progress * 100}%` }} /></div>
      <div ref={box} className="pvt-box num" tabIndex={0} role="button" aria-label="Tap here or press Space when the counter appears">{display}</div>
    </div>
  );
}

function Recorded({ s, earlier, onDone }: { s: CheckSession; earlier: CheckSession[]; onDone: () => void }) {
  const u = earlier.length >= T.minSessionsForUsual ? checkUsual(earlier, null) : null;
  const origin = earlier.some(c => c.origin === 'nasa-replay') ? 'nasa-replay' : 'sim';
  const slow = u ? s.lapses > u.lapses + T.lapseOver : false;
  return (
    <div className="check-step">
      <h1 className="t-title">Recorded.</h1>
      {s.counts && <p className="t-stmt-sm">{slow ? 'More slow responses than your usual. It has been added to this week’s things to look at.' : 'In line with your usual.'}</p>}
      {!s.counts && <p className="t-stmt-sm">Demo length. A 30-second run is too short to judge; the flight version is 3 minutes.</p>}
      <details className="numbers">
        <summary className="t-head link-tap">Show my numbers</summary>
        <table className="real-table num">
          <thead><tr><th className="t-label" scope="col"> </th><th className="t-label" scope="col">This test</th><th className="t-label" scope="col">Your usual</th></tr></thead>
          <tbody>
            <tr><td className="t-body">Responses</td><td>{s.trials}</td><td className="t-small">—</td></tr>
            <tr><td className="t-body">Responses per second</td><td>{s.trials ? s.speed.toFixed(2) : '—'}</td>
              <td className="t-small">{u ? (1000 / u.rt).toFixed(2) : '—'}</td></tr>
            <tr><td className="t-body">Average response time</td><td>{s.trials ? `${Math.round(s.meanRtMs)} ms` : '—'}</td>
              <td className="t-small">{u ? `${Math.round(u.rt - u.wobble)} to ${Math.round(u.rt + u.wobble)} ms` : '—'}</td></tr>
            <tr><td className="t-body">Slow responses (355 ms or more)</td><td>{s.lapses}</td><td className="t-small">{u ? `${Math.round(u.lapses)}` : '—'}</td></tr>
            <tr><td className="t-body">Early taps</td><td>{s.falseStarts}</td><td className="t-small">—</td></tr>
          </tbody>
        </table>
        {u && <Tag data={origin} />}
      </details>
      <div className="btn-row"><button className="btn btn--primary" onClick={onDone}>Done</button></div>
    </div>
  );
}

function ReactionCheck() {
  const v = useView();
  const nav = useNavigate();
  const [q] = useSearchParams();
  const storyHidden = useApp(s => s.storyHidden);
  const slot: 'am' | 'pm' = q.get('slot') === 'pm' ? 'pm' : 'am';
  const only = q.get('test') === '1';   // reaction speed test by itself, from Today
  const dials = dialsFor(slot, v.scenario.profile.stressAnchors);
  const [values, setValues] = useState<Record<string, number | null>>({});
  const [step, setStep] = useState<'dials' | 'intro' | 'test' | 'done' | 'interrupted'>(only ? 'intro' : 'dials');
  const [demo, setDemo] = useState(!storyHidden);
  const [session, setSession] = useState<CheckSession | null>(null);
  const exists = v.checks.some(c => c.day === v.day && c.slot === slot);
  const earlier = v.checks.filter(c => c.counts && (c.day < v.day || (c.day === v.day && c.slot === 'am' && slot === 'pm')));
  const durationS = demo ? 30 : 180;
  const finish = (trials: Trial[]) => {
    const s = { ...scoreTrials(trials, durationS, v.day, slot), ...(only ? {} : { dials: values as Record<string, number> }) };
    appStore.getState().add({ type: 'check', session: s });
    setSession(s); setStep('done');
  };
  return (
    <div className="check">
      <header className="check-top">
        <span className="t-label">{`${only ? 'Reaction speed test' : 'Scheduled check'} · day ${v.day} · ${slot === 'am' ? 'morning' : 'evening'}`}</span>
        <a href="#/today" className="t-head link-tap" onClick={e => { e.preventDefault(); nav('/today'); }}>Leave</a>
      </header>
      <main className="check-main">
        {exists && step !== 'done' ? (
          <div className="check-step"><h1 className="t-title">{`This ${slot === 'am' ? 'morning' : 'evening'}’s ${only ? 'test' : 'check'} is recorded.`}</h1>
            <div className="btn-row"><button className="btn btn--primary" onClick={() => nav('/today')}>Done</button></div></div>
        ) : step === 'dials' ? (
          <div className="check-step">
            <h1 className="t-title">Step 1 · Two dials</h1>
            {dials.map(d => <Dial key={d.id} def={d} value={values[d.id] ?? null} onChange={n => setValues(x => ({ ...x, [d.id]: n }))} />)}
            <div className="btn-row"><button className="btn btn--primary" disabled={dials.some(d => values[d.id] == null)} onClick={() => setStep('intro')}>Next</button></div>
          </div>
        ) : step === 'intro' ? (
          <div className="check-step">
            <h1 className="t-title">{only ? 'Reaction speed test' : 'Step 2 · Attention test'}</h1>
            <p className="t-stmt-sm">A 3-minute attention test, modelled on the one ISS crews take. A counter will appear in the box at random moments. Tap the box or press Space as fast as you can each time.</p>
            <div className="toggle-row"><Toggle on={demo} onChange={setDemo} label="Demo length (30 seconds)" /><span className="t-body">Demo length (30 seconds)</span></div>
            <div><Tag>Modelled on PVT-B. Not NASA’s software.</Tag></div>
            <div className="btn-row"><button className="btn btn--primary" onClick={() => setStep('test')}>Start the test</button></div>
          </div>
        ) : step === 'test' ? (
          <AttentionTest durationS={durationS} onDone={finish} onInterrupt={() => setStep('interrupted')} />
        ) : step === 'interrupted' ? (
          <div className="check-step">
            <h1 className="t-title">Interrupted. Not recorded.</h1>
            <p className="t-body">The test stops if you leave the window, so a distraction is never counted as slow.</p>
            <div className="btn-row"><button className="btn btn--primary" onClick={() => setStep('intro')}>Try again</button><button className="btn btn--quiet" onClick={() => nav('/today')}>Leave</button></div>
          </div>
        ) : session && <Recorded s={session} earlier={earlier} onDone={() => nav('/today')} />}
      </main>
    </div>
  );
}

/** A short questionnaire from the rotation: one dial per question, then "Recorded." Nothing is scored for anyone else. */
function Questionnaire({ def }: { def: CheckDef }) {
  const v = useView();
  const nav = useNavigate();
  const items = def.items ?? [];
  const [vals, setVals] = useState<(number | null)[]>(items.map(() => null));
  const [done, setDone] = useState(false);
  const submit = () => { appStore.getState().add({ type: 'questionnaire', kind: def.kind, answers: vals as number[] }); setDone(true); };
  return (
    <div className="check">
      <header className="check-top">
        <span className="t-label">{`${def.title} · day ${v.day}`}</span>
        <a href="#/today" className="t-head link-tap" onClick={e => { e.preventDefault(); nav('/today'); }}>Leave</a>
      </header>
      <main className="check-main">
        {done ? (
          <div className="check-step">
            <h1 className="t-title">Recorded.</h1>
            <p className="t-stmt-sm">Only you can see your answers. The tool compares them with your own earlier answers, never with anyone else.</p>
            <details className="numbers"><summary className="t-head link-tap">Show my answers</summary>
              <ul className="plain-list t-body">{items.map((it, i) => <li key={it.text}>{`${it.text} ${vals[i]}${it.anchors[vals[i]!] ? ` (${it.anchors[vals[i]!]})` : ''}`}</li>)}</ul>
            </details>
            <div className="btn-row"><button className="btn btn--primary" onClick={() => nav('/today')}>Done</button></div>
          </div>
        ) : (
          <div className="check-step">
            <h1 className="t-title">{def.title}</h1>
            <p className="t-small">{`${def.length}. ${def.basis}.`}</p>
            {items.map((it, i) => (
              <Dial key={it.text} def={{ id: String(i), label: it.text, min: it.min, max: it.max, anchors: it.anchors }} value={vals[i]}
                onChange={n => setVals(x => x.map((y, j) => (j === i ? n : y)))} />
            ))}
            <div className="btn-row"><button className="btn btn--primary" disabled={vals.some(x => x === null)} onClick={submit}>Save</button></div>
          </div>
        )}
      </main>
    </div>
  );
}

export function Check() {
  const [q] = useSearchParams();
  const def = checkDef(q.get('kind') ?? '');
  return def && def.kind !== 'reaction' ? <Questionnaire def={def} /> : <ReactionCheck />;
}

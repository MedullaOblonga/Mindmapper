import { useEffect, useMemo, useRef, useState } from 'react';
import { appStore } from '../state/store';
import { bedtimeOf, blockRange, SOURCE_TEXT, withFreeTime } from '../logic/ring';
import { usualOnset } from '../logic/cards';
import { pickFree } from '../logic/freeTime';
import { fmtClock, fmtLater } from '../lib/time';
import { BLOCK_LEGEND, BLOCK_VAR, DayRing, MoodGlyph } from './DayRing';
import { Mark, MarkLegend } from './ui';
import type { Block, Felt, MoodMark } from '../types';
import type { View } from '../state/view';

const FELTS: { f: Felt; label: string }[] = [{ f: 'good', label: 'Good' }, { f: 'mixed', label: 'Mixed' }, { f: 'hard', label: 'Hard' }];
const inBlock = (m: MoodMark, b: Block) => m.min >= b.startMin && m.min < b.endMin;

function Moments({ marks }: { marks: MoodMark[] }) {
  if (!marks.length) return <p className="t-small">No presses during this.</p>;
  return (
    <ul className="moments">
      {marks.map((m, i) => <li key={i} className="t-small"><MoodGlyph mood={m.mood} />{`${m.mood === 'high' ? 'High' : 'Low'} at ${fmtClock(m.min)}`}</li>)}
    </ul>
  );
}

function AddBlock({ day, onDone }: { day: number; onDone: () => void }) {
  const [label, setLabel] = useState('');
  const [start, setStart] = useState('14:00');
  const [end, setEnd] = useState('15:00');
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  const ok = label.trim() && toMin(end) > toMin(start);
  return (
    <div className="add-block">
      <input className="field" aria-label="What was it?" placeholder="What was it?" value={label} onChange={e => setLabel(e.target.value)} />
      <input className="field" type="time" aria-label="Start" value={start} onChange={e => setStart(e.target.value)} />
      <input className="field" type="time" aria-label="End" value={end} onChange={e => setEnd(e.target.value)} />
      <button className="btn btn--primary btn--sm" disabled={!ok} onClick={() => {
        appStore.getState().add({ type: 'block-add', block: { id: `d${day}-you-${Date.now().toString(36)}`, day, kind: 'work', label: label.trim(),
          startMin: toMin(start), endMin: toMin(end), source: 'you', felt: null } });
        onDone();
      }}>Add</button>
      <button className="btn btn--quiet btn--sm" onClick={onDone}>Cancel</button>
    </div>
  );
}

/** Rebuild the day: the ring plus a scroller that steps from one block to the next, each with a prompt to write about it. */
export function DayBuilder({ v, onWrite, compact }: { v: View; onWrite: (prefill: string) => void; compact?: boolean }) {
  const s = v.scenario, rec = s.days[v.day - 1];
  const blocks = useMemo(() => withFreeTime(v.blocksToday, rec.wakeMin, bedtimeOf(s, v.day), v.day), [v.blocksToday, rec, s, v.day]);
  const marks = v.marksToday;
  const lowCounts = blocks.map(b => marks.filter(m => m.mood === 'low' && inBlock(m, b)).length);
  const cueIdx = lowCounts.some(n => n > 0) ? lowCounts.indexOf(Math.max(...lowCounts)) : Math.max(0, blocks.findIndex(b => b.kind === 'work'));
  const [sel, setSel] = useState(cueIdx);
  const [adding, setAdding] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const fromScroll = useRef(false);
  useEffect(() => { setSel(cueIdx); }, [v.day]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (fromScroll.current) { fromScroll.current = false; return; }
    const el = list.current?.children[sel] as HTMLElement | undefined;
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [sel]);
  const onScroll = () => {
    const box = list.current; if (!box) return;
    const mid = box.scrollLeft + box.clientWidth / 2;
    let best = 0, dist = Infinity;
    Array.from(box.children).forEach((c, i) => { const el = c as HTMLElement; const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid); if (d < dist) { dist = d; best = i; } });
    if (best !== sel) { fromScroll.current = true; setSel(best); }
  };
  const late = rec.onsetMin - usualOnset(s);
  const cueOff = v.events.some(e => e.type === 'dismiss' && e.what === 'cue');
  const cueBlock = blocks[cueIdx];
  const lowCue = lowCounts[cueIdx] > 0 ? marks.filter(m => m.mood === 'low' && inBlock(m, cueBlock)) : [];
  return (
    <section className="panel builder" aria-label="Rebuild your day">
      <div className="panel-title-row"><h2 className="t-head">{`Rebuild day ${v.day}`}</h2><span className="t-small">Scroll through your day and tap how each part felt.</span></div>
      {lowCue.length > 0 && (
        <p className="t-body cue">{`You pressed low ${lowCue.length === 1 ? `at ${fmtClock(lowCue[0].min)}` : `${lowCue.length} times`} during ${cueBlock.label}. Start there?`}</p>
      )}
      {!cueOff && late >= 60 && (
        <p className="t-small">{`Asked because your sleep started ${fmtLater(late)} later than your usual. `}
          <button className="link-btn" onClick={() => appStore.getState().add({ type: 'dismiss', what: 'cue' })}>Turn this cue off</button></p>
      )}
      <div className={`builder-grid ${compact ? 'builder-grid--compact' : ''}`}>
        <div className="ring-wrap">
          <DayRing blocks={blocks} marks={marks} selected={sel} onSelect={setSel} title={`Day ${v.day}`} sub={blocks[sel] ? `${blocks[sel].label} · ${blockRange(blocks[sel])}` : ''} />
          <div className="legend legend--sm">
            <span><MoodGlyph mood="high" />High press</span><span><MoodGlyph mood="low" />Low press</span>
          </div>
        </div>
        <div className="scroller-wrap">
          <div className="scroller-nav">
            <button className="btn btn--sm" aria-label="Previous part of the day" disabled={sel <= 0} onClick={() => setSel(i => Math.max(0, i - 1))}>‹</button>
            <span className="t-small num">{`${sel + 1} of ${blocks.length}`}</span>
            <button className="btn btn--sm" aria-label="Next part of the day" disabled={sel >= blocks.length - 1} onClick={() => setSel(i => Math.min(blocks.length - 1, i + 1))}>›</button>
          </div>
          <div className="scroller" ref={list} onScroll={onScroll} role="list" aria-label="Parts of the day">
            {blocks.map((b, i) => {
              const bm = marks.filter(m => inBlock(m, b));
              const free = b.kind === 'free' ? pickFree(b.endMin - b.startMin, s.profile) : [];
              return (
                <article key={b.id} role="listitem" className={`block-card ${i === sel ? 'block-card--sel' : ''}`} aria-current={i === sel ? 'true' : undefined} onClick={() => setSel(i)}>
                  <i className="block-bar" style={{ background: BLOCK_VAR[b.kind] }} />
                  <h3 className="t-head block-name">{b.label}</h3>
                  <p className="t-small num">{`${blockRange(b)}. ${b.kind === 'free' ? 'Free in the mission plan' : SOURCE_TEXT[b.source]}`}</p>
                  {b.kind !== 'free' && (
                    <div className="btn-row" role="group" aria-label={`How ${b.label} felt`}>
                      {FELTS.map(({ f, label }) => (
                        <button key={f} className="btn btn--sm" aria-pressed={b.felt === f} onClick={e => { e.stopPropagation(); appStore.getState().add({ type: 'block-felt', blockId: b.id, felt: f }); }}>
                          <Mark felt={f} color={BLOCK_VAR[b.kind]} />{label}</button>
                      ))}
                    </div>
                  )}
                  <Moments marks={bm} />
                  {free.length > 0 && <p className="t-small">{`Your wrist offers: ${free.map(f => f.label.toLowerCase()).join(', ')}.`}</p>}
                  <button className={`btn btn--sm ${i === sel ? 'btn--primary' : ''}`} onClick={e => { e.stopPropagation(); onWrite(`About ${b.label.toLowerCase()}, ${blockRange(b)}: `); }}>Write about this</button>
                </article>
              );
            })}
          </div>
          <div className="btn-row">
            {adding ? <AddBlock day={v.day} onDone={() => setAdding(false)} /> : <button className="btn btn--sm" onClick={() => setAdding(true)}>Add what is missing</button>}
          </div>
          <div className="legend legend--sm">{BLOCK_LEGEND.map(l => <span key={l.kind}><i className="swatch" style={{ background: BLOCK_VAR[l.kind] }} />{l.label}</span>)}</div>
          <MarkLegend />
        </div>
      </div>
      <p className="t-foot">A rebuilt day is from memory and can be off, so every block is editable. Nothing here is sent anywhere.</p>
    </section>
  );
}

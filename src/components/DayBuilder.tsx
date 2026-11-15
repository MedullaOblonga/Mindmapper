import { useEffect, useMemo, useState } from 'react';
import { D } from '../config';
import { appStore } from '../state/store';
import { bedtimeOf, blockRange, SOURCE_TEXT, withFreeTime } from '../logic/ring';
import { usualOnset } from '../logic/cards';
import { pickFree } from '../logic/freeTime';
import { fmtClock, fmtLater } from '../lib/time';
import { BLOCK_VAR, DayRing, MoodGlyph } from './DayRing';
import { Mark } from './ui';
import type { Block, Felt, MoodMark } from '../types';
import type { View } from '../state/view';

const FELTS: { f: Felt; label: string }[] = [{ f: 'good', label: 'Good' }, { f: 'mixed', label: 'Mixed' }, { f: 'hard', label: 'Difficult' }];
export const inBlock = (m: MoodMark, b: Block) => m.min >= b.startMin && m.min < b.endMin;

/** A guess from the wrist: only high presses → good, only low → hard, both → mixed. The astronaut's tap always wins. */
export function feltFromPresses(marks: MoodMark[]): Felt | null {
  const hi = marks.some(m => m.mood === 'high'), lo = marks.some(m => m.mood === 'low');
  return hi && lo ? 'mixed' : hi ? 'good' : lo ? 'hard' : null;
}

/** Rebuild the day: the ring, and one card at a time. Tap the card to flip to the next part of the day. */
export function DayBuilder({ v }: { v: View }) {
  const s = v.scenario, rec = s.days[v.day - 1];
  const tapped = useMemo(() => new Set(v.events.filter(e => e.type === 'block-felt').map(e => (e as { blockId: string }).blockId)), [v.events]);
  const blocks = useMemo(() => withFreeTime(v.blocksToday, rec.wakeMin, bedtimeOf(s, v.day), v.day), [v.blocksToday, rec, s, v.day]);
  const marks = v.marksToday;
  const lowCounts = blocks.map(b => marks.filter(m => m.mood === 'low' && inBlock(m, b)).length);
  const cueIdx = lowCounts.some(n => n > 0) ? lowCounts.indexOf(Math.max(...lowCounts)) : Math.max(0, blocks.findIndex(b => b.kind === 'work'));
  const [sel, setSel] = useState(cueIdx);
  useEffect(() => { setSel(cueIdx); }, [v.day]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = blocks[Math.min(sel, blocks.length - 1)];
  const bm = marks.filter(m => inBlock(m, b));
  const guess = b.felt === null || !tapped.has(b.id) ? (feltFromPresses(bm) ?? b.felt) : b.felt;
  const fromWrist = !tapped.has(b.id) && feltFromPresses(bm) !== null;
  const free = b.kind === 'free' ? pickFree(b.endMin - b.startMin, s.profile) : [];
  const next = () => setSel(i => (i + 1) % blocks.length);
  const late = rec.onsetMin - usualOnset(s);
  const cueOff = v.events.some(e => e.type === 'dismiss' && e.what === 'cue');
  const lowCue = lowCounts[cueIdx] > 0 ? marks.filter(m => m.mood === 'low' && inBlock(m, blocks[cueIdx])) : [];
  const ringBlocks = blocks.map(x => (x.id === b.id ? { ...x, felt: guess } : x.felt === null || !tapped.has(x.id) ? { ...x, felt: feltFromPresses(marks.filter(m => inBlock(m, x))) ?? x.felt } : x));
  return (
    <section className="panel builder" aria-label="Rebuild your day">
      <div className="panel-title-row"><h2 className="t-head">{`Your day ${D(v.day)}`}</h2>
        {lowCue.length > 0 && <span className="t-small cue">{`You pressed low at ${fmtClock(lowCue[0].min)} during ${blocks[cueIdx].label}.`}</span>}</div>
      <div className="builder-grid">
        <DayRing blocks={ringBlocks} marks={marks} selected={sel} onSelect={setSel} title={`Day ${D(v.day)}`} sub={`${b.label} · ${blockRange(b)}`} />
        <div className="flip-wrap">
          <article key={b.id} className="block-card block-card--flip card-enter" onClick={next} aria-live="polite"
            aria-label={`${b.label}, ${blockRange(b)}. Part ${sel + 1} of ${blocks.length}. Tap for the next part.`}>
            <i className="block-bar" style={{ background: BLOCK_VAR[b.kind] }} />
            <div className="flip-head"><h3 className="t-head block-name">{b.label}</h3><span className="t-small num">{`${sel + 1} of ${blocks.length}`}</span></div>
            <p className="t-small num">{`${blockRange(b)}. ${b.kind === 'free' ? 'Free in the mission plan' : SOURCE_TEXT[b.source]}`}</p>
            {b.kind !== 'free' && (
              <div className="btn-row" role="group" aria-label={`How ${b.label} felt`} onClick={e => e.stopPropagation()}>
                {FELTS.map(({ f, label }) => (
                  <button key={f} className="btn btn--sm" aria-pressed={guess === f} onClick={() => appStore.getState().add({ type: 'block-felt', blockId: b.id, felt: f })}>
                    <Mark felt={f} color={BLOCK_VAR[b.kind]} />{label}</button>
                ))}
              </div>
            )}
            {fromWrist && <p className="t-small">From your wrist presses. Tap to correct.</p>}
            {bm.length > 0 && <ul className="moments">{bm.map((m, i) => <li key={i} className="t-small"><MoodGlyph mood={m.mood} />{`${m.mood === 'high' ? 'High' : 'Low'} at ${fmtClock(m.min)}`}</li>)}</ul>}
            {free.length > 0 && <p className="t-small">{`Your wrist offers: ${free.map(f => f.label.toLowerCase()).join(', ')}.`}</p>}
            <span className="t-foot flip-hint">Tap the card for the next part of the day</span>
          </article>
          {!cueOff && late >= 60 && (
            <p className="t-small">{`Asked because your sleep started ${fmtLater(late)} later than your usual. `}
              <button className="link-btn" onClick={() => appStore.getState().add({ type: 'dismiss', what: 'cue' })}>Turn this cue off</button></p>
          )}
        </div>
      </div>
    </section>
  );
}

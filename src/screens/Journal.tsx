import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useView } from '../state/useView';
import { appStore } from '../state/store';
import { tagEntry } from '../logic/tagger';
import { fmtClock } from '../lib/time';
import { GROUPS, groupDef, groupShort } from '../data/topics';
import { params } from '../data/params';
import { Mark, MarkLegend, Tag, cssVars, topicVar } from '../components/ui';
import { canListen, listen } from '../lib/speech';
import type { Block, Entry, Felt, Group, MoodMark, Segment } from '../types';
import { DayBuilder } from '../components/DayBuilder';
import { SafetyNotice } from '../components/SafetyNotice';
import { entryMatches } from '../logic/safety';
import { MoodGlyph, BLOCK_VAR } from '../components/DayRing';

interface JournalState { prefill?: string; focus?: boolean; filter?: { group: Group; ids: string[]; from: number; to: number; topic: string } }
const FELTS: { f: Felt; label: string }[] = [{ f: 'good', label: 'Good' }, { f: 'mixed', label: 'Mixed' }, { f: 'hard', label: 'Difficult' }];

function TopicChip({ seg }: { seg: Segment }) {
  const [open, setOpen] = useState(false);
  const def = groupDef(seg.group);
  return (
    <span className="topic-menu">
      <button className="chip chip-btn" style={cssVars({ background: topicVar(seg.group), color: def.ink === 'light' ? 'var(--ink)' : 'var(--bg)' })}
        aria-haspopup="true" aria-expanded={open} aria-label={`Topic: ${def.label}. Change topic`} onClick={() => setOpen(o => !o)}>{groupShort(seg.group)}</button>
      {open && (
        <span className="menu" role="menu">
          {GROUPS.map(g => (
            <button key={g.id} role="menuitem" className="menu-item" onClick={() => { appStore.getState().add({ type: 'retag', segmentId: seg.id, group: g.id }); setOpen(false); }}>
              <i className="swatch" style={{ background: topicVar(g.id) }} />{g.label}</button>
          ))}
        </span>
      )}
    </span>
  );
}

export function SegmentRow({ seg }: { seg: Segment }) {
  return (
    <div className="seg-row">
      <p className="seg-text">{seg.text}</p>
      <div className="seg-controls">
        <TopicChip seg={seg} />
        <div className="btn-row" role="group" aria-label="How it felt">
          {FELTS.map(({ f, label }) => (
            <button key={f} className="btn btn--sm" aria-pressed={seg.felt === f}
              onClick={() => appStore.getState().add({ type: 'retag', segmentId: seg.id, felt: f })}>
              <Mark felt={f} group={seg.group} />{label}</button>
          ))}
        </div>
        {seg.feltBy === 'tool' && <span className="t-small">{seg.felt ? 'Guessed. Tap to correct.' : 'How did this one feel?'}</span>}
      </div>
    </div>
  );
}

function TaggedEntry({ entry }: { entry: Entry }) {
  const [all, setAll] = useState(false);
  const shown = all ? entry.segments : entry.segments.slice(0, 12);
  return (
    <section className="panel" aria-label="How the tool read it">
      <div className="panel-title-row"><h2 className="t-head">How the tool read it</h2><span className="trend-tags">{entryMatches(entry) && <span className="tag">Matched the safety line</span>}<Tag data={entry.origin} /></span></div>
      <div className="rows">{shown.map(s => <SegmentRow key={s.id} seg={s} />)}</div>
      {entry.segments.length > 12 && !all && <button className="btn btn--sm" onClick={() => setAll(true)}>{`and ${entry.segments.length - 12} more`}</button>}
      <MarkLegend />
      <p className="t-foot">Counts toward this week’s picture. The words themselves stay in your diary.</p>
      {entryMatches(entry) && <p className="t-foot">This entry matched the safety line. That it happened was sent; the words were not.</p>}
    </section>
  );
}

export interface ComposerApi { insert: (s: string) => void }
function Composer({ day, marks, blocks, text, setText, focus, apiRef }: { day: number; marks: MoodMark[]; blocks: Block[]; text: string; setText: (t: string | ((p: string) => string)) => void; focus: boolean; apiRef: React.MutableRefObject<ComposerApi | null> }) {
  const [listening, setListening] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => { if (focus) { const t = ta.current!; t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, [focus]);
  useEffect(() => () => stopRef.current?.(), []);
  const insert = (str: string) => {
    const t = ta.current; const a = t?.selectionStart ?? text.length, b = t?.selectionEnd ?? text.length;
    const sep = a > 0 && !/\s$/.test(text.slice(0, a)) ? '\n' : '';
    setText(text.slice(0, a) + sep + str + text.slice(b));
    const pos = a + sep.length + str.length;
    requestAnimationFrame(() => { if (t) { t.focus(); t.setSelectionRange(pos, pos); if (typeof t.scrollIntoView === 'function') t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } });
  };
  apiRef.current = { insert };
  const save = () => {
    const id = `u${day}-${Date.now().toString(36)}`;
    const segments = tagEntry(text, day, id);
    if (!segments.length) return;
    appStore.getState().add({ type: 'entry', entry: { id, day, segments, origin: 'user' } });
    setText('');
  };
  const toggleSpeak = () => {
    if (listening) { stopRef.current?.(); stopRef.current = null; setListening(false); return; }
    setListening(true);
    stopRef.current = listen(t => setText(prev => (prev ? `${prev} ${t}` : t)), () => setListening(false));
  };
  return (
    <section className="panel" aria-label="Write">
      <label className="t-label" htmlFor="composer">{`Day ${day} · private diary`}</label>
      {blocks.length > 0 && (
        <div className="chip-row" role="group" aria-label="Insert an activity">
          <span className="t-label chip-row-label">Activities</span>
          {blocks.map(b => (
            <button key={b.id} className="btn btn--sm" onClick={() => insert(`During ${b.label.toLowerCase()} (${fmtClock(b.startMin)} to ${fmtClock(b.endMin)}): `)}>
              <i className="swatch" style={{ background: BLOCK_VAR[b.kind] }} />{b.label}</button>
          ))}
        </div>
      )}
      {marks.length > 0 && (
        <div className="chip-row" role="group" aria-label="Insert a wrist press">
          <span className="t-label chip-row-label">Presses</span>
          {marks.map((m, i) => (
            <button key={i} className="btn btn--sm" onClick={() => insert(`At ${fmtClock(m.min)}${m.blockLabel ? `, during ${m.blockLabel}` : ''} (${m.mood}): `)}>
              <MoodGlyph mood={m.mood} />{`${fmtClock(m.min)}${m.blockLabel ? ` · ${m.blockLabel}` : ''}`}</button>
          ))}
        </div>
      )}
      <textarea id="composer" ref={ta} className="paper" rows={6} value={text} onChange={e => setText(e.target.value)} placeholder="What happened, and how did it sit with you?" />
      <div className="composer-row">
        <div className="btn-row">
          {canListen() && <button className="btn" onClick={toggleSpeak} aria-pressed={listening}>{listening ? 'Stop' : 'Speak'}</button>}
          <button className="btn btn--primary" onClick={save} disabled={!text.trim()}>Save entry</button>
        </div>
        <span className="t-small">Your words never leave this device.</span>
      </div>
      {listening && <p className="t-foot">This prototype uses your browser’s speech service, which may send audio to its maker. The flight design transcribes on board.</p>}
      <p className="t-foot">The tool reads what each part is about and guesses how it felt. You can correct both.</p>
      <p className="t-foot">One fixed line, agreed before launch: if what you write points to a risk to you or to others, your crew medical officer and flight surgeon are told that it happened, never what you wrote.</p>
    </section>
  );
}

function Earlier({ entries, day, filter, clearFilter, matched }: { entries: Entry[]; day: number; filter?: JournalState['filter']; clearFilter: () => void; matched: Set<number> }) {
  const [group, setGroup] = useState<Group | 'all'>('all');
  const list = useMemo(() => {
    const segs = entries.filter(e => e.day < day || (filter && e.day <= day)).flatMap(e => e.segments)
      .filter(s => (filter ? filter.ids.includes(s.id) : group === 'all' || s.group === group));
    const byDay = new Map<number, Segment[]>();
    for (const s of segs) { if (!byDay.has(s.day)) byDay.set(s.day, []); byDay.get(s.day)!.push(s); }
    return [...byDay.entries()].sort((a, b) => b[0] - a[0]);
  }, [entries, day, group, filter]);
  const sampleShown = entries.some(e => e.origin === 'ai-sample');
  return (
    <section className="panel panel--tight" aria-label="Earlier entries">
      <h2 className="t-head">Earlier entries</h2>
      {filter ? (
        <p className="t-small">{`Showing ${filter.ids.length} entries about ${filter.topic.toLowerCase()}, days ${filter.from} to ${filter.to}. `}
          <a href="#/journal" onClick={e => { e.preventDefault(); clearFilter(); }}>Clear</a></p>
      ) : (
        <div className="btn-row" role="group" aria-label="Filter by topic">
          <button className="btn btn--sm" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>All</button>
          {params.groupsOrder.map(g => <button key={g} className="btn btn--sm" aria-pressed={group === g} onClick={() => setGroup(g)}>{groupShort(g)}</button>)}
        </div>
      )}
      {sampleShown && <div><Tag data="ai-sample" /></div>}
      <div className="earlier">
        {list.length === 0 && <p className="t-small">No entries yet.</p>}
        {list.slice(0, 40).map(([d, segs]) => (
          <details key={d} className="earlier-day" open={!!filter || d >= day - 3}>
            <summary className="t-label earlier-sum">{`Day ${d}`}{matched.has(d) && <span className="tag">Matched the safety line</span>}<span className="earlier-swatches" aria-hidden="true">{segs.map(s => <i key={s.id} className="swatch" style={{ background: topicVar(s.group) }} />)}</span></summary>
            <p className="earlier-prose">{segs.map(s => s.text).join(' ')}</p>
            <div className="earlier-tags">{segs.map(s => (
              <span key={s.id} className="earlier-tag t-small"><i className="swatch" style={{ background: topicVar(s.group) }} />{groupShort(s.group)}<Mark felt={s.felt} group={s.group} /></span>
            ))}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Journal() {
  const v = useView();
  const loc = useLocation();
  const nav = useNavigate();
  const st = (loc.state ?? {}) as JournalState;
  const todays = v.entries.filter(e => e.day === v.day);
  const latest = todays[todays.length - 1];
  const [text, setText] = useState(st.prefill ?? '');
  const api = useRef<ComposerApi | null>(null);
  const matched = useMemo(() => new Set(v.entries.filter(entryMatches).map(e => e.day)), [v.entries]);
  useEffect(() => { setText(st.prefill ?? ''); }, [v.day, loc.key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">Your diary</h1>
        <p className="t-lede">Private. Written at the end of the day. Walk through the day, then write what stayed with you.</p></div></div>
      <SafetyNotice v={v} />
      <DayBuilder v={v} />
      <div className="cols">
        <div className="col col--wide">
          <Composer key={`${v.day}-${loc.key}`} day={v.day} marks={v.marksToday} blocks={v.blocksToday.filter(b => b.kind !== 'sleep')} text={text} setText={setText} focus={!!st.focus || !!st.prefill} apiRef={api} />
          {latest && <TaggedEntry entry={latest} />}
        </div>
        <div className="col col--narrow">
          <Earlier entries={v.entries} day={v.day} filter={st.filter} clearFilter={() => nav('/journal', { replace: true, state: {} })} matched={matched} />
        </div>
      </div>
    </>
  );
}

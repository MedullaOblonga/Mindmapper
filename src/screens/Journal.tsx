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
import type { Entry, Felt, Group, Segment } from '../types';

interface JournalState { prefill?: string; focus?: boolean; filter?: { group: Group; ids: string[]; from: number; to: number; topic: string } }
const FELTS: { f: Felt; label: string }[] = [{ f: 'good', label: 'Good' }, { f: 'mixed', label: 'Mixed' }, { f: 'hard', label: 'Hard' }];

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
      <div className="panel-title-row"><h2 className="t-head">How the tool read it</h2><Tag data={entry.origin} /></div>
      <div className="rows">{shown.map(s => <SegmentRow key={s.id} seg={s} />)}</div>
      {entry.segments.length > 12 && !all && <button className="btn btn--sm" onClick={() => setAll(true)}>{`and ${entry.segments.length - 12} more`}</button>}
      <MarkLegend />
      <p className="t-foot">Counts toward this week’s picture. The words themselves stay in your diary.</p>
    </section>
  );
}

function Composer({ day, marks, initial, focus }: { day: number; marks: { min: number; blockLabel: string | null }[]; initial: string; focus: boolean }) {
  const [text, setText] = useState(initial);
  const [listening, setListening] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => { if (focus) { const t = ta.current!; t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, [focus]);
  useEffect(() => () => stopRef.current?.(), []);
  const insert = (s: string) => {
    const t = ta.current; const a = t?.selectionStart ?? text.length, b = t?.selectionEnd ?? text.length;
    const next = text.slice(0, a) + s + text.slice(b);
    setText(next);
    requestAnimationFrame(() => { if (t) { t.focus(); t.setSelectionRange(a + s.length, a + s.length); } });
  };
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
      {marks.length > 0 && (
        <div className="btn-row">
          {marks.map((m, i) => (
            <button key={i} className="btn btn--sm" onClick={() => insert(`At ${fmtClock(m.min)}${m.blockLabel ? `, during ${m.blockLabel}` : ''}: `)}>
              {`${fmtClock(m.min)}${m.blockLabel ? ` · ${m.blockLabel}` : ''}`}</button>
          ))}
        </div>
      )}
      <textarea id="composer" ref={ta} className="paper" rows={6} value={text} onChange={e => setText(e.target.value)} placeholder="What happened, and how did it sit with you?" />
      <div className="composer-row">
        <div className="btn-row">
          {canListen() && <button className="btn" onClick={toggleSpeak} aria-pressed={listening}>{listening ? 'Stop' : 'Speak'}</button>}
          <button className="btn btn--primary" onClick={save} disabled={!text.trim()}>Save entry</button>
        </div>
        <span className="t-small">Nothing leaves this device.</span>
      </div>
      {listening && <p className="t-foot">This prototype uses your browser’s speech service, which may send audio to its maker. The flight design transcribes on board.</p>}
      <p className="t-foot">The tool reads what each part is about and guesses how it felt. You can correct both.</p>
    </section>
  );
}

function Earlier({ entries, day, filter, clearFilter }: { entries: Entry[]; day: number; filter?: JournalState['filter']; clearFilter: () => void }) {
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
          <div key={d} className="earlier-day">
            <div className="t-label">{`Day ${d}`}</div>
            {segs.map(s => (
              <div key={s.id} className="earlier-line">
                <i className="swatch" style={{ background: topicVar(s.group) }} aria-label={groupShort(s.group)} />
                <span className="t-small earlier-text">{s.text}</span>
                <Mark felt={s.felt} group={s.group} />
              </div>
            ))}
          </div>
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
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">Your diary</h1>
        <p className="t-lede">Private. Spoken or typed. The tool reads what it is about, and you correct it.</p></div></div>
      <div className="cols">
        <div className="col col--wide">
          <Composer key={`${v.day}-${loc.key}`} day={v.day} marks={v.marksToday} initial={st.prefill ?? ''} focus={!!st.focus || !!st.prefill} />
          {latest && <TaggedEntry entry={latest} />}
        </div>
        <div className="col col--narrow">
          <Earlier entries={v.entries} day={v.day} filter={st.filter} clearFilter={() => nav('/journal', { replace: true, state: {} })} />
        </div>
      </div>
    </>
  );
}

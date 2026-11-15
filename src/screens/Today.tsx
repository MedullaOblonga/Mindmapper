import { useState } from 'react';
import { D } from '../config';
import { useNavigate } from 'react-router-dom';
import { useView } from '../state/useView';
import { useApp, appStore } from '../state/store';
import { useUI } from '../state/ui';
import { CardStack } from '../components/cards/CardStack';
import { countWord } from '../logic/words';
import { fmtClock } from '../lib/time';
import { Tag } from '../components/ui';
import { MoodGlyph } from '../components/DayRing';
import { Ledger } from './Ledger';
import { dueChecks } from '../logic/checks';
import { bodySeries, measure, readMeasure } from '../logic/body';
import { SafetyNotice } from '../components/SafetyNotice';
import type { View } from '../state/view';


function Head({ title, lede, pill }: { title: string; lede: string; pill?: string }) {
  return (
    <div className="page-head">
      <div><h1 className="t-title">{title}</h1><p className="t-lede">{lede}</p></div>
      {pill && <span className="note-pill">{pill}</span>}
    </div>
  );
}

function skippedLine(n: number) {
  return n > 0 ? <p className="t-small">{`You skipped ${n} ${n === 1 ? 'card' : 'cards'} this week. Nothing changes, and only you can see that count.`}</p> : null;
}

function WhatTheToolDid({ v }: { v: View }) {
  const last = v.resolutions.slice(0, 3);
  return (
    <section className="panel panel--tight" aria-label="What the tool did with your answers">
      <div className="t-head">What the tool did with your answers</div>
      {last.length === 0 ? <p className="t-small">Nothing yet. When you answer a card, what the tool changed shows up here.</p> : (
        <div className="rows">
          {last.map(r => (
            <div className="did-row" key={r.cardId}>
              <div><div className="t-head">{r.title}</div>
                <div className="t-small act-text">{r.status === 'not-right' ? `Day ${D(r.day)}. You said: ${r.choice}` : `Day ${D(r.day)}. You chose: ${r.choice}`}</div></div>
              <p className="t-stmt-sm did-effect">{r.effect}</p>
            </div>
          ))}
        </div>
      )}
      {skippedLine(v.skippedThisWeek)}
    </section>
  );
}

function LineCrossed({ v }: { v: View }) {
  const ui = useUI();
  const nav = useNavigate();
  const c = v.lineCrossed;
  return (
    <>
      <SafetyNotice v={v} />
      {c && !c.fixed && (
        <section className="panel panel--act" aria-label="Agreed before launch">
          <div className="t-label act-text">Agreed before launch</div>
          <p className="t-stmt-sm">{`On day ${D(c.day)} a line you set before launch was crossed. Your flight surgeon was told this, and only this:`}</p>
          <p className="t-quote">{`“${c.message}”`}</p>
          <div className="btn-row">
            <button className="btn" onClick={() => ui.openShareLog(true)}>Open share log</button>
            <button className="btn btn--quiet" onClick={() => nav('/profile/sharing')}>Change this rule</button>
          </div>
        </section>
      )}
    </>
  );
}

const lowerFirst = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
/** "Suit prep, lunch, experiments, gym and a call with Sam." from the day's timeline. */
export function daySummary(v: View): string {
  const parts = v.blocksToday.filter(b => b.kind !== 'sleep').map(b => (b.kind === 'call' ? `a ${lowerFirst(b.label)}` : lowerFirst(b.label)));
  if (!parts.length) return 'A rest day, with nothing on the timeline.';
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `${list.charAt(0).toUpperCase()}${list.slice(1)}.`;
}

function Tonight({ v }: { v: View }) {
  const nav = useNavigate();
  const add = appStore.getState().add;
  const marks = v.marksToday;
  const entry = v.entryToday;
  const dismissed = v.events.some(e => e.type === 'dismiss' && e.what === 'tonight' && e.day === v.day);
  const sleep = v.scenario.days[v.day - 1];
  return (
    <section className="panel panel--tight panel--act" aria-label="Your day">
      <div className="panel-title-row"><div className="t-label act-text">{`Your day ${D(v.day)}`}</div>
        <a href="#/journal" className="t-head link-tap" onClick={e => { e.preventDefault(); nav('/journal'); }}>Open your journal</a></div>
      <p className="t-stmt-sm">{daySummary(v)}</p>
      <p className="t-small num">{`Slept ${fmtClock(sleep.onsetMin)} to ${fmtClock(sleep.wakeMin)}, from your wearable.`}</p>
      {marks.length > 0 && (
        <div className="rows">
          {marks.map((m, i) => (
            <div className="mark-line" key={i}><span><MoodGlyph mood={m.mood} /> <b className="num">{fmtClock(m.min)}</b>{m.blockLabel ? `\u00a0 during ${m.blockLabel}` : ''}</span><span className="t-small">{m.mood === 'high' ? 'High press' : 'Low press'}</span></div>
          ))}
        </div>
      )}
      {entry ? (
        <p className="t-body">{`Tonight’s entry is written: ${entry.segments.length} ${entry.segments.length === 1 ? 'thing' : 'things'}, tagged.`}</p>
      ) : (
        <div className="btn-row">
          <button className="btn btn--primary" onClick={() => nav('/journal', { state: { focus: true } })}>Write tonight’s entry</button>
          {!dismissed && <button className="btn btn--quiet" onClick={() => add({ type: 'dismiss', what: 'tonight' })}>Not tonight</button>}
        </div>
      )}
      <div className="t-foot">Your diary is for you. Nobody else reads it, and it is not graded. One fixed line: a word check for risk to you or to others runs on this device.</div>
    </section>
  );
}

function CheckPanel({ v }: { v: View }) {
  const nav = useNavigate();
  const [all, setAll] = useState(false);
  const due = dueChecks(v);
  const top = due[0];
  const am = v.checks.some(c => c.day === v.day && c.slot === 'am');
  const go = (k: string, testOnly = false) => nav(k === 'reaction' ? `/check?slot=${am ? 'pm' : 'am'}${testOnly ? '&test=1' : ''}` : `/check?kind=${k}`);
  const sinceText = (n: number) => (n === 0 ? 'done today' : n === 1 ? 'last done yesterday' : `last done ${n} days ago`);
  const r = readMeasure(measure('speed'), bodySeries(v.scenario, v.checks, v.day).speed, v.day);
  return (
    <section className="panel panel--tight" aria-label="Today’s check">
      <div className="panel-title-row"><div className="t-head">Today’s check</div><Tag>Rotates with what has changed</Tag></div>
      {top.score < 0 ? <p className="t-body">Every check is done for today.</p> : (
        <>
          <p className="t-stmt-sm">{top.def.title}</p>
          <p className="t-small">{`${top.def.length}. ${top.def.basis}.`}</p>
          <p className="t-body">{top.reason ? `Why today: ${top.reason.charAt(0).toLowerCase()}${top.reason.slice(1)}` : `Why today: ${sinceText(top.since)}.`}</p>
          {top.def.kind === 'reaction' && r.last && <p className="t-small num">{`Last test: ${r.last.v.toFixed(2)} responses per second.${r.usual !== null ? ` Your usual is ${r.usual.toFixed(2)}.` : ''}`}</p>}
          <div className="btn-row"><button className="btn btn--primary" onClick={() => go(top.def.kind)}>{`Start the ${top.def.title.toLowerCase()}`}</button></div>
        </>
      )}
      <button className="link-btn t-small check-more" aria-expanded={all} onClick={() => setAll(a => !a)}>{all ? 'Hide the other checks' : 'Other checks'}</button>
      {all && (
        <ul className="rows check-list">
          {due.filter(d => d !== top).map(d => (
            <li key={d.def.kind} className="check-row">
              <div><div className="t-head">{d.def.title}</div><div className="t-small">{d.reason ?? sinceText(d.since)}</div></div>
              {!d.doneToday && <button className="btn btn--sm" onClick={() => go(d.def.kind, d.def.kind === 'reaction')}>Take now</button>}
            </li>
          ))}
        </ul>
      )}
      <p className="t-foot">Only one check is offered at a time. The others stay here when you want one.</p>
    </section>
  );
}

export function Today() {
  const v = useView();
  const day = useApp(s => s.day);
  const lastDays = Math.min(56, day);
  const withEntries = new Set(v.entries.filter(e => e.day > day - lastDays).map(e => e.day)).size;
  const pill = day > 14 ? `Based on entries from ${withEntries} of the last ${lastDays} days` : undefined;

  let head: JSX.Element, wide: JSX.Element;
  if (day <= 14) {
    head = <Head title="Still learning your usual" lede="For the first 14 days the tool only watches. It will not suggest anything until day 15." />;
    wide = (
      <>
        <section className="panel" aria-label="Settling in">
          <div className="dots" role="img" aria-label={`Learning day ${day} of 14`}>{Array.from({ length: 14 }, (_, i) => <i key={i} className={i < day ? 'on' : ''} />)}</div>
          <p className="t-stmt-sm num">{`Learning day ${day} of 14.`}</p>
        </section>
        <WhatTheToolDid v={v} />
      </>
    );
  } else if (v.openCards.length) {
    head = <Head title="Does this match?" pill={pill}
      lede={`${countWord(v.raisedCards.length)} the tool noticed this week. Each one ends in something you can do, or in telling the tool it is wrong.`} />;
    wide = <><LineCrossed v={v} /><CardStack v={v} /><WhatTheToolDid v={v} /></>;
  } else if (v.raisedCards.length) {
    head = <Head title="Nothing left to look at this week" pill={pill}
      lede="You have answered or skipped everything the tool noticed. It will look again at the end of the week." />;
    wide = <><LineCrossed v={v} /><WhatTheToolDid v={v} /></>;
  } else {
    head = <Head title="On your usual pattern" pill={pill}
      lede="Nothing this week looks different from your own usual. The tool stays quiet until something does." />;
    wide = <><LineCrossed v={v} /><WhatTheToolDid v={v} /></>;
  }
  return (
    <>
    {head}
    <div className="cols">
      <div className="col col--wide">{wide}</div>
      <div className="col col--narrow">
        <Tonight v={v} />
        <CheckPanel v={v} />
      </div>
    </div>
    <Ledger />
    </>
  );
}

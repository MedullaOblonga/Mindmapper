import { useNavigate } from 'react-router-dom';
import { useView } from '../state/useView';
import { useApp, appStore } from '../state/store';
import { useUI } from '../state/ui';
import { CardStack } from '../components/cards/CardStack';
import { countWord } from '../logic/words';
import { fmtClock } from '../lib/time';
import { markNow } from '../logic/mark';
import { Tag } from '../components/ui';
import { WristInline } from '../components/Wrist';
import { bodySeries, measure, readMeasure } from '../logic/body';
import type { View } from '../state/view';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

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
                <div className="t-small act-text">{r.status === 'not-right' ? `Day ${r.day}. You said: ${r.choice}` : `Day ${r.day}. You chose: ${r.choice}`}</div></div>
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
  if (!v.lineCrossed) return null;
  return (
    <section className="panel panel--act" aria-label="Agreed before launch">
      <div className="t-label act-text">Agreed before launch</div>
      <p className="t-stmt-sm">{`On day ${v.lineCrossed.day} a line you set before launch was crossed. Your flight surgeon was told this, and only this:`}</p>
      <p className="t-quote">{`“${v.lineCrossed.message}”`}</p>
      <div className="btn-row">
        <button className="btn" onClick={() => ui.openShareLog(true)}>Open share log</button>
        <button className="btn btn--quiet" onClick={() => nav('/plan/sharing')}>Change this rule</button>
      </div>
    </section>
  );
}

function Tonight({ v }: { v: View }) {
  const nav = useNavigate();
  const dismissed = v.events.some(e => e.type === 'dismiss' && e.day === v.day);
  const add = appStore.getState().add;
  const marks = v.marksToday;
  const entry = v.entryToday;
  if (dismissed && !entry) return null;
  const compose = () => nav('/journal', { state: { focus: true } });
  return (
    <section className="panel panel--tight panel--act" aria-label="Tonight">
      <div className="t-label act-text">Tonight</div>
      {entry ? (
        <>
          <p className="t-stmt-sm">{`Written. ${entry.segments.length} ${entry.segments.length === 1 ? 'thing' : 'things'}, tagged.`}</p>
          <a href="#/journal" className="t-head link-tap" onClick={e => { e.preventDefault(); nav('/journal'); }}>Open today’s entry</a>
        </>
      ) : (
        <>
          <p className="t-stmt-sm">{marks.length ? `${cap(NUM[marks.length] ?? String(marks.length))} ${marks.length === 1 ? 'moment' : 'moments'} you marked today ${marks.length === 1 ? 'is' : 'are'} waiting.` : 'Anything from today worth keeping?'}</p>
          {marks.length > 0 && (
            <div className="rows">
              {marks.map((m, i) => (
                <div className="mark-line" key={i}><span><b className="num">{fmtClock(m.min)}</b>{m.blockLabel ? `  during ${m.blockLabel}` : ''}</span><span className="t-small">Marked on your wrist</span></div>
              ))}
            </div>
          )}
          <div className="btn-row">
            <button className="btn btn--primary" onClick={compose}>Speak or write</button>
            <button className="btn btn--quiet" onClick={() => add({ type: 'dismiss', what: 'tonight' })}>Not tonight</button>
            <button className="btn btn--quiet" onClick={() => add({ type: 'mark', ...markNow(v) })}>Mark this moment</button>
          </div>
        </>
      )}
      <div className="t-foot">Your diary is for you. Nobody else reads it, and it is not graded.</div>
    </section>
  );
}

function CheckPanel({ v }: { v: View }) {
  const nav = useNavigate();
  const am = v.checks.some(c => c.day === v.day && c.slot === 'am');
  const pm = v.checks.some(c => c.day === v.day && c.slot === 'pm');
  const scheduled = v.day % 4 === 0;
  const next = am ? 'pm' : 'am';
  const r = readMeasure(measure('speed'), bodySeries(v.scenario, v.checks, v.day).speed, v.day);
  const last = [...v.checks].reverse().find(c => c.counts);
  return (
    <section className="panel panel--tight" aria-label="Reaction speed test">
      <div className="panel-title-row"><div className="t-head">Reaction speed test</div><Tag>Modelled on NASA’s Reaction Self-Test</Tag></div>
      <div className="t-body">A 3-minute test of attention. It is measured, not rated by you. Scheduled every fourth day, and yours to take whenever you want one.</div>
      {last && r.last && (
        <p className="t-small num">{`Last test, day ${last.day} ${last.slot === 'am' ? 'morning' : 'evening'}: ${r.last.v.toFixed(2)} responses per second.${r.usual !== null ? ` Your usual is ${r.usual.toFixed(2)}.` : ''} ${r.statusText}.`}</p>
      )}
      {scheduled && <div className="t-head">Scheduled check today</div>}
      {scheduled && <div className="t-small">Two dials and the test, about 4 minutes.</div>}
      {am && pm ? <p className="t-small">{scheduled ? 'This evening’s check is recorded.' : 'Both of today’s tests are recorded.'}</p>
        : (
          <div className="btn-row">
            {scheduled && <button className="btn" onClick={() => nav(`/check?slot=${next}`)}>{am ? 'Start this evening’s check' : 'Start this morning’s check'}</button>}
            <button className="btn" onClick={() => nav(`/check?slot=${next}&test=1`)}>{scheduled ? 'Test only' : 'Take the test now'}</button>
          </div>
        )}
      {am && !pm && <p className="t-small">{scheduled ? 'This morning’s check is recorded.' : 'One test is recorded today.'}</p>}
      <a href="#/patterns/body" className="t-head link-tap" onClick={e => { e.preventDefault(); nav('/patterns/body'); }}>See it in Body trends</a>
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
          <div className="dots" role="img" aria-label={`Day ${day} of 14`}>{Array.from({ length: 14 }, (_, i) => <i key={i} className={i < day ? 'on' : ''} />)}</div>
          <p className="t-stmt-sm num">{`Day ${day} of 14.`}</p>
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
        <WristInline v={v} />
      </div>
    </div>
    </>
  );
}

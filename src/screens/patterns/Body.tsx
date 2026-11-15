import { useMemo, useState } from 'react';
import { useView } from '../../state/useView';
import { useUI } from '../../state/ui';
import { Tag, DATA_TAG } from '../../components/ui';
import { TrendChart } from '../../components/TrendChart';
import { BASIS_LABEL, NASA, SYSTEMS, bodyDraft, bodyReadings, fmt, rangeText, type Reading, type System } from '../../logic/body';
import type { View } from '../../state/view';

const pct = (x: number, dec = 0) => `${(x * 100).toFixed(dec)}%`;
const ci = (c: number[], dec = 0) => `${(c[0] * 100).toFixed(dec)} to ${(c[1] * 100).toFixed(dec)}%`;

/** Where the plotted numbers come from. Reaction tests can be replayed NASA sessions, simulated ones or the astronaut's own. */
function originText(r: Reading, v: View): string {
  if (r.def.id !== 'speed') return DATA_TAG[r.def.origin];
  const days = new Set(r.points.map(p => Math.floor(p.day)));
  const origins = [...new Set(v.checks.filter(c => c.counts && days.has(c.day)).map(c => c.origin))];
  return origins.length ? origins.map(o => (o === 'user' ? 'Your tests' : DATA_TAG[o])).join(' + ') : DATA_TAG.sim;
}

function Status({ r }: { r: Reading }) {
  const ring = r.status === 'sustained' || r.status === 'once';
  return <span className={`trend-status ${r.status === 'sustained' ? 'trend-status--out' : ''}`}><i className={`pt ${ring ? 'pt--out' : 'pt--in'}`} aria-hidden="true" />{r.statusText}</span>;
}

function TrendCard({ r, v }: { r: Reading; v: View }) {
  const range = rangeText(r);
  return (
    <section className="panel panel--tight trend-card" aria-label={r.def.name}>
      <div className="trend-head">
        <div><h2 className="t-head">{r.def.name}</h2><div className="t-small">{r.def.source}</div></div>
        {r.last && <div className="t-stmt-sm num trend-val">{fmt(r, r.last.v)} <span className="t-small">{r.def.unit}</span></div>}
      </div>
      <TrendChart r={r} day={v.day} />
      <Status r={r} />
      {range && <div className="t-small num">{`Inside ${r.def.lineName}: ${range}.${r.usual !== null ? ` Your usual: ${fmt(r, r.usual)} ${r.def.unit}.` : ''}`}</div>}
      <p className="t-small">{r.def.plain}</p>
      <div className="trend-tags"><Tag>{originText(r, v)}</Tag><Tag>{BASIS_LABEL[r.def.basis]}</Tag></div>
    </section>
  );
}

function TableView({ rs, day }: { rs: Reading[]; day: number }) {
  const days = Array.from({ length: 7 }, (_, i) => day - 6 + i).filter(d => d >= 1);
  return (
    <section className="panel" aria-label="Last 7 days as a table">
      <h2 className="t-head">Last 7 days as a table</h2>
      <div className="table-scroll">
        <table className="real-table num">
          <thead><tr><th className="t-label" scope="col">Measure</th>{days.map(d => <th key={d} className="t-label" scope="col">{`Day ${d}`}</th>)}<th className="t-label" scope="col">Inside its line</th></tr></thead>
          <tbody>
            {rs.map(r => (
              <tr key={r.def.id}>
                <th scope="row" className="t-body">{r.def.name} <span className="t-small">({r.def.unit})</span></th>
                {days.map(d => {
                  const ps = r.all.filter(p => Math.floor(p.day) === d);
                  return <td key={d}>{ps.map((p, i) => <span key={p.day}>{i > 0 && ' / '}{r.out(p) ? <b>{`${fmt(r, p.v)}*`}</b> : fmt(r, p.v)}</span>)}</td>;
                })}
                <td className="t-small">{rangeText(r) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="t-small">* outside its line. Two values in one day are the morning and evening tests.</p>
    </section>
  );
}

export function Body() {
  const v = useView();
  const ui = useUI();
  const [sys, setSys] = useState<System | 'all'>('all');
  const [table, setTable] = useState(false);
  const all = useMemo(() => bodyReadings(v.scenario, v.checks, v.day), [v.scenario, v.checks, v.day]);
  const rs = all.filter(r => sys === 'all' || r.def.system === sys);
  const far = all.filter(r => r.status === 'sustained');
  const once = all.filter(r => r.status === 'once');
  const talk = (route: string) => ui.openTalk({ route, draft: bodyDraft(all, v.day) });
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">Body trends</h1>
        <p className="t-lede">Things that are measured, not rated by you. Each one sits against its own line, and nothing is added up into one number.</p></div>
        <Tag data="sim" /></div>

      <section className={`panel panel--tight ${far.length ? 'panel--act' : ''}`} aria-label="Worth a second look">
        <div className="t-label">Worth a second look</div>
        {far.length === 0
          ? <p className="t-stmt-sm">Everything measured here is inside its line.</p>
          : <ul className="plain-list">{far.map(r => <li key={r.def.id} className="t-stmt-sm">{`${r.def.name}: ${fmt(r, r.last!.v)} ${r.def.unit}. ${r.statusText}.`}</li>)}</ul>}
        {once.length > 0 && <p className="t-small">{`Left alone for now: ${once.map(r => r.def.name.toLowerCase()).join(', ')}. One reading outside a line is not a pattern.`}</p>}
        {far.length > 0 && (
          <>
            <p className="t-small">Outside a line is not a verdict. You decide whether to send it. You see and edit the words first.</p>
            <div className="btn-row">
              <button className="btn btn--primary" onClick={() => talk('body')}>Crew medical officer</button>
              <button className="btn" onClick={() => talk('sharing')}>Flight surgeon</button>
            </div>
          </>
        )}
      </section>

      <div className="trend-tools">
        <div className="btn-row" role="group" aria-label="Body system">
          {SYSTEMS.map(s => <button key={s.id} className="btn btn--sm" aria-pressed={sys === s.id} onClick={() => setSys(s.id)}>{s.label}</button>)}
        </div>
        <button className="btn btn--sm" onClick={() => setTable(t => !t)}>{table ? 'Show charts' : 'Show as table'}</button>
      </div>
      <p className="t-small">Last 28 days. The shaded band is the inside of each line and the dashed line is your own usual, taken from days 15 to 56. A ring marks a reading outside its line. Hover or tap a chart for values.</p>

      {table ? <TableView rs={rs} day={v.day} /> : <div className="trend-grid">{rs.map(r => <TrendCard key={r.def.id} r={r} v={v} />)}</div>}

      <section className="panel" aria-label="Where each line comes from">
        <h2 className="t-head">Where each line comes from</h2>
        <div className="table-scroll">
          <table className="real-table">
            <thead><tr><th className="t-label" scope="col">Measure</th><th className="t-label" scope="col">Worth a second look when</th><th className="t-label" scope="col">Taken from</th><th className="t-label" scope="col"> </th></tr></thead>
            <tbody>
              {all.map(r => (
                <tr key={r.def.id}><th scope="row" className="t-body">{r.def.name}</th><td className="t-body">{r.def.rule}</td><td className="t-small">{r.def.from}</td><td><Tag>{BASIS_LABEL[r.def.basis]}</Tag></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="t-small">{`How the reaction line was set: in NASA’s bed-rest records ${NASA.people} healthy volunteers took ${NASA.sessions} tests after their own usual was fixed. Nobody was unwell, so every crossing is a false alert. A single test crossed the line in ${pct(NASA.single)} of tests (95% interval ${ci(NASA.singleCI)}); two in a row did in ${pct(NASA.twoInRow, 1)} (${ci(NASA.twoInRowCI, 1)}). Replayed on one volunteer’s ${NASA.aresSessions} simple reaction tests, the same line gave ${pct(NASA.aresSingle, 1)} and ${pct(NASA.aresTwoInRow, 1)}. These records show how often the line fires in well people. They cannot show how often it catches a real change.`}</p>
        <p className="t-small">The collar-worn monitor is modelled on NASA’s Personal CO2 Monitor, flown as a technology demonstration on the ISS. No published figure was found for how far worn readings sit above cabin readings, so the values here are illustrative. 3.0 mmHg is about 3,900 parts per million at sea-level cabin pressure.</p>
      </section>
    </>
  );
}

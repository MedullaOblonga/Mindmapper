import { useMemo, useState } from 'react';
import { D } from '../../config';
import { useView } from '../../state/useView';
import { useUI } from '../../state/ui';
import { Tag, DATA_TAG } from '../../components/ui';
import { TrendChart } from '../../components/TrendChart';
import { BASIS_LABEL, NASA, bodyDraft, bodyReadings, fmt, rangeText, type Reading, type MeasureId } from '../../logic/body';
import { delayMin, delayWords } from '../../lib/delay';
import type { View } from '../../state/view';

/** The same text, addressed to the flight surgeon about the crew member. */
const their = (t: string) => t.replace(/\baround you\b/g, 'around the crew member').replace(/\bYour\b/g, 'Their').replace(/\byour\b/g, 'their').replace(/\byou\b/g, 'they');
const forSurgeon = (r: Reading): Reading => ({ ...r, statusText: their(r.statusText),
  def: { ...r.def, name: their(r.def.name), plain: their(r.def.plain), lineName: their(r.def.lineName), rule: their(r.def.rule), from: their(r.def.from) } });

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

function TrendCard({ r, v, surgeon }: { r: Reading; v: View; surgeon?: boolean }) {
  const range = rangeText(r);
  return (
    <section className="trend-card" aria-label={r.def.name}>
      <div className="trend-head">
        <div><h3 className="t-head">{r.def.name}</h3><div className="t-small">{r.def.source}</div></div>
        {r.last && <div className="t-stmt-sm num trend-val">{fmt(r, r.last.v)} <span className="t-small">{r.def.unit}</span></div>}
      </div>
      <TrendChart r={r} day={v.day} />
      <Status r={r} />
      {range && <div className="t-small num trend-range">{`Inside ${r.def.lineName}: ${range}.${r.usual !== null ? ` ${surgeon ? 'Their' : 'Your'} usual: ${fmt(r, r.usual)} ${r.def.unit}.` : ''}`}</div>}
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
          <thead><tr><th className="t-label" scope="col">Measure</th>{days.map(d => <th key={d} className="t-label" scope="col">{`Day ${D(d)}`}</th>)}<th className="t-label" scope="col">Inside its line</th></tr></thead>
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

/** Both collar CO2 readings on one chart: awake and asleep, against the same NASA limit. */
function CO2Card({ day, night, v, surgeon }: { day: Reading; night: Reading; v: View; surgeon?: boolean }) {
  const worse = day.status === 'sustained' ? day : night.status === 'sustained' ? night : day.status === 'once' ? day : night;
  return (
    <section className="trend-card" aria-label={surgeon ? 'CO2 around the crew member' : 'CO2 around you'}>
      <div className="trend-head">
        <div><h3 className="t-head">{surgeon ? 'CO2 around the crew member' : 'CO2 around you'}</h3><div className="t-small">Collar-worn monitor, awake and asleep</div></div>
        <div className="t-stmt-sm num trend-val">{`${day.last ? fmt(day, day.last.v) : '—'} / ${night.last ? fmt(night, night.last.v) : '—'}`} <span className="t-small">mmHg</span></div>
      </div>
      <TrendChart r={day} r2={night} names={['Awake', 'Asleep']} day={v.day} />
      <Status r={worse} />
      <div className="trend-tags"><Tag>{originText(day, v)}</Tag><Tag>{BASIS_LABEL[day.def.basis]}</Tag></div>
    </section>
  );
}

const SECTIONS: { id: string; title: string; ids: MeasureId[] }[] = [
  { id: 'sleep-temp-reaction', title: 'Sleep, temperature and reaction speed', ids: ['sleep', 'temp', 'speed'] },
  { id: 'heart-blood', title: 'Resting heart rate, blood pressure and blood sugar', ids: ['rhr', 'sbp', 'glucose'] },
  { id: 'exercise-mass-air', title: 'Exercise, body mass and the air around you', ids: ['exercise', 'mass', 'co2day', 'co2sleep'] },
];

/** Body trends. The astronaut's own screen by default; with `surgeon`, the same measures as the flight surgeon sees them.
    Measured values are shared with the flight surgeon as routine. Nothing here is written or rated by the astronaut. */
export function Body({ surgeon = false }: { surgeon?: boolean }) {
  const v = useView();
  const ui = useUI();
  const [table, setTable] = useState(false);
  const all = useMemo(() => { const rs = bodyReadings(v.scenario, v.checks, v.day); return surgeon ? rs.map(forSurgeon) : rs; }, [v.scenario, v.checks, v.day, surgeon]);
  const far = all.filter(r => r.status === 'sustained');
  const once = all.filter(r => r.status === 'once');
  const talk = (route: string) => ui.openTalk({ route, draft: bodyDraft(all, v.day) });
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">Body trends</h1>
        <p className="t-lede">{surgeon
          ? 'Measured values for this crew member, shared with you as routine medical monitoring. Nothing here is written or rated by them, and nothing is added up into one number.'
          : 'Things that are measured, not rated by you. Each one sits against its own line, and nothing is added up into one number.'}</p>
        {!surgeon && <p className="t-small">Your flight surgeon sees these measures as routine medical monitoring. Your diary is not part of it.</p>}</div>
        {surgeon ? <span className="note-pill">{`As received: Earth is about ${delayWords(delayMin(v.day))} behind today`}</span> : <Tag data="sim" />}</div>

      <section className={`panel panel--tight ${far.length ? 'panel--act' : ''}`} aria-label="Worth a second look">
        <div className="t-label">Worth a second look</div>
        {far.length === 0
          ? <p className="t-stmt-sm">Everything measured here is inside its line.</p>
          : <ul className="plain-list">{far.map(r => <li key={r.def.id} className="t-stmt-sm">{`${r.def.name}: ${fmt(r, r.last!.v)} ${r.def.unit}. ${r.statusText}.`}</li>)}</ul>}
        {once.length > 0 && <p className="t-small">{`Left alone for now: ${once.map(r => r.def.name.toLowerCase()).join(', ')}. One reading outside a line is not a pattern.`}</p>}
        {surgeon && far.length > 0 && <p className="t-small">Outside a line is not a verdict. The crew member sees the same list and can add a note in their own words.</p>}
        {!surgeon && far.length > 0 && (
          <>
            <p className="t-small">Outside a line is not a verdict. Your flight surgeon already sees these numbers. You can add a note in your own words; you see and edit it first.</p>
            <div className="btn-row">
              <button className="btn btn--primary" onClick={() => talk('body')}>Crew medical officer</button>
              <button className="btn" onClick={() => talk('sharing')}>Flight surgeon</button>
            </div>
          </>
        )}
      </section>

      <div className="trend-tools">
        <p className="t-small">{`Last 28 days. The shaded band is the inside of each line; the dashed line is ${surgeon ? 'the crew member’s' : 'your'} own usual. A ring marks a reading outside its line. Hover or tap a chart for values.`}</p>
        <button className="btn btn--sm" onClick={() => setTable(t => !t)}>{table ? 'Show charts' : 'Show as table'}</button>
      </div>

      {table ? <TableView rs={all} day={v.day} /> : SECTIONS.map(sec => {
        const rs = sec.ids.map(id => all.find(r => r.def.id === id)).filter((r): r is Reading => !!r);
        const co2 = rs.filter(r => r.def.id === 'co2day' || r.def.id === 'co2sleep');
        const rest = rs.filter(r => !co2.includes(r));
        const out = rs.filter(r => r.status === 'sustained').length;
        return (
          <section key={sec.id} className="panel panel--tight trend-group" aria-label={surgeon ? their(sec.title) : sec.title}>
            <div className="trend-section-head">
              <h2 className="t-head trend-section-title">{surgeon ? their(sec.title) : sec.title}</h2>
              <span className="t-small">{out ? `${out} worth a second look` : 'All inside their lines'}</span>
            </div>
            <div className="trend-grid">
              {rest.map(r => <TrendCard key={r.def.id} r={r} v={v} surgeon={surgeon} />)}
              {co2.length === 2 && <CO2Card day={co2[0]} night={co2[1]} v={v} surgeon={surgeon} />}
            </div>
          </section>
        );
      })}

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

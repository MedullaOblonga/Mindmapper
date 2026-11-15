import { useNavigate } from 'react-router-dom';
import { useView } from '../../state/useView';
import { DayBuilder } from '../../components/DayBuilder';
import { dayPartSentence } from '../../logic/ring';
import { params } from '../../data/params';
import { Mark, MarkLegend, Tag } from '../../components/ui';
import type { Felt } from '../../types';

const PARTS = [['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']] as const;

export function Days() {
  const v = useView();
  const nav = useNavigate();
  const g = params.dayPartFelt;
  const showGrid = v.day >= g.days[g.days.length - 1];
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">Rebuild your day, and how it felt</h1>
        <p className="t-lede">The tool draws your day from your wearable and the mission timeline. You fix it and tap how each stretch felt.</p></div></div>
      <DayBuilder v={v} onWrite={prefill => nav('/journal', { state: { prefill, focus: true } })} />
      {showGrid && (
        <section className="panel" aria-label="Saved days">
          <div className="panel-title-row"><h2 className="t-head">{`Saved days ${g.days[0]} to ${g.days[g.days.length - 1]}`}</h2><Tag data="sim" /></div>
          <table className="grid-days" aria-label="How each part of the day felt">
            <thead><tr><th scope="col"><span className="sr-only">Part of day</span></th>{g.days.map(d => <th key={d} scope="col" className="t-small num">{`Day ${d}`}</th>)}</tr></thead>
            <tbody>{PARTS.map(([k, label]) => (
              <tr key={k}><th scope="row" className="t-small">{label}</th>{(g[k] as string[]).map((f, i) => <td key={i}><Mark felt={f as Felt} /></td>)}</tr>
            ))}</tbody>
          </table>
          <p className="t-stmt-sm">{dayPartSentence(g)}</p>
          <MarkLegend />
        </section>
      )}
    </>
  );
}

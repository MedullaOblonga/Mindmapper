import { useState } from 'react';
import { D, USUAL_DAYS } from '../../config';
import { useNavigate } from 'react-router-dom';
import { useView } from '../../state/useView';
import { marksFor, moodWeek } from '../../state/view';
import { median } from '../../lib/stats';
import { weekOf, fmtClock } from '../../lib/time';
import { MoodGlyph } from '../../components/DayRing';
import { Tag } from '../../components/ui';
import type { MoodMark } from '../../types';

function where(marks: MoodMark[], mood: 'high' | 'low'): [string, number][] {
  const c = new Map<string, number>();
  for (const m of marks) if (m.mood === mood) {
    const k = m.blockLabel ?? (m.min >= 1260 ? 'Late evening' : 'Free time');
    c.set(k, (c.get(k) ?? 0) + 1);
  }
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

const W = 720, H = 260, L = 44, R = 12, T = 18, B = 30;

/** Diverging daily bars: high presses up, low presses down, your usual as dashed lines. */
function DailyChart({ rows, uh, ul }: { rows: { day: number; high: number; low: number }[]; uh: number | null; ul: number | null }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...rows.map(r => Math.max(r.high, r.low)), uh ?? 0, ul ?? 0);
  const mid = T + (H - T - B) / 2, half = (H - T - B) / 2;
  const y = (n: number) => (n / max) * half;
  const step = (W - L - R) / rows.length, bw = Math.max(4, step - 4);
  const h = hover !== null ? rows[hover] : null;
  return (
    <div className="tc">
      <p className="t-small tc-readout num" aria-live="polite">{h ? `Day ${D(h.day)}: ${h.high} high, ${h.low} low` : 'Hover or tap a day for its count.'}</p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`High and low presses per day, days ${D(rows[0]?.day ?? 1)} to ${D(rows[rows.length - 1]?.day ?? 1)}. ${rows.map(r => `Day ${D(r.day)}: ${r.high} high, ${r.low} low`).join('; ')}`}
        onMouseLeave={() => setHover(null)}>
        <line x1={L} x2={W - R} y1={mid} y2={mid} className="tc-axis" />
        {uh !== null && <line x1={L} x2={W - R} y1={mid - y(uh)} y2={mid - y(uh)} className="tc-usual" />}
        {ul !== null && <line x1={L} x2={W - R} y1={mid + y(ul)} y2={mid + y(ul)} className="tc-usual" />}
        <text x={L - 8} y={mid - half + 4} textAnchor="end" className="tc-ax">High</text>
        <text x={L - 8} y={mid + half} textAnchor="end" className="tc-ax">Low</text>
        <text x={L - 8} y={mid + 4} textAnchor="end" className="tc-ax">0</text>
        {rows.map((r, i) => {
          const x = L + i * step + (step - bw) / 2;
          return (
            <g key={r.day} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              <rect x={L + i * step} y={T} width={step} height={H - T - B} fill="transparent" />
              {r.high > 0 && <rect x={x} y={mid - y(r.high)} width={bw} height={Math.max(1, y(r.high) - 1)} rx={2} className="mb-high" />}
              {r.low > 0 && <rect x={x} y={mid + 1} width={bw} height={Math.max(1, y(r.low) - 1)} rx={2} className="mb-low" />}
              {hover === i && <rect x={L + i * step} y={T} width={step} height={H - T - B} className="mb-hover" />}
              {(r.day % 7 === 1 || i === rows.length - 1) && <text x={L + i * step + step / 2} y={H - 10} textAnchor="middle" className="tc-ax">{`Day ${D(r.day)}`}</text>}
            </g>
          );
        })}
      </svg>
      <div className="legend legend--sm">
        <span><i className="swatch mb-swatch-high" />High presses, above the line</span>
        <span><i className="swatch mb-swatch-low" />Low presses, below the line</span>
        <span><i className="usual-key" />Your usual per day</span>
      </div>
    </div>
  );
}

export function Moments() {
  const v = useView();
  const nav = useNavigate();
  const [table, setTable] = useState(false);
  const Wk = weekOf(v.day);
  const usualWeeks = [3, 4, 5, 6, 7, 8].filter(w => 7 * w <= v.day);
  const uhW = usualWeeks.length >= 3 ? median(usualWeeks.map(w => moodWeek(v.scenario, v.events, w, v.day).high)) : null;
  const ulW = usualWeeks.length >= 3 ? median(usualWeeks.map(w => moodWeek(v.scenario, v.events, w, v.day).low)) : null;
  const now = moodWeek(v.scenario, v.events, Wk, v.day);
  const from = Math.max(1, v.day - 27);
  const rows = Array.from({ length: v.day - from + 1 }, (_, i) => {
    const d = from + i, ms = marksFor(v.scenario, v.events, d);
    return { day: d, high: ms.filter(m => m.mood === 'high').length, low: ms.filter(m => m.mood === 'low').length };
  });
  const weekMarks = Array.from({ length: now.days }, (_, i) => marksFor(v.scenario, v.events, 7 * Wk - 6 + i)).flat();
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">High and low moments</h1>
        <p className="t-lede">How often you pressed each button on your wrist, day by day, next to your own usual. A count of presses, not a grade.</p></div>
        <Tag data="sim" /></div>
      <div className="cols">
        <div className="col col--wide">
          <section className="panel" aria-label="Presses per day">
            <div className="trend-tools">
              <p className="t-stmt-sm">{uhW === null ? `This week so far: ${now.high} high, ${now.low} low. Your usual appears after day ${D(56)}.`
                : `This week so far: ${now.high} high, ${now.low} low. Your usual week: ${uhW} high, ${ulW} low.`}</p>
              <button className="btn btn--sm" aria-pressed={table} onClick={() => setTable(t => !t)}>{table ? 'Show as chart' : 'Show as table'}</button>
            </div>
            {table ? (
              <div className="table-scroll"><table className="real-table num">
                <thead><tr><th scope="col" className="t-label">Day</th><th scope="col" className="t-label">High</th><th scope="col" className="t-label">Low</th></tr></thead>
                <tbody>{[...rows].reverse().map(r => <tr key={r.day}><th scope="row">{`Day ${D(r.day)}`}</th><td>{r.high}</td><td>{r.low}</td></tr>)}</tbody>
              </table></div>
            ) : <DailyChart rows={rows} uh={uhW === null ? null : uhW / 7} ul={ulW === null ? null : ulW / 7} />}
            <p className="t-small">{`The dashed lines are your usual day, from ${USUAL_DAYS}. More low presses is not a verdict: it is a place to look.`}</p>
          </section>
        </div>
        <div className="col col--narrow">
          <section className="panel panel--tight" aria-label="Where they happened">
            <h2 className="t-head">Where they happened this week</h2>
            {(['low', 'high'] as const).map(mood => (
              <div key={mood} className="where">
                <div className="t-label"><MoodGlyph mood={mood} />{mood === 'low' ? ' Low presses' : ' High presses'}</div>
                {where(weekMarks, mood).length === 0 ? <p className="t-small">None yet this week.</p> : (
                  <ul className="plain-list t-body">{where(weekMarks, mood).map(([k, n]) => <li key={k}>{`${k}: ${n}`}</li>)}</ul>
                )}
              </div>
            ))}
            <div className="btn-row"><button className="btn btn--primary" onClick={() => nav('/journal')}>Walk through today</button></div>
          </section>
          <section className="panel panel--tight" aria-label="Today">
            <h2 className="t-head">Today</h2>
            {v.marksToday.length === 0 ? <p className="t-small">No presses yet today.</p> : (
              <ul className="moments">{v.marksToday.map((m, i) => <li key={i} className="t-small"><MoodGlyph mood={m.mood} />{`${fmtClock(m.min)}${m.blockLabel ? ` · ${m.blockLabel}` : ''}`}</li>)}</ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

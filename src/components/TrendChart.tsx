import { useState, type PointerEvent } from 'react';
import { fmt, WINDOW_DAYS, type Point, type Reading } from '../logic/body';

const W = 320, H = 136, L = 38, R = 12, T = 12, B = 22;

export const dayLabel = (p: Point) => (Number.isInteger(p.day) ? `Day ${p.day}` : `Day ${Math.floor(p.day)}, evening`);

/** 28-day line chart of one measure. The shaded band is the inside of its line; ringed points sit outside it.
    Colour never carries status here: outside is a ring, inside is a dot. */
export function TrendChart({ r, day }: { r: Reading; day: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const pts = r.points;
  const d0 = Math.max(1, day - WINDOW_DAYS + 1), d1 = Math.max(day + 0.5, d0 + 1);
  if (!pts.length) return <p className="t-small tc-empty">No readings in the last 28 days.</p>;

  const edges = [r.lo, r.hi, r.usual].filter((x): x is number => x !== null);
  let lo = Math.min(...pts.map(p => p.v), ...edges), hi = Math.max(...pts.map(p => p.v), ...edges);
  const pad = (hi - lo) * 0.12 || Math.max(1, Math.abs(hi) * 0.05);
  lo -= pad; hi += pad;
  const X = (d: number) => L + ((d - d0) / (d1 - d0)) * (W - L - R);
  const Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const bandTop = r.hi === null ? T : Math.max(T, Y(r.hi)), bandBot = r.lo === null ? H - B : Math.min(H - B, Y(r.lo));
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.day).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(' ');
  const lastIdx = pts.length - 1;
  const shown = hover ?? lastIdx;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (!box.width) return;
    const d = d0 + (((e.clientX - box.left) / box.width) * W - L) / (W - L - R) * (d1 - d0);
    let best = 0;
    pts.forEach((p, i) => { if (Math.abs(p.day - d) < Math.abs(pts[best].day - d)) best = i; });
    setHover(best);
  };
  const p = pts[shown];
  const label = `${r.def.name}, last 28 days. Latest ${fmt(r, pts[lastIdx].v)} ${r.def.unit}. ${r.statusText}.`;

  return (
    <div className="tc">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}>
        {bandBot > bandTop && <rect className="tc-band" x={L} y={bandTop} width={W - L - R} height={bandBot - bandTop} rx={2} />}
        <line className="tc-axis" x1={L} x2={W - R} y1={H - B} y2={H - B} />
        {r.lo !== null && <line className="tc-limit" x1={L} x2={W - R} y1={Y(r.lo)} y2={Y(r.lo)} />}
        {r.hi !== null && <line className="tc-limit" x1={L} x2={W - R} y1={Y(r.hi)} y2={Y(r.hi)} />}
        {r.usual !== null && <line className="tc-usual" x1={L} x2={W - R} y1={Y(r.usual)} y2={Y(r.usual)} />}
        <path className="tc-line" d={path} />
        {pts.map((q, i) => (r.out(q) || i === lastIdx || i === hover)
          && <circle key={q.day} className={r.out(q) ? 'tc-out' : 'tc-dot'} cx={X(q.day)} cy={Y(q.v)} r={i === lastIdx || i === hover ? 4.5 : 3.5} />)}
        {hover !== null && <line className="tc-cross" x1={X(p.day)} x2={X(p.day)} y1={T} y2={H - B} />}
        {r.lo !== null && <text className="tc-ax" x={L - 5} y={Y(r.lo) + 3.5} textAnchor="end">{fmt(r, r.lo)}</text>}
        {r.hi !== null && <text className="tc-ax" x={L - 5} y={Y(r.hi) + 3.5} textAnchor="end">{fmt(r, r.hi)}</text>}
        <text className="tc-ax" x={L} y={H - 6}>{`Day ${d0}`}</text>
        <text className="tc-ax" x={W - R} y={H - 6} textAnchor="end">{`Day ${day}`}</text>
      </svg>
      <div className="tc-readout t-small num" aria-hidden="true">{`${dayLabel(p)}: ${fmt(r, p.v)} ${r.def.unit}${r.out(p) ? `, outside ${r.def.lineName}` : ''}`}</div>
    </div>
  );
}

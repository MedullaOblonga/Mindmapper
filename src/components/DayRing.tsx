import { arcPath, ringPoint } from '../logic/ring';
import { fmtClock } from '../lib/time';
import type { Block, BlockKind, MoodMark } from '../types';

export const BLOCK_VAR: Record<BlockKind, string> = {
  sleep: 'var(--c-sleep)', work: 'var(--t-work)', gym: 'var(--t-body)', call: 'var(--t-home)', dinner: 'var(--t-crew)',
  greenhouse: 'var(--t-timeoff)', meal: 'var(--t-self)', free: 'var(--t-other)',
};
export const BLOCK_LEGEND: { kind: BlockKind; label: string }[] = [
  { kind: 'sleep', label: 'Sleep' }, { kind: 'work', label: 'Work' }, { kind: 'meal', label: 'Meals' }, { kind: 'dinner', label: 'Crew dinner' },
  { kind: 'gym', label: 'Gym' }, { kind: 'greenhouse', label: 'Greenhouse' }, { kind: 'call', label: 'Calls home' }, { kind: 'free', label: 'Free time' }];

const C = 230, R = 150, W = 44;

/** A 24-hour ring: midnight at the top, time running clockwise. Shapes, not colours, show high and low presses. */
export function DayRing({ blocks, marks, selected, onSelect, title, sub }: { blocks: Block[]; marks: MoodMark[]; selected: number; onSelect: (i: number) => void; title: string; sub: string }) {
  const label = `${title}. ${blocks.map(b => `${b.label} ${fmtClock(b.startMin)} to ${fmtClock(b.endMin)}${b.felt ? `, felt ${b.felt}` : ''}`).join('; ')}. `
    + `${marks.filter(m => m.mood === 'high').length} high and ${marks.filter(m => m.mood === 'low').length} low presses.`;
  return (
    <svg className="ring" viewBox="0 0 460 460" role="img" aria-label={label}>
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--raised)" strokeWidth={W} />
      {blocks.map((b, i) => i === selected && (
        <path key={`sel-${b.id}`} d={arcPath(b.startMin, b.endMin, R, C, C)} fill="none" stroke="var(--ink)" strokeWidth={W + 8} />
      ))}
      {blocks.map((b, i) => (
        <path key={b.id} d={arcPath(b.startMin, b.endMin, R, C, C)} fill="none" stroke={BLOCK_VAR[b.kind]}
          strokeWidth={W} opacity={b.kind === 'free' ? 0.55 : 1} className="ring-arc" onClick={() => onSelect(i)} />
      ))}
      {blocks.map((b, i) => {
        const s = b.startMin < 0 ? b.startMin + 1440 : b.startMin;
        let e = b.endMin; if (e <= s) e += 1440;
        const p = ringPoint((s + e) / 2, R + W / 2 + 14, C, C);
        if (b.kind === 'free') return null;
        return <circle key={`f-${b.id}`} cx={p.x} cy={p.y} r={7} onClick={() => onSelect(i)}
          fill={b.felt === 'good' ? BLOCK_VAR[b.kind] : b.felt === 'mixed' ? `url(#half-${b.kind})` : 'none'}
          stroke={b.felt ? BLOCK_VAR[b.kind] : 'var(--ink-muted)'} strokeWidth={2} strokeDasharray={b.felt ? undefined : '3 2'} />;
      })}
      <defs>{Object.keys(BLOCK_VAR).map(k => (
        <linearGradient key={k} id={`half-${k}`}><stop offset="50%" stopColor={BLOCK_VAR[k as BlockKind]} /><stop offset="50%" stopColor="transparent" /></linearGradient>
      ))}</defs>
      {marks.map((m, i) => {
        const p = ringPoint(m.min, R - W / 2 - 14, C, C);
        return <circle key={i} cx={p.x} cy={p.y} r={5.5} fill={m.mood === 'high' ? 'var(--ink)' : 'none'} stroke="var(--ink)" strokeWidth={2} />;
      })}
      {[0, 360, 720, 1080].map(m => {
        const p = ringPoint(m, R + W / 2 + 36, C, C);
        return <text key={m} x={p.x} y={p.y} className="ring-hour" textAnchor="middle" dominantBaseline="middle">{fmtClock(m)}</text>;
      })}
      <text x={C} y={C - 10} textAnchor="middle" className="ring-title">{title}</text>
      <text x={C} y={C + 18} textAnchor="middle" className="ring-sub">{sub}</text>
    </svg>
  );
}

export function MoodGlyph({ mood }: { mood: 'high' | 'low' }) {
  return <span className={`mood mood--${mood}`} aria-hidden="true" />;
}

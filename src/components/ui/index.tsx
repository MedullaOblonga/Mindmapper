import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { groupDef } from '../../data/topics';
import { useUI } from '../../state/ui';
import type { DataTag, EvidenceTag, Felt, Group } from '../../types';

export const DATA_TAG: Record<DataTag, string> = { 'nasa-replay': 'Replayed NASA data', 'nasa-method': 'NASA method', sim: 'Simulated', 'ai-sample': 'AI-written sample', user: 'Your entry' };
export const EVIDENCE_TAG: Record<EvidenceTag, string> = { 'nasa-use': 'Used by NASA crews', earth: 'Tested on Earth', analog: 'Tested in analog missions', exp: 'Experimental', placeholder: 'Placeholder threshold' };

export function Tag({ data, evidence, children }: { data?: DataTag; evidence?: EvidenceTag; children?: ReactNode }) {
  return <span className="tag">{children ?? (data ? DATA_TAG[data] : evidence ? EVIDENCE_TAG[evidence] : '')}</span>;
}

export const topicVar = (g: Group) => `var(${groupDef(g).colorVar})`;
export const cssVars = (o: Record<string, string>) => o as unknown as CSSProperties;

const FELT_TITLE: Record<Felt | 'none', string> = { good: 'Felt good', mixed: 'Mixed', hard: 'Felt hard', none: 'Not marked yet' };
export function Mark({ felt, group, color }: { felt: Felt | null; group?: Group; color?: string }) {
  const c = color ?? (group ? topicVar(group) : undefined);
  return <span className={`mark mark--${felt ?? 'none'}`} style={c ? cssVars({ '--c': c }) : undefined} title={FELT_TITLE[felt ?? 'none']} aria-hidden="true" />;
}
export function MarkRow({ good, mixed, hard, group, label }: { good: number; mixed: number; hard: number; group?: Group; label?: string }) {
  const marks: Felt[] = [...Array(good).fill('good'), ...Array(mixed).fill('mixed'), ...Array(hard).fill('hard')];
  return (
    <div className="mark-row" role="img" aria-label={label ?? `${good} felt good, ${mixed} mixed, ${hard} felt hard`}>
      {marks.map((f, i) => <Mark key={i} felt={f} group={group} />)}
    </div>
  );
}
export function MarkLegend({ group }: { group?: Group }) {
  return (
    <div className="legend">
      <span><Mark felt="good" group={group} />Felt good</span>
      <span><Mark felt="mixed" group={group} />Mixed</span>
      <span><Mark felt="hard" group={group} />Felt hard</span>
    </div>
  );
}

export function UsualBar({ value, usual, early, scaleMax, color, label }: { value: number; usual: number | null; early?: number | null; scaleMax: number; color?: string; label: string }) {
  const pct = (x: number) => `${Math.max(0, Math.min(100, (x / scaleMax) * 100))}%`;
  return (
    <div className="usual" role="img" aria-label={label} style={color ? cssVars({ '--c': color }) : undefined}>
      <i style={{ width: pct(value) }} />
      {usual !== null && <b style={{ left: pct(usual) }} />}
      {early !== null && early !== undefined && usual !== null && early !== usual && <s style={{ left: pct(early) }} />}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className="toggle tap-pad" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function Tabs({ tabs, current, onPick, label }: { tabs: { id: string; label: string }[]; current: string; onPick: (id: string) => void; label: string }) {
  return (
    <nav className="tabs" aria-label={label}>
      {tabs.map(t => <button key={t.id} className="story-chip tab" aria-current={t.id === current ? 'page' : undefined} onClick={() => onPick(t.id)}>{t.label}</button>)}
    </nav>
  );
}

/** Focus-trapping overlay used by sheets and drawers. Escape closes and focus returns to the opener. */
function Overlay({ kind, title, onClose, children, width }: { kind: 'sheet' | 'drawer'; title: string; onClose: () => void; children: ReactNode; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    const el = ref.current!;
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],textarea,input,select,[tabindex]:not([tabindex="-1"])'));
    (focusables()[0] ?? el).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close.current(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); const o = opener.current; if (o && document.contains(o)) o.focus(); };
  }, []);
  const id = `ov-${title.replace(/\W+/g, '-')}`;
  return createPortal(
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`panel ${kind}`} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} style={width ? { width } : undefined}>
        <h2 className="t-title sheet-title" id={id}>{title}</h2>
        {children}
      </div>
    </div>, document.body);
}
export const Sheet = (p: { title: string; onClose: () => void; children: ReactNode; width?: number }) => <Overlay kind="sheet" {...p} />;
export const Drawer = (p: { title: string; onClose: () => void; children: ReactNode }) => <Overlay kind="drawer" {...p} />;

export function Toast() {
  const toast = useUI(s => s.toast), key = useUI(s => s.toastKey), clear = useUI(s => s.clearToast);
  useEffect(() => { if (!toast) return; const t = setTimeout(clear, 4000); return () => clearTimeout(t); }, [toast, key, clear]);
  return <div className="toast-region" aria-live="polite">{toast && <div className="toast t-body" key={key}>{toast}</div>}</div>;
}

export function Panel({ children, act, tight, className = '', label }: { children: ReactNode; act?: boolean; tight?: boolean; className?: string; label?: string }) {
  return <section className={`panel ${tight ? 'panel--tight' : ''} ${act ? 'panel--act' : ''} ${className}`} aria-label={label}>{children}</section>;
}

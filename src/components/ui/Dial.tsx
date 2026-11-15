export interface DialDef { id: string; label: string; min: number; max: number; anchors: Record<number, string>; }

export function Dial({ def, value, onChange }: { def: DialDef; value: number | null; onChange: (n: number) => void }) {
  const nums = Array.from({ length: def.max - def.min + 1 }, (_, i) => def.min + i);
  return (
    <fieldset className="dial">
      <legend className="t-head">{def.label}</legend>
      <div className="dial-row" role="radiogroup" aria-label={def.label}>
        {nums.map(n => (
          <button key={n} className="dial-btn num" role="radio" aria-checked={value === n}
            aria-label={def.anchors[n] ? `${n}, ${def.anchors[n]}` : String(n)} onClick={() => onChange(n)}>{n}</button>
        ))}
      </div>
      <div className="dial-ends t-small"><span>{def.anchors[def.min]}</span><span>{def.anchors[def.max]}</span></div>
      <p className="dial-value" aria-live="polite">{value === null ? ' ' : def.anchors[value] ?? String(value)}</p>
    </fieldset>
  );
}

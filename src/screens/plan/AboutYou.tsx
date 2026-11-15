import { useState } from 'react';
import { useView } from '../../state/useView';
import { appStore } from '../../state/store';
import { PERSONA, PERSONA_NOTE, type PersonaCategory, type PersonaItem } from '../../data/persona';
import { Tag } from '../../components/ui';
import type { AppEvent } from '../../state/events';

type ProfileEv = Extract<AppEvent, { type: 'profile' }>;

/** The portrait with the astronaut's own edits applied. */
export function personaWithEdits(events: AppEvent[]): PersonaCategory[] {
  const evs = events.filter((e): e is ProfileEv => e.type === 'profile');
  return PERSONA.map(c => {
    const items: (PersonaItem & { edited?: boolean })[] = c.items.map(i => ({ ...i }));
    for (const e of evs) {
      const it = items.find(i => i.id === e.itemId);
      if (it) { if (e.removed) items.splice(items.indexOf(it), 1); else if (e.text) { it.text = e.text; it.source = 'Changed by you'; it.edited = true; } }
      else if (e.category === c.id && e.text && !e.removed) items.push({ id: e.itemId, text: e.text, source: 'Added by you', edited: true });
    }
    return { ...c, items };
  });
}

function Item({ it }: { it: PersonaItem }) {
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(it.text);
  const add = appStore.getState().add;
  if (edit) return (
    <li className="persona-item">
      <input className="field persona-field" aria-label="Edit this line" value={text} onChange={e => setText(e.target.value)} />
      <div className="btn-row">
        <button className="btn btn--primary btn--sm" disabled={!text.trim()} onClick={() => { add({ type: 'profile', itemId: it.id, text: text.trim() }); setEdit(false); }}>Save</button>
        <button className="btn btn--quiet btn--sm" onClick={() => { setText(it.text); setEdit(false); }}>Cancel</button>
      </div>
    </li>
  );
  return (
    <li className="persona-item">
      <div className="persona-text"><span className="t-body">{it.text}</span><span className="t-small">{it.source}</span></div>
      <div className="btn-row persona-actions">
        <button className="btn btn--quiet btn--sm" onClick={() => setEdit(true)} aria-label={`Change: ${it.text}`}>Change</button>
        <button className="btn btn--quiet btn--sm" onClick={() => add({ type: 'profile', itemId: it.id, removed: true })} aria-label={`Remove: ${it.text}`}>Remove</button>
      </div>
    </li>
  );
}

function Category({ c }: { c: PersonaCategory }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  return (
    <section className="panel panel--tight persona-cat" aria-label={c.title}>
      <h2 className="t-head persona-title">{c.title}</h2>
      <p className="t-small">{`Based on: ${c.basis}`}</p>
      <ul className="persona-list">{c.items.map(i => <Item key={i.id} it={i} />)}</ul>
      {adding ? (
        <div className="btn-row">
          <input className="field persona-field" aria-label={`Add to ${c.title}`} value={text} onChange={e => setText(e.target.value)} />
          <button className="btn btn--primary btn--sm" disabled={!text.trim()} onClick={() => {
            appStore.getState().add({ type: 'profile', itemId: `u-${Date.now().toString(36)}`, category: c.id, text: text.trim() }); setText(''); setAdding(false);
          }}>Add</button>
          <button className="btn btn--quiet btn--sm" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      ) : <div><button className="btn btn--sm" onClick={() => setAdding(true)}>Add a line</button></div>}
      <p className="t-foot">{`The tool uses this for: ${c.usedFor.charAt(0).toLowerCase()}${c.usedFor.slice(1)}`}</p>
    </section>
  );
}

export function AboutYou() {
  const v = useView();
  const cats = personaWithEdits(v.events);
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">About you</h1>
        <p className="t-lede">Who you are, in your own terms: how you work, talk, cope and rest. Yours to change at any time.</p></div>
        <Tag data="sim" /></div>
      <p className="t-small persona-note">{PERSONA_NOTE}</p>
      <div className="persona-grid">{cats.map(c => <Category key={c.id} c={c} />)}</div>
      <p className="t-foot">Sources named are the kinds of interviews and questionnaires a real version would use. The content here is simulated for the demo.</p>
    </>
  );
}

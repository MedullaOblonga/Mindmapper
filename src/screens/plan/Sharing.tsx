import { useState } from 'react';
import { useView } from '../../state/useView';
import { useUI } from '../../state/ui';
import { appStore } from '../../state/store';
import { pastMidnightRun } from '../../logic/signs';
import { currentRule, withThreshold } from '../../logic/rules';
import { delayMin, delayWords } from '../../lib/delay';
import { Sheet } from '../../components/ui';
import { ShareLogList } from '../../components/shell/ShareLogDrawer';
import type { ShareRule } from '../../types';
import type { View } from '../../state/view';

function daysWithoutEntry(v: View): number {
  let n = 0;
  for (let d = v.day; d >= 1; d--) { if (v.entries.some(e => e.day === d)) break; n++; }
  return n;
}

function RuleSheet({ rule, v, onClose }: { rule: ShareRule; v: View; onClose: () => void }) {
  const cur = currentRule(rule, v.events);
  const [text, setText] = useState(cur.text);
  const [n, setN] = useState(cur.atLeast);
  const ui = useUI();
  const save = () => {
    const newText = text === cur.text ? withThreshold(cur.text, cur.atLeast, n) : text.trim();
    appStore.getState().add({ type: 'rule-change', ruleId: rule.id, atLeast: n, text: `Rule changed on day ${v.day}: ${cur.text} → ${newText}` });
    onClose();
    ui.showToast('Saved. The change is in your share log.');
  };
  return (
    <Sheet title="Change this rule" onClose={onClose} width={560}>
      <label className="t-label" htmlFor="rule-text">The rule, in your words</label>
      <textarea id="rule-text" className="paper paper--sm" rows={3} value={text} onChange={e => setText(e.target.value)} />
      <div className="stepper">
        <span className="t-body">Threshold</span>
        <button className="btn btn--sm" aria-label="Lower the threshold" onClick={() => setN(x => Math.max(1, x - 1))} disabled={n <= 1}>−</button>
        <span className="t-stmt-sm num" aria-live="polite">{n}</span>
        <button className="btn btn--sm" aria-label="Raise the threshold" onClick={() => setN(x => Math.min(30, x + 1))}>+</button>
      </div>
      <p className="t-small">A change is itself written to the share log, so a line cannot be removed silently.</p>
      <div className="btn-row">
        <button className="btn btn--primary" onClick={save} disabled={!text.trim()}>Save</button>
        <button className="btn btn--quiet" onClick={onClose}>Cancel</button>
      </div>
    </Sheet>
  );
}

const LEVELS = [
  { n: 1, head: 'Most weeks: nothing', body: 'The tool offers things you can do yourself. Nothing is sent to anyone.' },
  { n: 2, head: 'When you choose: a message you approve', body: 'From any card you can draft a note to a crewmate, the crew medical officer or the ground. You see and edit the exact words first.' },
  { n: 3, head: 'Lines you set before launch', body: 'A few lines you agreed with your flight surgeon. They are checked every day, and the exact words are below.' },
];

export function Sharing() {
  const v = useView();
  const [editing, setEditing] = useState<ShareRule | null>(null);
  const run = pastMidnightRun(v.scenario.days, v.day, v.ignoreNights).run;
  const quiet = daysWithoutEntry(v);

  return (
    <>
      <div className="page-head"><div><h1 className="t-title">What leaves this device, and when</h1>
        <p className="t-lede">Three levels. You set all of them before launch, and you can read every word that has ever been sent.</p></div>
        <span className="note-pill">{`Earth is about ${delayWords(delayMin(v.day))} away today, each way`}</span></div>
      <ol className="levels">
        {LEVELS.map(l => (
          <li key={l.n} className={`panel panel--tight level ${l.n === 3 ? 'panel--act' : ''}`}>
            <span className="level-n t-label">{`Level ${l.n}`}</span>
            <h2 className="t-head">{l.head}</h2>
            <p className="t-small">{l.body}</p>
          </li>
        ))}
      </ol>
      <section className="panel" aria-label="Lines you set before launch">
        <h2 className="t-head">Lines you set before launch</h2>
        <table className="rules-table">
          <thead><tr>
            <th scope="col" className="t-label">The line</th><th scope="col" className="t-label">Now</th>
            <th scope="col" className="t-label">What is sent, word for word</th><th scope="col"><span className="sr-only">Change</span></th>
          </tr></thead>
          <tbody>
            {v.scenario.profile.shareRules.map(r => {
              const cur = currentRule(r, v.events);
              const now = r.metric === 'pastMidnightRun' ? run : quiet;
              return (
                <tr key={r.id}>
                  <td><p className="t-body rule-text">{cur.text}</p><span className="t-small">{r.auto ? `Automatic, to your flight surgeon` : 'Asks you first. Tells nobody for you.'}</span></td>
                  <td className="t-small num">{now >= cur.atLeast ? `Crossed (${now} of ${cur.atLeast})` : now > 0 ? `At ${now} of ${cur.atLeast}` : 'Not crossed'}</td>
                  <td>{r.auto && r.message ? <p className="t-quote">{`\u201c${r.message}\u201d`}</p> : <span className="t-small">Nothing is sent.</span>}</td>
                  <td><button className="btn btn--sm" onClick={() => setEditing(r)}>Change this rule</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section className="panel" aria-label="Share log">
        <h2 className="t-head">Share log</h2>
        <p className="t-small">Everything that has left this device, in full. If it is not here, it was not sent.</p>
        <ShareLogList log={v.shareLog} />
      </section>
      <p className="t-foot">Prototype: nothing actually leaves this browser. ‘Sent’ means written to the share log.</p>
      {editing && <RuleSheet rule={editing} v={v} onClose={() => setEditing(null)} />}
    </>
  );
}

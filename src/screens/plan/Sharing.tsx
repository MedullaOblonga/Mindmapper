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

export function Sharing() {
  const v = useView();
  const [editing, setEditing] = useState<ShareRule | null>(null);
  const run = pastMidnightRun(v.scenario.days, v.day, v.ignoreNights).run;
  const quiet = daysWithoutEntry(v);
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">What leaves this device, and when</h1>
        <p className="t-lede">Three levels. You set all of them before launch, and you can read every word that has ever been sent.</p></div></div>
      <div className="cols cols--three">
        <section className="panel panel--tight col" aria-label="Most weeks: nothing">
          <h2 className="t-head">Most weeks: nothing</h2>
          <p className="t-body">The tool offers things you can do yourself. Nothing is sent to anyone.</p>
        </section>
        <section className="panel panel--tight col" aria-label="When you choose">
          <h2 className="t-head">When you choose: a message you approve</h2>
          <p className="t-body">{`From any card you can draft a note to a crewmate, the crew medical officer or the ground. You see and edit the exact words. Messages to Earth take about ${delayWords(delayMin(v.day))} each way today.`}</p>
        </section>
        <section className="panel panel--tight panel--act col" aria-label="Lines you set before launch">
          <h2 className="t-head">Lines you set before launch</h2>
          <div className="rows">
            {v.scenario.profile.shareRules.map(r => {
              const cur = currentRule(r, v.events);
              const now = r.metric === 'pastMidnightRun' ? run : quiet;
              return (
                <div key={r.id} className="rule-row">
                  <p className="t-stmt-sm">{cur.text}</p>
                  <p className="t-small">{now >= cur.atLeast ? `Crossed. At ${now} of ${cur.atLeast} now.` : now > 0 ? `At ${now} of ${cur.atLeast} now.` : 'Not crossed.'}</p>
                  {r.auto && r.message && <p className="t-quote">{`“${r.message}”`}</p>}
                  <div className="btn-row"><button className="btn btn--sm" onClick={() => setEditing(r)}>Change this rule</button></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
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

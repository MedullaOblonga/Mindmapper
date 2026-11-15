import { useState } from 'react';
import { useView } from '../../state/useView';
import { useUI } from '../../state/ui';
import { appStore } from '../../state/store';
import { pastMidnightRun } from '../../logic/signs';
import { currentRule, withThreshold } from '../../logic/rules';
import { delayMin, delayWords } from '../../lib/delay';
import { missionDay } from '../../config';
import { CMO_NAME, co2Runs } from '../../logic/lines';
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

function ReportSheet({ rule, v, onClose }: { rule: ShareRule; v: View; onClose: () => void }) {
  const ui = useUI();
  const send = () => {
    appStore.getState().add({ type: 'safety', ruleId: rule.id });
    onClose();
    ui.showToast(`${CMO_NAME} has been told. The note is in your share log.`);
  };
  return (
    <Sheet title="Report an imminent risk" onClose={onClose} width={560}>
      <p className="t-body">Use this if you, or someone on board, is in immediate danger of serious harm.</p>
      <p className="t-body">{`${CMO_NAME}, your crew medical officer, is told now and comes to you. Your flight surgeon is sent the note below. It takes about ${delayWords(delayMin(missionDay(v.day)))} to reach Earth, so ${CMO_NAME} is your first support.`}</p>
      <p className="t-quote">{`\u201c${rule.message}\u201d`}</p>
      <p className="t-small">This is the one line that cannot be changed or switched off. It is the same limit to confidentiality that applies on Earth.</p>
      <div className="btn-row">
        <button className="btn btn--primary" onClick={send}>Tell them now</button>
        <button className="btn btn--quiet" onClick={onClose}>Cancel</button>
      </div>
    </Sheet>
  );
}

const LEVELS = [
  { n: 1, head: 'Most weeks: nothing', body: 'The tool offers things you can do yourself. Nothing is sent to anyone.' },
  { n: 2, head: 'When you choose: a message you approve', body: 'From any card you can draft a note to a crewmate, the crew medical officer or the ground. You see and edit the exact words first.' },
  { n: 3, head: 'Lines you set before launch', body: 'A few lines you agreed with your flight surgeon. They are checked every day, and the exact words are below. One is fixed: an imminent risk to you or to someone else.' },
];

export function Sharing() {
  const v = useView();
  const [editing, setEditing] = useState<ShareRule | null>(null);
  const [reporting, setReporting] = useState<ShareRule | null>(null);
  const co2 = co2Runs(v.scenario, v.day)[v.day] ?? 0;
  const reported = (id: string) => v.shareLog.find(e => e.kind === 'line' && e.ruleId === id && e.to === 'Flight surgeon');
  const run = pastMidnightRun(v.scenario.days, v.day, v.ignoreNights).run;
  const quiet = daysWithoutEntry(v);

  return (
    <>
      <div className="page-head"><div><h1 className="t-title">What leaves this device, and when</h1>
        <p className="t-lede">Three levels. You agreed all of them before launch, and you can read every word that has ever been sent.</p></div>
        <span className="note-pill">{`Earth is about ${delayWords(delayMin(missionDay(v.day)))} away today, each way`}</span></div>
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
              const now = r.metric === 'pastMidnightRun' ? run : r.metric === 'co2Run' ? co2 : quiet;
              const rep = r.fixed ? reported(r.id) : undefined;
              return (
                <tr key={r.id}>
                  <td><p className="t-body rule-text">{cur.text}</p>
                    <span className="t-small">{r.fixed
                      ? 'Fixed. The same limit to confidentiality as on Earth. The tool never judges this from your diary or your numbers: you report it, or your crew medical officer does.'
                      : r.auto ? 'Automatic, to your flight surgeon' : 'Asks you first. Tells nobody for you.'}</span></td>
                  <td className="t-small num">{r.fixed ? (rep ? `Reported on day ${rep.day}` : 'Not reported')
                    : now >= cur.atLeast ? `Crossed (${now} of ${cur.atLeast})` : now > 0 ? `At ${now} of ${cur.atLeast}` : 'Not crossed'}</td>
                  <td>{r.auto && r.message ? <p className="t-quote">{`\u201c${r.fixed ? r.message : withThreshold(r.message, r.atLeast, cur.atLeast)}\u201d`}</p> : <span className="t-small">Nothing is sent.</span>}</td>
                  <td>{r.fixed
                    ? <button className="btn btn--sm" onClick={() => setReporting(r)}>Report a risk now</button>
                    : <button className="btn btn--sm" onClick={() => setEditing(r)}>Change this rule</button>}</td>
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
      {reporting && <ReportSheet rule={reporting} v={v} onClose={() => setReporting(null)} />}
    </>
  );
}

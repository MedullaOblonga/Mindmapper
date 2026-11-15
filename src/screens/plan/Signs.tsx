import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useView } from '../../state/useView';
import { useUI } from '../../state/ui';
import { appStore } from '../../state/store';
import { signStatuses, pastMidnightRun } from '../../logic/signs';
import { currentRule } from '../../logic/rules';
import { listWords } from '../../logic/words';
import type { SignStatus } from '../../logic/signs';

function Glyph({ status }: { status: SignStatus['status'] }) {
  return <span className={`glyph glyph--${status}`} aria-hidden="true" />;
}

export function Signs() {
  const v = useView();
  const ui = useUI();
  const nav = useNavigate();
  const signs = v.scenario.profile.signs;
  const statuses = signStatuses(v.scenario, v.day, v.ignoreNights);
  const showed = statuses.filter(s => s.status === 'showed');
  const def = showed.find(s => signs.find(z => z.id === s.id)?.shareRuleId) ?? showed[0] ?? statuses[0];
  const [picked, setPicked] = useState<string | null>(null);
  const selId = picked ?? def.id;
  const sign = signs.find(s => s.id === selId)!;
  const st = statuses.find(s => s.id === selId)!;
  const rule = sign.shareRuleId ? v.scenario.profile.shareRules.find(r => r.id === sign.shareRuleId) : undefined;
  const cur = rule ? currentRule(rule, v.events) : null;
  const run = pastMidnightRun(v.scenario.days, v.day, v.ignoreNights).run;
  const [adding, setAdding] = useState(false);
  const [stepText, setStepText] = useState('');
  const step2 = sign.steps?.[1]?.match(/^Message (\w+):\s*(.*)$/);
  const startStep1 = () => {
    appStore.getState().add({ type: 'reminder', reminderId: `once-sign-${sign.id}-${v.day}`, text: sign.steps![0], on: true, buzz: ['short', 'short'] });
    ui.showToast(`Your wrist will remind you tonight: ${sign.steps![0]}`);
  };
  const notRight = () => {
    const card = v.openCards.find(c => c.kind === 'own-sign' && c.subject === sign.id);
    if (card) ui.openNotRight(card); else ui.showToast('Noted. Nothing else changed.');
  };
  const statusLine = st.status === 'showed' ? (st.days?.length ? `Showed up on days ${listWords(st.days)}.` : `${st.text} this week.`)
    : st.status === 'not' ? 'Did not show up this week.' : 'Not enough data yet.';
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">Your own early signs, checked against your week</h1>
        <p className="t-lede">Your own list, written before launch. This page only checks it.</p></div>
        <span className="note-pill">{`Written by you on day −${Math.abs(v.scenario.profile.writtenOnDay)}`}</span></div>
      <div className="cols">
        <div className="col col--wide">
          <section className="panel" aria-label="Your signs">
            <ul className="sign-list">
              {signs.map(s => {
                const x = statuses.find(y => y.id === s.id)!;
                return (
                  <li key={s.id}><button className="sign-row" aria-pressed={s.id === selId} onClick={() => setPicked(s.id)}>
                    <Glyph status={x.status} />
                    <span className="sign-body">
                      <span className="sign-quote">{`“${s.quote}”`}</span>
                      <span className="t-small">{s.source}</span>
                    </span>
                    <span className="t-small sign-status">{x.text}</span>
                  </button></li>
                );
              })}
            </ul>
            <div className="legend">
              <span><Glyph status="showed" />Showed up</span><span><Glyph status="not" />Did not show up</span><span><Glyph status="unknown" />Cannot tell</span>
            </div>
            <p className="t-small">The tool adds no signs of its own.</p>
          </section>
        </div>
        <div className="col col--narrow">
          <section className="panel panel--tight" aria-label="Selected sign">
            <p className="t-quote quote-lg">{`“${sign.quote}”`}</p>
            <p className="t-body">{statusLine}</p>
            {sign.steps?.length ? (
              <>
                <h2 className="t-head">Your own steps, written before launch</h2>
                <ol className="steps">{sign.steps.map(s => <li key={s} className="t-stmt-sm">{s}</li>)}</ol>
                <div className="btn-row">
                  <button className="btn btn--primary" onClick={startStep1}>Start step 1 tonight</button>
                  {step2 && <button className="btn" onClick={() => ui.openTalk({ route: 'home', to: step2[1].toLowerCase(), draft: step2[2].replace(/[“”]/g, '') })}>{`Message ${step2[1]}`}</button>}
                  <button className="btn btn--wrong" onClick={notRight}>That’s not right</button>
                </div>
              </>
            ) : (
              <>
                <p className="t-body">You did not write steps for this one.</p>
                {adding ? (
                  <div className="btn-row">
                    <input className="field" aria-label="Your step" value={stepText} onChange={e => setStepText(e.target.value)} />
                    <button className="btn btn--primary" disabled={!stepText.trim()} onClick={() => {
                      appStore.getState().add({ type: 'reminder', reminderId: `once-sign-${sign.id}-${v.day}`, text: stepText.trim(), on: true, buzz: ['short'] });
                      setAdding(false); setStepText(''); ui.showToast('Saved. Your wrist will remind you.');
                    }}>Save</button>
                  </div>
                ) : <div className="btn-row"><button className="btn" onClick={() => setAdding(true)}>Add a step</button></div>}
              </>
            )}
          </section>
          {rule && cur && (
            <section className="panel panel--tight" aria-label="Agreed before launch">
              <div className="panel-title-row"><h2 className="t-head icon-head"><Lock size={16} aria-hidden="true" />Agreed before launch</h2></div>
              <p className="t-body">{`At ${cur.atLeast} nights, your flight surgeon is told it happened, not what you wrote. At ${run} now.`}</p>
              <div className="btn-row"><button className="btn" onClick={() => nav('/plan/sharing')}>Change this rule</button></div>
            </section>
          )}
        </div>
      </div>
      <p className="t-foot">A sign showing up is not an alarm.</p>
    </>
  );
}

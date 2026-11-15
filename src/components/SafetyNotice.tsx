import { useNavigate } from 'react-router-dom';
import { D } from '../config';
import { useUI } from '../state/ui';
import { CMO_NAME } from '../logic/lines';
import { recentSafetyNotes, reliefSteps } from '../logic/safety';
import { delayMin, delayWords } from '../lib/delay';
import { missionDay } from '../config';
import { Tag } from './ui';
import type { View } from '../state/view';

/** Shown to the astronaut for 7 days after the one fixed line is crossed: what happened, the exact words sent, and what helps now. */
export function SafetyNotice({ v }: { v: View }) {
  const ui = useUI();
  const nav = useNavigate();
  const note = recentSafetyNotes(v.shareLog, v.day)[0];
  if (!note) return null;
  const fromEntry = note.source === 'entry';
  const steps = reliefSteps(v.scenario.profile);
  return (
    <section className="panel panel--act" aria-label="Safety line">
      <div className="panel-title-row"><div className="t-label act-text">Safety line · agreed before launch</div>{fromEntry && <Tag evidence="exp" />}</div>
      <p className="t-stmt-sm">{fromEntry
        ? `Something you wrote on day ${D(note.day)} matched the safety line for risk to yourself or to others.`
        : `On day ${D(note.day)} an imminent risk was reported.`}</p>
      <p className="t-body">{`${CMO_NAME}, your crew medical officer, was told at once. Your flight surgeon was sent this, and only this:`}</p>
      <p className="t-quote">{`“${note.text}”`}</p>
      {fromEntry && <p className="t-small">Your words stayed in your diary. The match comes from a simple word check on this device, and it can be wrong. The note is sent either way, because this one line is fixed.</p>}
      <div className="t-label">{`What helps now, while Earth is ${delayWords(delayMin(missionDay(v.day)))} away`}</div>
      <ol className="steps t-body">{steps.map(s => <li key={s.id}>{s.text.replace('the crew member’s own list', 'your own list')}</li>)}</ol>
      <p className="t-small">{`These are supports, not treatment. ${CMO_NAME} decides the next step with you.`}</p>
      <div className="btn-row">
        <button className="btn btn--primary" onClick={() => ui.openTalk({ route: 'sharing', draft: `About the safety note sent on day ${D(note.day)}: ` })}>Add your own words for the flight surgeon</button>
        <button className="btn" onClick={() => ui.openShareLog(true)}>Open share log</button>
        <button className="btn btn--quiet" onClick={() => nav('/profile/sharing')}>See the lines</button>
      </div>
    </section>
  );
}

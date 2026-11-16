import { useNavigate } from 'react-router-dom';
import { Earth, NotebookPen, ShieldCheck, Sprout, UserRound } from 'lucide-react';
import { D } from '../config';
import { useUI } from '../state/ui';
import { CMO_NAME } from '../logic/lines';
import { recentSafetyNotes, reliefSteps, type ReliefStep } from '../logic/safety';
import { CBT_MINUTES } from '../data/cbt';
import { delayMin, delayWords, fmtDelay } from '../lib/delay';
import { Tag } from './ui';
import type { View } from '../state/view';

const STEP_ICON: Record<ReliefStep['id'], typeof UserRound> = { person: UserRound, own: Sprout, protect: ShieldCheck };

/** Today: the same facts as the full notice, said calmly and mostly in pictures.
    Who knows (you, the crew medical officer, Earth), what helps now, and the exact words one tap away. */
function CalmNotice({ v }: { v: View }) {
  const ui = useUI();
  const nav = useNavigate();
  const note = recentSafetyNotes(v.shareLog, v.day)[0];
  if (!note) return null;
  const fromEntry = note.source === 'entry';
  const selfHarm = note.concern === 'self', hasPlan = v.events.some(e => e.type === 'cbt');
  const steps = reliefSteps(v.scenario.profile);
  return (
    <section className="panel calm" aria-label="Safety line">
      <p className="t-stmt-sm">{`${CMO_NAME} knows, and is coming to talk.`}</p>
      <ol className="calm-path" aria-label="Who was told">
        <li><span className="calm-node"><NotebookPen size={20} strokeWidth={1.8} aria-hidden="true" /></span><span className="t-head">You</span><span className="t-small num">{fromEntry ? `wrote, day ${D(note.day)}` : `said so, day ${D(note.day)}`}</span></li>
        <li><span className="calm-node calm-node--crew"><UserRound size={20} strokeWidth={1.8} aria-hidden="true" /></span><span className="t-head">{CMO_NAME}</span><span className="t-small">told at once</span></li>
        <li><span className="calm-node"><Earth size={20} strokeWidth={1.8} aria-hidden="true" /></span><span className="t-head">Flight surgeon</span><span className="t-small num">{`short note, ${fmtDelay(delayMin(note.day))} away`}</span></li>
      </ol>
      <div className="t-label">What helps now</div>
      <ul className="calm-steps">
        {steps.map(s => { const Icon = STEP_ICON[s.id]; return <li key={s.id}><Icon size={22} strokeWidth={1.8} aria-hidden="true" /><span className="t-body">{s.short}</span></li>; })}
      </ul>
      <details className="numbers">
        <summary className="t-head link-tap">What was sent, word for word</summary>
        <p className="t-quote">{`“${note.text}”`}</p>
        <p className="t-small">{fromEntry ? 'Your words stayed in your diary. A simple word check made the match, and it can be wrong.' : 'Nothing from your diary was sent.'}</p>
        <div className="btn-row">
          <button className="btn btn--sm" onClick={() => ui.openShareLog(true)}>Open share log</button>
          <button className="btn btn--sm btn--quiet" onClick={() => nav('/profile/sharing')}>See the lines</button>
        </div>
      </details>
      <div className="btn-row">
        {selfHarm && <button className="btn btn--primary" onClick={() => nav('/cbt')}>{hasPlan ? 'Open my plan' : 'Start guided CBT'}</button>}
        <button className="btn" onClick={() => ui.openTalk({ route: 'sharing', draft: `About the safety note sent on day ${D(note.day)}: ` })}>Add your own words</button>
      </div>
      {selfHarm && !hasPlan && <p className="t-small">{`About ${CBT_MINUTES} minutes. Preset steps, written in advance. No AI.`}</p>}
    </section>
  );
}

/** Shown to the astronaut for 7 days after the one fixed line is crossed: what happened, the exact words sent, and what helps now.
    `calm` is the short, visual form used on Today; the Journal keeps the full wording next to the entry. */
export function SafetyNotice({ v, calm = false }: { v: View; calm?: boolean }) {
  return calm ? <CalmNotice v={v} /> : <FullNotice v={v} />;
}

function FullNotice({ v }: { v: View }) {
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
        ? `Something you wrote on day ${D(note.day)} matched the safety line for ${note.concern === 'others' ? 'a risk of harm to others' : 'thoughts of self-harm'}.`
        : `On day ${D(note.day)} an imminent risk was reported.`}</p>
      <p className="t-body">{`${CMO_NAME}, your crew medical officer, was told at once. Your flight surgeon was sent this, and only this:`}</p>
      <p className="t-quote">{`“${note.text}”`}</p>
      {fromEntry && <p className="t-small">Your words stayed in your diary. The match comes from a simple word check on this device, and it can be wrong. The note is sent either way, because this one line is fixed.</p>}
      <div className="t-label">{`What helps now, while Earth is ${delayWords(delayMin(v.day))} away`}</div>
      <ol className="steps t-body">{steps.map(s => <li key={s.id}>{s.text.replace('the crew member’s own list', 'your own list')}</li>)}</ol>
      <p className="t-small">{`These are supports, not treatment. ${CMO_NAME} decides the next step with you.`}</p>
      <div className="btn-row">
        {note.concern === 'self' && <button className="btn btn--primary" onClick={() => nav('/cbt')}>Start guided CBT</button>}
        <button className="btn" onClick={() => ui.openTalk({ route: 'sharing', draft: `About the safety note sent on day ${D(note.day)}: ` })}>Add your own words for the flight surgeon</button>
        <button className="btn" onClick={() => ui.openShareLog(true)}>Open share log</button>
        <button className="btn btn--quiet" onClick={() => nav('/profile/sharing')}>See the lines</button>
      </div>
    </section>
  );
}

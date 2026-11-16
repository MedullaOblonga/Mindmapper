import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useView } from '../state/useView';
import { useUI } from '../state/ui';
import { appStore } from '../state/store';
import { CMO, CMO_NAME } from '../logic/lines';
import { CBT_MINUTES, CBT_URGENT, OWN_THOUGHT_QUESTIONS, THOUGHTS, planParts, planText, type CbtPlan, type CbtRatings, type PlanPart } from '../data/cbt';
import { Dial, type DialDef } from '../components/ui/Dial';
import { Tag } from '../components/ui';
import { D } from '../config';

const THOUGHTS_DIAL: DialDef = { id: 'thoughts', label: 'How strong are the thoughts right now?', min: 0, max: 10, anchors: { 0: 'Not there', 5: 'There, and I can set them aside', 10: 'As strong as they get' } };
const SAFE_DIAL: DialDef = { id: 'safe', label: 'How able do you feel to keep yourself safe for the next hour?', min: 0, max: 10, anchors: { 0: 'Not able', 5: 'Unsure', 10: 'Fully able' } };
const STEPS = ['Check in', 'Breathe', 'Name the thought', 'Weigh it', 'Your plan', 'Check in again'];
type CbtEvent = { type: 'cbt'; day: number; before: CbtRatings; after: CbtRatings; plan: CbtPlan };

/** One button, on every step: a person, now. */
function NeedPerson() {
  const ui = useUI();
  return (
    <div className="cbt-person">
      <span className="t-small">{`${CMO_NAME} has been told and is coming. If you are in danger right now, do not wait for these steps.`}</span>
      <button className="btn btn--sm" onClick={() => { appStore.getState().add({ type: 'share', to: CMO, text: 'I need you now.' }); ui.showToast(`${CMO_NAME} has been called to you.`); }}>{`I need ${CMO_NAME} now`}</button>
    </div>
  );
}

function Picks({ options, picked, onToggle, label }: { options: string[]; picked: string[]; onToggle: (o: string) => void; label: string }) {
  return (
    <div className="btn-row" role="group" aria-label={label}>
      {options.map(o => <button key={o} className="btn btn--sm cbt-pick" aria-pressed={picked.includes(o)} onClick={() => onToggle(o)}>{o}</button>)}
    </div>
  );
}

function PlanSummary({ plan, parts }: { plan: CbtPlan; parts: PlanPart[] }) {
  return (
    <dl className="cbt-plan">
      <div><dt className="t-label">The thought</dt><dd className="t-body">{plan.thought}</dd></div>
      {plan.balance.length > 0 && <div><dt className="t-label">What I can say back to it</dt><dd className="t-body">{plan.balance.map(b => <span key={b} className="sbar-line">{b}</span>)}</dd></div>}
      {parts.filter(p => plan.parts[p.id]?.length).map(p => <div key={p.id}><dt className="t-label">{p.title}</dt><dd className="t-body">{plan.parts[p.id]!.join(' · ')}</dd></div>)}
    </dl>
  );
}

/** Preset, self-guided CBT for thoughts of self-harm. Fixed text only; see src/data/cbt.ts. */
export function Cbt() {
  const v = useView();
  const ui = useUI();
  const nav = useNavigate();
  const parts = useMemo(() => planParts(v.scenario.profile), [v.scenario]);
  const saved = [...v.events].reverse().find((e): e is typeof e & CbtEvent => e.type === 'cbt');
  const [step, setStep] = useState<number>(saved ? 7 : -1);          // -1 intro, 0..5 steps, 6 done, 7 saved plan
  const [before, setBefore] = useState<{ thoughts: number | null; safe: number | null }>({ thoughts: null, safe: null });
  const [after, setAfter] = useState<{ thoughts: number | null; safe: number | null }>({ thoughts: null, safe: null });
  const [breaths, setBreaths] = useState(0);
  const [thoughtId, setThoughtId] = useState<string | null>(null);
  const [ownThought, setOwnThought] = useState('');
  const [balance, setBalance] = useState<string[]>([]);
  const [ownBalance, setOwnBalance] = useState('');
  const [picked, setPicked] = useState<Partial<Record<PlanPart['id'], string[]>>>({});
  const [ownReason, setOwnReason] = useState('');

  const thought = THOUGHTS.find(t => t.id === thoughtId);
  const thoughtText = thoughtId === 'own' ? ownThought.trim() : thought?.text ?? '';
  const urgent = before.thoughts !== null && before.safe !== null && (before.thoughts >= CBT_URGENT.thoughtsAtLeast || before.safe <= CBT_URGENT.safeAtMost);
  const toggle = (list: string[], o: string) => (list.includes(o) ? list.filter(x => x !== o) : [...list, o]);
  const plan: CbtPlan = { thought: thoughtText, balance: [...balance, ...(ownBalance.trim() ? [ownBalance.trim()] : [])],
    parts: { ...picked, reason: [...(picked.reason ?? []), ...(ownReason.trim() ? [ownReason.trim()] : [])] } };
  const finish = () => {
    appStore.getState().add({ type: 'cbt', before: before as CbtRatings, after: after as CbtRatings, plan: { ...plan, parts: plan.parts as Record<string, string[]> } });
    setStep(6);
  };
  const share = (p: CbtPlan) => { appStore.getState().add({ type: 'share', to: CMO, text: planText(p, parts) }); ui.showToast(`Sent to ${CMO_NAME}. It is in your share log.`); };
  const next = (ok = true) => <div className="btn-row"><button className="btn btn--primary" disabled={!ok} onClick={() => setStep(s => s + 1)}>Next</button>{step > 0 && <button className="btn btn--quiet" onClick={() => setStep(s => s - 1)}>Back</button>}</div>;

  return (
    <div className="check cbt">
      <header className="check-top">
        <span className="t-label">{step >= 0 && step <= 5 ? `Guided CBT · step ${step + 1} of ${STEPS.length} · ${STEPS[step]}` : `Guided CBT · day ${D(v.day)}`}</span>
        <a href="#/today" className="t-head link-tap" onClick={e => { e.preventDefault(); nav('/today'); }}>Leave</a>
      </header>
      <main className="check-main">
        <div className="check-step">
          {step < 6 && <NeedPerson />}

          {step === -1 && (
            <>
              <h1 className="t-title">A guided way through this</h1>
              <p className="t-stmt-sm">{`Six short steps for thoughts of harming yourself. About ${CBT_MINUTES} minutes, at your own pace.`}</p>
              <ul className="plain-list t-body">
                <li>Every word here was written in advance. No AI writes or answers anything.</li>
                <li>What you enter stays on this device unless you choose to share your plan.</li>
                <li>{`It works alongside ${CMO_NAME}, and does not replace a person.`}</li>
              </ul>
              <div className="trend-tags"><Tag evidence="earth" /><Tag>Not tested in spaceflight</Tag><Tag>Prototype wording, not yet reviewed by a clinician</Tag></div>
              <div className="btn-row"><button className="btn btn--primary" onClick={() => setStep(0)}>Start</button></div>
            </>
          )}

          {step === 0 && (
            <>
              <h1 className="t-title">Where are you right now?</h1>
              <Dial def={THOUGHTS_DIAL} value={before.thoughts} onChange={n => setBefore(b => ({ ...b, thoughts: n }))} />
              <Dial def={SAFE_DIAL} value={before.safe} onChange={n => setBefore(b => ({ ...b, safe: n }))} />
              {urgent && <p className="t-stmt-sm" role="status">{`That is a lot to carry alone. Go to ${CMO_NAME} now, or press “I need ${CMO_NAME} now” and ${CMO_NAME} comes to you. You can do these steps together.`}</p>}
              {next(before.thoughts !== null && before.safe !== null)}
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="t-title">Slow the body first</h1>
              <p className="t-stmt-sm">Six slow breaths. In for 4, out for 6. Tap the circle after each one.</p>
              <button className="cbt-breath" onClick={() => setBreaths(b => Math.min(6, b + 1))} aria-label={`Breath ${Math.min(6, breaths + 1)} of 6`}><span className="t-title num">{breaths}</span><span className="t-small">of 6</span></button>
              <div className="btn-row"><button className="btn btn--primary" onClick={() => setStep(2)}>{breaths >= 6 ? 'Next' : 'Skip'}</button><button className="btn btn--quiet" onClick={() => setStep(0)}>Back</button></div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="t-title">Which thought is loudest?</h1>
              <p className="t-body">Naming it puts a little distance between you and it.</p>
              <div className="cbt-list" role="radiogroup" aria-label="The loudest thought">
                {THOUGHTS.map(t => <button key={t.id} className="btn cbt-option" role="radio" aria-checked={thoughtId === t.id} aria-pressed={thoughtId === t.id} onClick={() => { setThoughtId(t.id); setBalance([]); }}>{t.text}</button>)}
                <button className="btn cbt-option" role="radio" aria-checked={thoughtId === 'own'} aria-pressed={thoughtId === 'own'} onClick={() => { setThoughtId('own'); setBalance([]); }}>Something else, in my own words</button>
              </div>
              {thoughtId === 'own' && <><label className="t-label" htmlFor="cbt-own">The thought, in your words</label><textarea id="cbt-own" className="paper paper--sm" rows={2} value={ownThought} onChange={e => setOwnThought(e.target.value)} /></>}
              {next(!!thoughtText)}
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="t-title">Weigh the thought</h1>
              <p className="t-quote">{`“${thoughtText}”`}</p>
              {thought ? (
                <>
                  <p className="t-body">A thought can be loud without being true. Keep any of these that you could say back to it.</p>
                  <div className="cbt-list" role="group" aria-label="What I can say back">
                    {thought.balance.map(b => <button key={b} className="btn cbt-option" aria-pressed={balance.includes(b)} onClick={() => setBalance(x => toggle(x, b))}>{b}</button>)}
                  </div>
                </>
              ) : <ul className="plain-list t-body">{OWN_THOUGHT_QUESTIONS.map(q => <li key={q}>{q}</li>)}</ul>}
              <label className="t-label" htmlFor="cbt-balance">Or, in your own words</label>
              <textarea id="cbt-balance" className="paper paper--sm" rows={2} value={ownBalance} onChange={e => setOwnBalance(e.target.value)} />
              {next()}
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="t-title">Your plan for the next few days</h1>
              <p className="t-body">Most of this comes from what you wrote before launch. Keep what fits.</p>
              {parts.map(p => (
                <section key={p.id} className="cbt-part" aria-label={p.title}>
                  <div className="t-head">{p.title}</div><div className="t-small">{p.hint}</div>
                  <Picks options={p.options} picked={picked[p.id] ?? []} label={p.title} onToggle={o => setPicked(x => ({ ...x, [p.id]: toggle(x[p.id] ?? [], o) }))} />
                  {p.id === 'reason' && <><label className="sr-only" htmlFor="cbt-reason">A reason in your own words</label><input id="cbt-reason" className="paper paper--line" placeholder="Or in your own words" value={ownReason} onChange={e => setOwnReason(e.target.value)} /></>}
                </section>
              ))}
              {next()}
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="t-title">And now?</h1>
              <Dial def={THOUGHTS_DIAL} value={after.thoughts} onChange={n => setAfter(b => ({ ...b, thoughts: n }))} />
              <Dial def={SAFE_DIAL} value={after.safe} onChange={n => setAfter(b => ({ ...b, safe: n }))} />
              <div className="btn-row"><button className="btn btn--primary" disabled={after.thoughts === null || after.safe === null} onClick={finish}>Finish</button><button className="btn btn--quiet" onClick={() => setStep(4)}>Back</button></div>
            </>
          )}

          {step === 6 && (
            <>
              <h1 className="t-title">Done. Your plan is saved.</h1>
              <p className="t-stmt-sm num">{`The thoughts: ${before.thoughts} then, ${after.thoughts} now. Able to stay safe: ${before.safe} then, ${after.safe} now.`}</p>
              {after.thoughts !== null && after.safe !== null && (after.thoughts >= CBT_URGENT.thoughtsAtLeast || after.safe <= CBT_URGENT.safeAtMost)
                ? <p className="t-body">{`Still this strong means it is time for a person, not more steps. Stay with ${CMO_NAME}.`}</p>
                : <p className="t-body">{`Numbers that have not moved are not a failure. ${CMO_NAME} takes it from here with you.`}</p>}
              <PlanSummary plan={plan} parts={parts} />
              <p className="t-small">Saved on this device. Nobody sees it unless you share it.</p>
              <div className="btn-row">
                <button className="btn btn--primary" onClick={() => nav('/today')}>Back to Today</button>
                <button className="btn" onClick={() => share(plan)}>{`Share my plan with ${CMO_NAME}`}</button>
              </div>
            </>
          )}

          {step === 7 && saved && (
            <>
              <h1 className="t-title">Your plan</h1>
              <p className="t-small num">{`Made on day ${D(saved.day)}. The thoughts went from ${saved.before.thoughts} to ${saved.after.thoughts}.`}</p>
              <PlanSummary plan={saved.plan} parts={parts} />
              <NeedPerson />
              <div className="btn-row">
                <button className="btn btn--primary" onClick={() => nav('/today')}>Back to Today</button>
                <button className="btn" onClick={() => share(saved.plan)}>{`Share my plan with ${CMO_NAME}`}</button>
                <button className="btn btn--quiet" onClick={() => setStep(-1)}>Do the steps again</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

import { useView } from '../state/useView';
import { currentRule } from '../logic/rules';
import { surgeonLog } from '../logic/lines';
import { delayMin, delayWords, fmtDelay } from '../lib/delay';
import { missionDay } from '../config';
import type { ShareLogEntry } from '../types';

const NOT_SHARED = [
  'The diary, its topics, and how anything felt.',
  'What the tool noticed, and how the crew member answered.',
  'Reaction test results and body trends, unless they are written into a note above.',
  'How close any line is to being crossed. You only learn that a line was crossed.',
  'Notes to crewmates, the crew medical officer, the ground psychologist or home.',
];

const when = (e: ShareLogEntry) => `Sent on day ${e.day} · reached Earth ${fmtDelay(delayMin(missionDay(e.day)))} later`;

function Notes({ items, empty }: { items: ShareLogEntry[]; empty: string }) {
  if (!items.length) return <p className="t-small">{empty}</p>;
  return (
    <ol className="rows log-list">
      {items.map(e => <li key={e.id}><div className="t-small num">{when(e)}</div><p className="t-quote pre">{e.text}</p></li>)}
    </ol>
  );
}

/** Demo: the flight surgeon's screen on Earth. It is built only from what was addressed to the flight surgeon. */
export function Surgeon() {
  const v = useView();
  const log = surgeonLog(v.shareLog);
  const lines = v.scenario.profile.shareRules.filter(r => r.auto);
  const messages = log.filter(e => e.kind === 'message');
  const changes = log.filter(e => e.kind === 'rule-change');
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">Flight surgeon view</h1>
        <p className="t-lede">Everything that has reached Earth from this crew member, word for word. If it is not here, it was not sent.</p></div>
        <span className="note-pill">{`You are reading the past: Earth is about ${delayWords(delayMin(missionDay(v.day)))} behind today`}</span></div>

      <section className="panel" aria-label="Safety and agreed lines">
        <h2 className="t-head">Safety and agreed lines</h2>
        <p className="t-small">Agreed with the crew member before launch, in their words. A note is sent without asking them only when one of these is crossed.</p>
        <table className="rules-table">
          <thead><tr>
            <th scope="col" className="t-label">The line</th><th scope="col" className="t-label">Kind</th><th scope="col" className="t-label">Notes received</th>
          </tr></thead>
          <tbody>
            {lines.map(r => (
              <tr key={r.id}>
                <td><p className="t-body rule-text">{currentRule(r, v.events).text}</p></td>
                <td className="t-small">{r.fixed
                  ? 'Fixed. The same limit to confidentiality as on Earth. It cannot be switched off.'
                  : 'Negotiable. The crew member can change it, and you are told when they do.'}</td>
                <td><Notes items={log.filter(e => e.kind === 'line' && e.ruleId === r.id)} empty="No note received." /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="cols">
        <div className="col col--wide">
          <section className="panel" aria-label="Sent by the crew member">
            <h2 className="t-head">Sent by the crew member</h2>
            <p className="t-small">Notes they chose to send you. They saw and edited every word first.</p>
            <Notes items={messages} empty="Nothing has been sent to you." />
          </section>
          {changes.length > 0 && (
            <section className="panel" aria-label="Changes to agreed lines">
              <h2 className="t-head">Changes to agreed lines</h2>
              <Notes items={changes} empty="" />
            </section>
          )}
        </div>
        <div className="col col--narrow">
          <section className="panel panel--tight panel--quiet" aria-label="Not shared with you">
            <h2 className="t-head">Not shared with you</h2>
            <ul className="plain-list t-small">{NOT_SHARED.map(t => <li key={t}>{t}</li>)}</ul>
          </section>
        </div>
      </div>
      <p className="t-foot">Demo view. Nothing actually leaves this browser; in flight this would be a console on Earth.</p>
    </>
  );
}

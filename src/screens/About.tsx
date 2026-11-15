import { APP_NAME } from '../config';
import { appStore } from '../state/store';
import { useUI } from '../state/ui';
import { USUAL_RULE } from '../data/evidence';
import { Tag } from '../components/ui';
import type { DataTag, EvidenceTag } from '../types';

const REAL: { feature: string; data: DataTag | null; evidence: EvidenceTag | null }[] = [
  { feature: 'Diary entries in the demo', data: 'ai-sample', evidence: null },
  { feature: 'Your own diary entries', data: 'user', evidence: null },
  { feature: 'The 24 diary topics', data: 'nasa-method', evidence: 'nasa-use' },
  { feature: 'Keyword tagger that reads each entry', data: null, evidence: 'exp' },
  { feature: 'Attention test history before day 112', data: 'nasa-replay', evidence: 'nasa-use' },
  { feature: 'Attention test design (3 minutes, 355 ms slow line)', data: 'nasa-method', evidence: 'nasa-use' },
  { feature: 'Sleep, timeline and the ledger counts', data: 'sim', evidence: null },
  { feature: 'Every threshold that raises a card', data: null, evidence: 'placeholder' },
  { feature: 'Body trends: wearable, cuff, blood and collar CO2 values', data: 'sim', evidence: null },
  { feature: 'Body trends: the reaction speed line, set from NASA bed-rest test records', data: 'nasa-method', evidence: 'exp' },
  { feature: 'Flight surgeon view (demo switch): built only from notes addressed to the flight surgeon', data: 'sim', evidence: null },
  { feature: 'Delay to Earth in the header, computed from the orbits of Earth and Mars', data: 'sim', evidence: null },
  { feature: 'Your early signs and steps', data: 'sim', evidence: 'analog' },
  { feature: 'Coping tasks and their evidence lines', data: null, evidence: 'earth' },
];

const RESOURCES: { name: string; use: string; href?: string }[] = [
  { name: 'ISS astronaut journals study (Stuster 2010; NASA TM-2010-216130; Life Sciences Data Archive H01)', use: 'The 24 topic categories, word for word, and the tone of each topic in the “Why is there no mood score?” explainer.', href: 'https://doi.org/10.83263/w7m8-qf96' },
  { name: 'ISS Reaction Self-Test (Jones et al., Sleep 2022) and PVT-B (Basner et al. 2011)', use: 'The every-fourth-day check: dials plus a 3-minute attention test with a 355 ms slow-response line. Also the 6-hour sleep line in Body trends: on the ISS, nights under 6 hours went with slower response speed.' },
  { name: 'Bed Rest Standard Measures: Performance Testing (L01)', use: 'The demo astronaut’s test history before day 112 is one volunteer’s real sessions, in order. The rule for a slow test was chosen against all three volunteers.', href: 'https://doi.org/10.83263/7081-d617' },
  { name: 'HRP evidence report: Behavioral Health (2025)', use: 'Crews must monitor themselves and act without Earth (p.55); under-reporting (p.28); per-person usuals (p.59, p.120); matching support to stressor (p.61); coping evidence (p.87–93).', href: 'https://humanresearchroadmap.nasa.gov/' },
  { name: 'HRP evidence report: Sleep (2016)', use: 'Short sleep and performance; boredom on the transit (p.57).', href: 'https://humanresearchroadmap.nasa.gov/' },
  { name: 'HRP research plan, June 2026, gap BH-201', use: 'The gap this tool answers: indicators and thresholds for semi-autonomous monitoring.', href: 'https://humanresearchroadmap.nasa.gov/' },
  { name: 'WinSCAT in head-down bed rest (NASA Life Sciences Portal, experiment MR085G, Flight Analogs Campaigns 1 and 3)', use: 'The reaction speed line in Body trends: 8% or more below your own usual on two tests in a row. Set from 28 healthy volunteers and 141 tests; the script is analysis/winscat_cutoffs.py.', href: 'https://nlsp.nasa.gov/' },
  { name: 'NASA Personal CO2 Monitor (ISS technology demonstration; ICES-2018-309)', use: 'The collar-worn CO2 readings in Body trends are modelled on it. The values are simulated.' },
  { name: 'NASA-STD-3001 Volume 2 and the OCHMO technical brief on carbon dioxide; Law et al. 2014', use: 'The 3.0 mmHg line for CO2, set from ISS crew headache reports.', href: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf' },
  { name: 'NASA Nutritional Status Assessment on the ISS (SMO 016E)', use: 'The body mass line: crews lose 2 to 5% of body mass early in flight, so more than 5% is outside that range.' },
  { name: 'NASA planetary fact sheets (NSSDCA)', use: 'Orbit sizes and periods of Earth and Mars, for the delay to Earth in the header.', href: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/' },
  { name: 'Acoustic noise chamber data (L04)', use: 'Background for the “Noisy nights” item.', href: 'https://doi.org/10.83263/z56c-ea13' },
];

const NOT_CLAIMED = [
  'It does not diagnose anything or detect any condition.',
  'It does not judge risk to you or to others. The one fixed line is reported by a person, never inferred from your diary or your numbers.',
  'It does not prevent anything. It helps you notice a change early and choose what to do.',
  'It has not been tested on astronauts or in an analog mission.',
  'Its thresholds are placeholders. NASA lists validated thresholds as an open research gap.',
  'The Body trends lines taken from NASA records show how often a line fires in well people. They do not show that it catches a real change.',
  'It is not NASA software, and the attention test is modelled on PVT-B, not the licensed test.',
  'A handful of “what followed” records cannot show that a coping task works.',
];

const NOT_BUILT = ['Intake interview flow', 'Hopelessness screening', 'Crew pulse', 'Crewmate nudge', 'Character or voice persona',
  'Camera or speech-pattern features', 'Time-capsule clips', 'The crew half of People: it needs a proximity badge that all crew agree to before launch'];

export function About() {
  const ui = useUI();
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">About this prototype</h1>
        <p className="t-lede">{`${APP_NAME}: a private self-check for long missions.`}</p></div></div>
      <section className="panel" aria-label="What this is">
        <h2 className="t-head">What this is</h2>
        <p className="t-body">A private self-check that notices slow change against your own usual, asks before it assumes, and never gives you a score. Everything runs on this device; nothing is sent unless you send it, or a line agreed before launch is crossed.</p>
        <ul className="plain-list t-body">
          <li>No score. There is no overall number, index or ranking anywhere.</li>
          <li>Your own usual. Every comparison is with you, never with other people.</li>
          <li>You choose. Every card ends in something you can do, or in telling the tool it is wrong.</li>
        </ul>
        <p className="t-small">{USUAL_RULE}</p>
        <p className="t-small">Shares are counted in diary segments: a topic’s share for a week is its segments divided by all segments that week. The keyword tagger is a stand-in; the plan is a language model using the same 24 NASA categories, tested against human labels.</p>
      </section>
      <section className="panel" aria-label="What is real here">
        <h2 className="t-head">What is real here</h2>
        <table className="real-table">
          <thead><tr><th scope="col" className="t-label">Feature</th><th scope="col" className="t-label">Data</th><th scope="col" className="t-label">Evidence</th></tr></thead>
          <tbody>{REAL.map(r => (
            <tr key={r.feature}><td className="t-body">{r.feature}</td><td>{r.data ? <Tag data={r.data} /> : <span className="t-small">—</span>}</td><td>{r.evidence ? <Tag evidence={r.evidence} /> : <span className="t-small">—</span>}</td></tr>
          ))}</tbody>
        </table>
      </section>
      <section className="panel" aria-label="NASA resources used">
        <h2 className="t-head">NASA resources used</h2>
        <ul className="plain-list">{RESOURCES.map(r => (
          <li key={r.name}><div className="t-body">{r.href ? <a href={r.href} target="_blank" rel="noreferrer">{r.name}</a> : r.name}</div><div className="t-small">{r.use}</div></li>
        ))}</ul>
        <p className="t-small">Not NASA, and labelled so: Mars Desert Research Station crew reports (test set for the tagger, not in the app), Karolinska Sleepiness Scale, Gavriloff 2018, Klasnja 2018. NASA data informs design decisions; nothing is trained on it.</p>
        <div className="btn-row">
          <button className="btn btn--sm" onClick={() => ui.openWhy('why.topics')}>Where the topics come from</button>
          <button className="btn btn--sm" onClick={() => ui.openWhy('why.no-mood-score')}>Why is there no mood score?</button>
          <button className="btn btn--sm" onClick={() => ui.openWhy('why.sharing')}>Why nothing is sent</button>
        </div>
      </section>
      <section className="panel" aria-label="What this does not claim">
        <h2 className="t-head">What this does not claim</h2>
        <ul className="plain-list t-body">{NOT_CLAIMED.map(x => <li key={x}>{x}</li>)}</ul>
      </section>
      <section className="panel" aria-label="Designed, not built">
        <h2 className="t-head">Designed, not built</h2>
        <ul className="plain-list t-body">{NOT_BUILT.map(x => <li key={x}>{x}</li>)}</ul>
      </section>
      <section className="panel" aria-label="AI use">
        <h2 className="t-head">AI use</h2>
        <p className="t-body">Built with AI assistance (Claude). Journal entries in the demo are AI-written samples. The idea, scope and design decisions are the team’s.</p>
        <p className="t-small">No NASA logos or insignia appear anywhere in the app.</p>
      </section>
      <section className="panel" aria-label="Reset">
        <h2 className="t-head">Reset</h2>
        <p className="t-body">Clears everything you did in this browser and returns to day 112.</p>
        <div className="btn-row"><button className="btn" onClick={() => { appStore.getState().reset(); ui.showToast('The demo is reset.'); }}>Reset the demo</button></div>
      </section>
    </>
  );
}

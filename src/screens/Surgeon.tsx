import { useMemo, useState } from 'react';
import { CircleCheck, ShieldAlert, TriangleAlert } from 'lucide-react';
import { useView } from '../state/useView';
import { surgeonLog } from '../logic/lines';
import { reliefSteps } from '../logic/safety';
import { ACTIVE_DAYS, LEVEL_LABEL, alertsUpTo, isActive, sbarDays, type Alert, type Level, type Sbar } from '../logic/sbar';
import { delayMin, delayWords, fmtDelay } from '../lib/delay';
import { D } from '../config';
import { Body } from './patterns/Body';
import type { View } from '../state/view';

const NOT_SHARED = [
  'Diary entries, unless the crew member sends one. An imminent-risk alert says an entry matched, never what it said.',
  'Diary topics, cards, wrist presses and the ledger.',
  'How close any line is to being crossed.',
  'Notes to crewmates, the crew medical officer, the ground psychologist or home.',
];

/** Shape and icon carry the status: tick = nothing to act on, triangle = worth a look, shield = imminent-risk alert. */
export function Cue({ level, size = 20 }: { level: Level; size?: number }) {
  const Icon = level === 'alert' ? ShieldAlert : level === 'look' ? TriangleAlert : CircleCheck;
  return <span className={`cue cue--${level}`} role="img" aria-label={LEVEL_LABEL[level]}><Icon size={size} strokeWidth={1.8} aria-hidden="true" /></span>;
}

const reached = (day: number) => `Day ${D(day)} · reached Earth ${fmtDelay(delayMin(day))} later`;

function RiskAlert({ a, v }: { a: Alert; v: View }) {
  return (
    <div className="alert-row alert-row--risk">
      <Cue level="alert" size={28} />
      <div className="alert-main">
        <div className="t-stmt-sm">{a.label}</div>
        <div className="t-small num">{reached(a.day)}</div>
        <div className="alert-facts t-small">
          <span>{a.source === 'entry' ? 'Diary word check. Not confirmed.' : 'Reported on board.'}</span>
          <span>Crew medical officer told.</span>
          <span>Diary words not sent.</span>
        </div>
        <details className="numbers">
          <summary className="t-head link-tap">Exact note and what was offered on board</summary>
          <p className="t-quote pre">{a.text}</p>
          <ul className="plain-list t-small">{reliefSteps(v.scenario.profile).map(s => <li key={s.id}>{s.text}</li>)}</ul>
        </details>
      </div>
    </div>
  );
}

function AgreedAlert({ a }: { a: Alert }) {
  return (
    <div className="alert-row" title={a.text}>
      <Cue level="look" />
      <div className="alert-main"><span className="t-head">{a.label}</span><span className="t-small num">{reached(a.day)}</span></div>
    </div>
  );
}

function SbarCard({ s }: { s: Sbar }) {
  return (
    <div className="sbar" role="group" aria-label={`SBAR for day ${D(s.day)}`}>
      <div className="sbar-head"><Cue level={s.level} size={24} /><span className="t-head">{`Day ${D(s.day)} · ${LEVEL_LABEL[s.level]}`}</span></div>
      <dl className="sbar-grid">
        <div><dt className="t-label">Situation</dt><dd className="t-body">{s.situation}</dd></div>
        <div><dt className="t-label">Background</dt><dd className="t-small">{s.background.map(t => <span key={t} className="sbar-line">{t}</span>)}</dd></div>
        <div><dt className="t-label">Assessment</dt><dd className="t-body">{s.assessment}</dd></div>
        <div><dt className="t-label">Recommendation</dt><dd className="t-body">{s.recommendation.map(t => <span key={t} className="sbar-line">{t}</span>)}</dd></div>
      </dl>
    </div>
  );
}

/** Demo: the flight surgeon's one-page dashboard on Earth. Alerts appear only once a line has actually sent a note. */
export function Surgeon() {
  const v = useView();
  const log = surgeonLog(v.shareLog);
  const alerts = useMemo(() => alertsUpTo(v.shareLog, v.scenario.profile.shareRules, v.day), [v.shareLog, v.scenario, v.day]);
  const days = useMemo(() => sbarDays(v.scenario, v.checks, v.shareLog, v.day), [v.scenario, v.checks, v.shareLog, v.day]);
  const [picked, setPicked] = useState<{ on: number; day: number } | null>(null);
  const sel = picked && picked.on === v.day ? picked.day : v.day;      // a pick lasts until the demo day changes
  const sbar = days.find(d => d.day === sel) ?? days[days.length - 1];
  const active = alerts.filter(a => isActive(a, v.day)), earlier = alerts.filter(a => !isActive(a, v.day));
  const risk = active.filter(a => a.fixed), agreed = active.filter(a => !a.fixed);
  const messages = log.filter(e => e.kind === 'message'), changes = log.filter(e => e.kind === 'rule-change');
  return (
    <>
      <div className="page-head"><h1 className="t-title">Flight surgeon view</h1>
        <span className="note-pill">{`Earth is about ${delayWords(delayMin(v.day))} behind`}</span></div>

      {active.length > 0 && (
        <section className={`panel panel--tight ${risk.length ? 'panel--act' : ''}`} aria-label="Safety and agreed lines">
          {risk.map(a => <RiskAlert key={a.id} a={a} v={v} />)}
          {agreed.map(a => <AgreedAlert key={a.id} a={a} />)}
        </section>
      )}

      <section className="panel panel--tight" aria-label="Daily overview">
        <div className="day-strip" role="group" aria-label="Last 14 days">
          {days.map(d => (
            <button key={d.day} className="day-cell" aria-pressed={d.day === sel} aria-label={`Day ${D(d.day)}: ${LEVEL_LABEL[d.level]}`} onClick={() => setPicked({ on: v.day, day: d.day })}>
              <Cue level={d.level} size={18} /><span className="t-small num">{D(d.day)}</span>
            </button>
          ))}
        </div>
        <SbarCard s={sbar} />
      </section>

      {messages.length > 0 && (
        <section className="panel panel--tight" aria-label="Sent by the crew member">
          <h2 className="t-head">Sent by the crew member</h2>
          <ol className="rows log-list">{messages.map(e => <li key={e.id}><div className="t-small num">{reached(e.day)}</div><p className="t-quote pre">{e.text}</p></li>)}</ol>
        </section>
      )}

      <Body surgeon />

      <section className="panel panel--tight panel--quiet" aria-label="More">
        {earlier.length > 0 && (
          <details className="numbers"><summary className="t-head link-tap">{`Earlier alerts (${earlier.length})`}</summary>
            <ul className="plain-list t-small">{earlier.map(a => <li key={a.id}>{`${a.label}. ${reached(a.day)}.`}</li>)}</ul></details>
        )}
        {changes.length > 0 && (
          <details className="numbers"><summary className="t-head link-tap">{`Changes to agreed lines (${changes.length})`}</summary>
            <ul className="plain-list t-small">{changes.map(e => <li key={e.id}>{e.text}</li>)}</ul></details>
        )}
        <details className="numbers"><summary className="t-head link-tap">What is not shared with you</summary>
          <ul className="plain-list t-small">{NOT_SHARED.map(t => <li key={t}>{t}</li>)}</ul></details>
        <p className="t-foot">{`Alerts stay on top for ${ACTIVE_DAYS} days. SBAR text comes from fixed prototype rules, not a clinician. Nothing actually leaves this browser.`}</p>
      </section>
    </>
  );
}

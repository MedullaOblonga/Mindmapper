import { useState } from 'react';
import { Sheet } from '../ui';
import { useUI } from '../../state/ui';
import { newUsualFor, usualOnset, type View } from '../../state/view';
import { usualShare } from '../../logic/shares';
import { groupShort } from '../../data/topics';
import { fmtClock, fmtDuration } from '../../lib/time';
import { checkUsual } from '../../logic/cards';
import { resolveCard } from './useCardActions';
import type { Card, Group } from '../../types';

const MISSING: Record<Card['kind'], string[]> = {
  ledger: ['Dinners I log from my wrist', 'Something the mission timeline missed'],
  'topic-shift': ['Some of these entries are tagged wrong', 'Some entries are missing'],
  check: ['I was interrupted during the test', 'The device was not working right'],
  'own-sign': ['My wearable was wrong on those nights'],
  rhythm: ['My wearable was wrong on those nights'],
};

function missingEffect(card: Card): string {
  if (card.kind === 'ledger') return card.subject === 'dinners' ? 'It now counts dinners you log from your wrist too.' : 'Noted. Nothing else changed.';
  if (card.kind === 'topic-shift') return 'You can retag those entries. The tool will look again next week.';
  if (card.kind === 'check') return 'That test will not be counted.';
  return 'Those nights will not be counted.';
}

const n1 = (x: number) => String(Math.round(x * 10) / 10);
function newUsualEffect(card: Card, v: View): string {
  const moved = newUsualFor(card, v.scenario, v.entries, v.checks);
  if (card.kind === 'topic-shift') {
    const g = card.subject as Group, now = moved[`topic:${g}`]?.value, was = usualShare(v.entries, g, card.week);
    const N = now ? Math.round(1 / now) : 0, M = was ? Math.round(1 / was) : 0;
    return `${groupShort(g)} at about 1 in ${N} of your diary is now your usual (was about 1 in ${M}).`;
  }
  if (card.kind === 'ledger' && card.evidence.type === 'usual-rows') {
    return card.evidence.rows.map(r => {
      const nv = moved[`ledger:${keyOf(r.label)}`]?.value ?? r.usual;
      const fmt = (x: number) => (r.label === 'Sleep' ? fmtDuration(x) : n1(x));
      return `${r.label}: your usual is now ${fmt(nv)} (was ${fmt(r.usual)}).`;
    }).join(' ') + ' The early mark stays on the bar.';
  }
  if (card.kind === 'rhythm') return `Your usual sleep start is now ${fmtClock(moved.sleepStart?.value ?? 0)} (was ${fmtClock(usualOnset(v.scenario))}).`;
  const was = Math.round(checkUsual(v.checks.filter(c => c.counts && c.day < card.day), null).rt);
  return `Your usual response time is now ${moved.rt?.value ?? was} ms (was ${was} ms).`;
}
const LABELS: Record<string, string> = { sleep: 'Sleep', suitPrepLong: 'Long suit-prep days', daysSinceRest: 'Days since a full rest day', callsMissed: 'Call windows missed',
  noisyNights: 'Noisy nights', dinners: 'Dinners with crew', callsSam: 'Calls with Sam', callsMom: 'Calls with Mom', gym: 'Gym', greenhouse: 'Greenhouse time' };
const keyOf = (label: string) => Object.keys(LABELS).find(k => LABELS[k] === label);

export function NotRightSheet({ card, v }: { card: Card; v: View }) {
  const ui = useUI();
  const [reason, setReason] = useState<'missing' | 'second' | 'other'>('missing');
  const [what, setWhat] = useState(MISSING[card.kind][0]);
  const [text, setText] = useState('');
  const own = card.kind === 'own-sign';
  const close = () => ui.openNotRight(null);
  const confirm = () => {
    let effect: string, r: 'missing' | 'new-usual' | 'fine' | 'other';
    if (reason === 'missing') { effect = missingEffect(card); r = 'missing'; }
    else if (reason === 'second') { r = own ? 'fine' : 'new-usual'; effect = own ? 'The tool will not raise this for 4 weeks.' : newUsualEffect(card, v); }
    else { effect = 'Noted. Nothing else changed.'; r = 'other'; }
    resolveCard(card, 'not-right', 'That’s not right', effect, r);
    close();
    ui.showToast(effect);
  };
  return (
    <Sheet title="What is off?" onClose={close} width={520}>
      <p className="t-stmt-sm">{card.statement}</p>
      <fieldset className="radios">
        <legend className="sr-only">What is off?</legend>
        <label className="radio-row"><input type="radio" name="nr" checked={reason === 'missing'} onChange={() => setReason('missing')} />
          <span>The data is wrong, or something is missing</span></label>
        {reason === 'missing' && (
          <div className="radio-sub">
            <div className="t-label">What should count?</div>
            {MISSING[card.kind].map(m => (
              <label key={m} className="radio-row radio-row--sm"><input type="radio" name="nr-what" checked={what === m} onChange={() => setWhat(m)} /><span>{m}</span></label>
            ))}
          </div>
        )}
        <label className="radio-row"><input type="radio" name="nr" checked={reason === 'second'} onChange={() => setReason('second')} />
          <span>{own ? 'It is accurate, but it is not a concern right now' : 'It is accurate, and this is my new usual'}</span></label>
        {reason === 'second' && <p className="t-small radio-sub">{own ? 'The tool will not raise this again for 4 weeks.'
          : 'From now on the tool compares this with your last four weeks instead. The early-mission mark stays on the bar. Lines you set before launch do not move.'}</p>}
        <label className="radio-row"><input type="radio" name="nr" checked={reason === 'other'} onChange={() => setReason('other')} /><span>Something else</span></label>
        {reason === 'other' && <input className="field radio-sub" aria-label="What else is off (optional)" value={text} onChange={e => setText(e.target.value)} />}
      </fieldset>
      <div className="btn-row">
        <button className="btn btn--primary" onClick={confirm}>Tell the tool</button>
        <button className="btn btn--quiet" onClick={close}>Cancel</button>
      </div>
    </Sheet>
  );
}

import { useState } from 'react';
import { Sheet } from '../ui';
import { useUI, type TalkRequest } from '../../state/ui';
import { appStore } from '../../state/store';
import { params } from '../../data/params';
import { resolveCard } from './useCardActions';

interface Recipient { id: string; label: string; to: string; earth: boolean }
const name = (id: string) => [...params.people.crew, ...params.people.home].find(p => p.id === id)?.name ?? id;
const work = params.profile.supportMap.work, medical = params.profile.supportMap.medical;

function recipients(route: string): Recipient[] {
  const first: Recipient[] = route === 'work' ? [{ id: work, label: name(work), to: name(work), earth: false }]
    : route === 'home' ? [{ id: 'home', label: 'Message home', to: name(params.profile.supportMap.home), earth: true }]
    : [];
  return [...first,
    { id: 'mei', label: `Crew medical officer (${name(medical)})`, to: `Crew medical officer (${name(medical)})`, earth: false },
    { id: 'fs', label: 'Flight surgeon (Earth)', to: 'Flight surgeon', earth: true },
    { id: 'psy', label: 'Ground psychologist (Earth)', to: 'Ground psychologist', earth: true }];
}
function defaultFor(route: string, list: Recipient[], to?: string): string {
  if (to) { const m = list.find(r => r.id === to || r.to.toLowerCase() === to); if (m) return m.id; if (to === 'sam') return 'home'; }
  if (route === 'work') return work;
  if (route === 'home') return 'home';
  if (['sleep', 'body', 'attention'].includes(route)) return 'mei';
  if (route === 'crew') return 'mei';
  return 'fs';
}

export function TalkSheet({ req }: { req: TalkRequest }) {
  const ui = useUI();
  const list = recipients(req.to === 'sam' ? 'home' : req.route);
  const [who, setWho] = useState(defaultFor(req.route, list, req.to));
  const [text, setText] = useState(req.draft);
  const [attach, setAttach] = useState(false);
  const r = list.find(x => x.id === who) ?? list[0];
  const close = () => ui.openTalk(null);
  const send = () => {
    const full = attach && req.attach?.length ? `${text}\n\n${req.attach.map(s => `Day ${s.day}: ${s.text}`).join('\n')}` : text;
    appStore.getState().add({ type: 'share', to: r.to, text: full });
    if (req.card) resolveCard(req.card, 'acted', req.actionLabel ?? 'Talk to someone', `You sent a note to ${r.to}. It is in your share log.`);
    close();
    ui.showToast('Sent. It is in your share log.');
  };
  return (
    <Sheet title="Who do you want to talk to?" onClose={close} width={640}>
      <div className="btn-row" role="radiogroup" aria-label="Recipient">
        {list.map(x => <button key={x.id} className="btn btn--sm" role="radio" aria-checked={who === x.id} aria-pressed={who === x.id} onClick={() => setWho(x.id)}>{x.label}</button>)}
      </div>
      <label className="t-label" htmlFor="talk-draft">Your message. Edit it before it goes.</label>
      <textarea id="talk-draft" className="paper paper--sm" value={text} onChange={e => setText(e.target.value)} rows={5} />
      {!!req.attach?.length && (
        <div className="attach">
          <label className="radio-row radio-row--sm"><input type="checkbox" checked={attach} onChange={e => setAttach(e.target.checked)} />
            <span>{`Attach the ${req.attach.length} diary entries`}</span></label>
          {attach && <ul className="attach-list">{req.attach.map(s => <li key={s.id} className="t-small">{`Day ${s.day}: ${s.text}`}</li>)}</ul>}
        </div>
      )}
      {r.earth && <p className="t-small">{`Reaches Earth in about ${params.mission.earthDelayMinutesOneWay} minutes. A reply takes at least as long again.`}</p>}
      <div className="btn-row">
        <button className="btn btn--primary" onClick={send} disabled={!text.trim()}>Send</button>
        <button className="btn" onClick={() => { close(); ui.showToast('Saved as a draft. Nothing was sent.'); }}>Save as draft</button>
        <button className="btn btn--quiet" onClick={close}>Cancel</button>
      </div>
    </Sheet>
  );
}

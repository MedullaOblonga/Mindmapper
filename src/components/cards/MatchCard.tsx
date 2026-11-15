import { useNavigate } from 'react-router-dom';
import { Tag } from '../ui';
import { useUI } from '../../state/ui';
import { groupShort } from '../../data/topics';
import { Evidence } from './Evidence';
import { resolveCard, topicSegments, useCardActions } from './useCardActions';
import type { Card, Group } from '../../types';
import type { View } from '../../state/view';

export function MatchCard({ card, index, total, v }: { card: Card; index: number; total: number; v: View }) {
  const run = useCardActions(v);
  const ui = useUI();
  const nav = useNavigate();
  const segs = card.kind === 'topic-shift' ? topicSegments(card, v) : [];
  const days = segs.map(s => s.day);
  return (
    <article className="card card-enter" aria-labelledby={`stmt-${card.id}`}>
      <div className="card-top"><span>{`${index} of ${total} this week`}</span>
        <div className="pips" aria-hidden="true">{Array.from({ length: total }, (_, i) => <i key={i} className={i === index - 1 ? 'on' : ''} />)}</div></div>
      <Evidence ev={card.evidence} />
      <p className="t-stmt" id={`stmt-${card.id}`}>{card.statement}</p>
      <div className="btn-row link-row">
        {card.kind === 'topic-shift' && segs.length > 0 && (
          <a href="#/journal" className="t-head link-tap" onClick={e => { e.preventDefault();
            nav('/journal', { state: { filter: { group: card.subject, ids: segs.map(s => s.id), from: Math.min(...days), to: Math.max(...days), topic: groupShort(card.subject as Group) } } }); }}>
            {`See the ${segs.length} entries`}</a>)}
        <a href="#why" className="t-head link-tap" onClick={e => { e.preventDefault(); ui.openWhy(card.whyKey, card.kind === 'topic-shift' ? groupShort(card.subject as Group).toLowerCase() : undefined); }}>Why this?</a>
        <Tag data={card.dataTag} />
      </div>
      <div className="card-actions">
        <div className="t-small t-strong">Do something with it, or tell the tool it is wrong.</div>
        <div className="btn-row card-btns">
          {card.actions.map((a, i) => (
            <button key={a.id} className={`btn btn--lg ${i === 0 ? 'btn--primary' : ''}`} onClick={() => run(card, a)}>{a.label}</button>
          ))}
        </div>
      </div>
      <div className="btn-row btn-row--split">
        <button className="btn btn--wrong" onClick={() => ui.openNotRight(card)}>That’s not right</button>
        <button className="btn btn--quiet" onClick={() => resolveCard(card, 'skipped', 'Skip for now', '')}>Skip for now</button>
      </div>
    </article>
  );
}

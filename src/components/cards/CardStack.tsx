import { MatchCard } from './MatchCard';
import type { View } from '../../state/view';

export function CardStack({ v }: { v: View }) {
  const card = v.openCards[0];
  if (!card) return null;
  const total = v.raisedCards.length;
  const index = v.raisedCards.findIndex(c => c.id === card.id) + 1;
  return (
    <>
      <div className="stack" data-left={v.openCards.length}>
        <MatchCard key={card.id} card={card} index={index} total={total} v={v} />
      </div>
      <div className="sr-only" aria-live="polite">{card.statement}</div>
    </>
  );
}

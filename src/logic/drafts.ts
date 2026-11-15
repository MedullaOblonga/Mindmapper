import { groupShort } from '../data/topics';
import { weekShares } from './shares';
import { ledgerForWeek } from './ledger';
import { shareWords, numWord } from './words';
import type { Card, Group, LedgerItem } from '../types';
import type { View } from '../state/view';

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const pctOf = (v: View, g: Group, w: number) => weekShares(v.entries, w)?.find(x => x.group === g)?.pct ?? 0;

export function ledgerNow(v: View): LedgerItem[] {
  const copingDone = v.events.filter(e => e.type === 'coping' && e.phase === 'done' && Math.ceil(e.day / 7) === v.week).length;
  return ledgerForWeek(v.scenario, v.week, { copingDone, wristDinners: {} }, v.flags);
}

function missedLine(v: View): string {
  const m = ledgerNow(v).find(i => i.key === 'callsMissed');
  return m && m.value > 0 ? ` I have missed ${numWord(m.value)} call window${m.value === 1 ? '' : 's'} this week.` : '';
}

/** A draft built from a card's evidence only, never from diary text (DESIGN §7.16). */
export function draftFor(card: Card, v: View): string {
  switch (card.kind) {
    case 'topic-shift': {
      const g = card.subject as Group, w = card.week;
      const now = shareWords(pctOf(v, g, w)), then = shareWords(pctOf(v, g, Math.max(1, w - 7)));
      return `Over the last two weeks, ${lower(groupShort(g))} has taken up ${now} of my diary, up from ${then}, and more of it has felt hard.${g === 'home' ? missedLine(v) : ''} I would like to talk it through.`;
    }
    case 'own-sign':
      return card.subject === 'midnight' && card.statement.match(/days ([\d, and]+)\./)
        ? `One of the early signs I wrote before launch has shown up: my sleep has started after midnight on ${numWord((card.statement.match(/\d+/g) ?? []).length)} nights in a row. I would like to talk it through.`
        : `One of the early signs I wrote before launch has shown up: “${card.title}” I would like to talk it through.`;
    case 'check':
      return `My attention test ${card.subject === 'am' ? 'this morning' : 'this evening'} had more slow responses than my usual, after a run of short nights. I would like a second opinion on my schedule for the next two days.`;
    case 'ledger':
      return `This week, against my usual: ${card.evidence.type === 'usual-rows' ? card.evidence.rows.map(r => `${lower(r.label)} ${r.value}, usual ${r.usual}`).join('; ') : ''}. I would like to talk it through.`;
    case 'rhythm':
      return 'My sleep has been starting later than my usual for several nights. I would like to talk it through.';
  }
}

export function protectiveDraft(card: Card, block: string): string {
  return `Could you second-check my part of the ${block} tomorrow?\nMy attention test ${card.subject === 'am' ? 'this morning' : 'this evening'} had more slow responses than my usual.`;
}

export function ledgerDraft(v: View): string {
  const far = ledgerNow(v).filter(i => i.away);
  if (!far.length) return 'This week everything on my ledger is at or near my usual.';
  return `This week, against my usual: ${far.map(i => `${lower(i.label)}: ${lower(i.sentence)}`).join(' ')} I would like to talk it through.`;
}

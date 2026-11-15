import { useNavigate } from 'react-router-dom';
import { params } from '../../data/params';
import { MISSION_DAY_OFFSET } from '../../config';
import { appStore } from '../../state/store';
import { useUI } from '../../state/ui';
import { draftFor, protectiveDraft } from '../../logic/drafts';
import { pickCoping } from '../../logic/coping';
import type { Card, CardAction } from '../../types';
import type { View } from '../../state/view';

export function resolveCard(card: Card, status: 'acted' | 'not-right' | 'skipped', choice: string, effect: string, reason?: 'missing' | 'new-usual' | 'fine' | 'other') {
  appStore.getState().add({ type: 'resolve', cardId: card.id, status, title: card.title, choice, effect, reason, kind: card.kind, subject: card.subject });
}

const reminderText = (id: string) => params.profile.reminders.find(r => r.id === id)?.text ?? id;

export function useCardActions(v: View) {
  const nav = useNavigate();
  const ui = useUI();
  const add = appStore.getState().add;
  return (card: Card, a: CardAction) => {
    const p = (a.payload ?? {}) as Record<string, string>;
    switch (a.kind) {
      case 'write':
        resolveCard(card, 'acted', a.label, 'It is in your diary, for you only.');
        nav('/journal', { state: { prefill: p.prefill ?? '', focus: true } });
        return;
      case 'call-window':
        add({ type: 'reminder', reminderId: 'callwindow', on: true });
        add({ type: 'reminder', reminderId: `once-callwindow-${card.id}`, text: 'Ask Jonas for the long call window', on: true, buzz: ['long'] });
        resolveCard(card, 'acted', a.label, 'Your wrist will remind you before the next call window.');
        ui.showToast('Your wrist will remind you before the next call window.');
        return;
      case 'own-step':
        add({ type: 'reminder', reminderId: `once-step-${card.id}`, text: p.text, on: true, buzz: ['short', 'short'] });
        resolveCard(card, 'acted', a.label, `Your wrist will remind you tonight: ${p.text}`);
        ui.showToast(`Your wrist will remind you tonight: ${p.text}`);
        return;
      case 'reminder': {
        const id = p.reminderId ?? 'winddown';
        add({ type: 'reminder', reminderId: id, on: true });
        const eff = `Your wrist will remind you: ${reminderText(id).toLowerCase()}.`.replace('..', '.');
        resolveCard(card, 'acted', a.label, eff);
        ui.showToast(eff);
        return;
      }
      case 'coping': {
        const t = pickCoping(p.fit ?? 'stress', params.profile, null).find(x => x.id === p.taskId);
        add({ type: 'reminder', reminderId: `once-coping-${card.id}`, text: `${t?.label ?? a.label}, ${t?.minutes ?? 15} minutes`, on: true, buzz: ['short'] });
        const eff = `Your wrist will offer ${(t?.label ?? a.label).toLowerCase()} when you have ${t?.minutes ?? 15} minutes free.`;
        resolveCard(card, 'acted', a.label, eff);
        ui.showToast(eff);
        return;
      }
      case 'rebuild-day':
        resolveCard(card, 'acted', a.label, 'You opened yesterday to rebuild it.');
        nav('/journal');
        return;
      case 'protective':
        ui.openTalk({ route: 'work', to: p.to ?? 'ana', draft: protectiveDraft(card, p.block ?? 'next review'), card, actionLabel: a.label });
        return;
      case 'talk':
        ui.openTalk({ route: p.route ?? 'sharing', to: p.to, draft: p.text ? p.text : draftFor(card, v),
          attach: card.kind === 'topic-shift' ? topicSegments(card, v) : undefined, card, actionLabel: a.label });
        return;
    }
  };
}

export function topicSegments(card: Card, v: View) {
  if (card.evidence.type !== 'marks') return [];
  const last = card.evidence.rows[card.evidence.rows.length - 1];
  const [, a, b] = last.label.match(/Days (\d+) to (\d+)/) ?? [];
  const from = +a - MISSION_DAY_OFFSET, to = +b - MISSION_DAY_OFFSET;   // labels show mission days
  return v.entries.flatMap(e => e.segments).filter(s => s.group === card.subject && s.day >= from && s.day <= to);
}

import type { Block, CardKind, CheckSession, Entry, Felt, Group, Mood } from '../types';

export type ResolveReason = 'missing' | 'new-usual' | 'fine' | 'other';
/** Every user action is one event; nothing else is stored. */
export type AppEvent = { id: string; day: number } & (
  | { type: 'resolve'; cardId: string; status: 'acted' | 'not-right' | 'skipped'; title: string; choice: string; effect: string; reason?: ResolveReason; kind: CardKind; subject: string }
  | { type: 'share'; to: string; text: string }
  | { type: 'entry'; entry: Entry }
  | { type: 'retag'; segmentId: string; group?: Group; felt?: Felt }
  | { type: 'check'; session: CheckSession }
  | { type: 'mark'; min: number; blockLabel: string | null; mood: Mood }
  | { type: 'reminder'; reminderId: string; on?: boolean; text?: string; buzz?: ('short' | 'long')[] }
  | { type: 'block-felt'; blockId: string; felt: Felt }
  | { type: 'block-add'; block: Block }
  | { type: 'coping'; taskId: string; phase: 'start' | 'done'; before?: number; after?: number }
  | { type: 'activity'; key: 'dinners' | 'greenhouse' | 'gym' | 'other'; label: string }
  | { type: 'rule-change'; ruleId: string; text: string; atLeast: number }
  | { type: 'safety'; ruleId: string }
  | { type: 'dismiss'; what: 'tonight' | 'cue' }
  | { type: 'questionnaire'; kind: string; answers: number[] }
  | { type: 'profile'; itemId: string; category?: string; text?: string; removed?: boolean });

type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
export type NewEvent = DistributiveOmit<AppEvent, 'id' | 'day'>;

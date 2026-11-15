import type { AppEvent } from '../state/events';
import type { ShareRule } from '../types';

type RuleChange = Extract<AppEvent, { type: 'rule-change' }>;
/** Current text and threshold of a pre-launch rule, after any logged changes. */
export function currentRule(rule: ShareRule, events: AppEvent[]): { text: string; atLeast: number } {
  const last = [...events].reverse().find((e): e is RuleChange => e.type === 'rule-change' && e.ruleId === rule.id);
  if (!last) return { text: rule.text, atLeast: rule.atLeast };
  const i = last.text.indexOf(' → ');
  return { text: i >= 0 ? last.text.slice(i + 3) : rule.text, atLeast: last.atLeast };
}
export function withThreshold(text: string, oldN: number, newN: number): string {
  return text.replace(new RegExp(`\\b${oldN}\\b`), String(newN));
}

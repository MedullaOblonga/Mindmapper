import { D } from '../../config';
import { JOURNALS } from '../../data/journalScenario';
import { groupShort } from '../../data/topics';
import { topicRises, emptyWeeks } from '../../logic/scan';
import { weekDays, weekOf } from '../../lib/time';
import { Tag, topicVar } from '../../components/ui';
import type { View } from '../../state/view';

const pc = (x: number) => `${Math.round(x * 100)}%`;
const daysOf = (from: number, to: number, day: number) => `days ${D(weekDays(from)[0])} to ${D(Math.min(weekDays(to)[1], day))}`;

/** For a real-journal replay: what the weekly review found in the text so far, including what it chose not to raise. */
export function JournalFindings({ v }: { v: View }) {
  if (v.source === 'demo') return null;
  const j = JOURNALS[v.source];
  const W = weekOf(v.day);
  const entries = v.entries.filter(e => e.origin === 'nasa-journal');
  const segs = entries.flatMap(e => e.segments);
  if (!segs.length) return null;
  const other = segs.filter(s => s.group === 'other').length / segs.length;
  const felt = { good: 0, hard: 0, mixed: 0, none: 0 };
  for (const s of segs) felt[s.felt ?? 'none'] += 1;
  const rises = topicRises(v.entries, W);
  const gaps = emptyWeeks(v.entries, W);
  return (
    <section className="panel" aria-label="What the tool found in this journal">
      <div className="panel-title-row"><h2 className="t-head">What the tool found in this journal</h2><Tag data="nasa-journal" /></div>
      <p className="t-body">{`${segs.length} sentences from ${entries.length} of ${j.author}’s entries so far. The tagger put ${pc(1 - other)} of them in a topic and left ${pc(other)} as Other. Feelings, guessed from words: ${pc(felt.good / segs.length)} good, ${pc(felt.hard / segs.length)} difficult, ${pc(felt.mixed / segs.length)} mixed, ${pc(felt.none / segs.length)} with no feeling words.`}</p>
      <div className="t-label">Topics that came up more than usual, three weeks running</div>
      {rises.length === 0 ? <p className="t-small">None so far. No topic stayed well above its usual share for three weeks in a row.</p> : (
        <ul className="plain-list findings">
          {rises.map(r => (
            <li key={`${r.group}${r.fromWeek}`} className="finding">
              <p className="t-body"><i className="swatch" style={{ background: topicVar(r.group) }} /><b>{groupShort(r.group)}</b>{`, ${daysOf(r.fromWeek, r.toWeek, v.day)}: up from a usual ${pc(r.usual)} of the week to as much as ${pc(r.peak)}.`}
                {r.carded && <span className="tag">Raised a card</span>}</p>
              <p className="t-small">{r.why}</p>
            </li>
          ))}
        </ul>
      )}
      {gaps.length > 0 && <p className="t-small">{`No entry in ${gaps.length} ${gaps.length === 1 ? 'week' : 'weeks'} so far (${gaps.length === 1 ? 'week' : 'weeks'} ${gaps.join(', ')}). A rise cannot run across a week with no writing, so a journal kept every week or two raises fewer cards.`}</p>}
      <p className="t-foot">{`These entries were written for the public on nasa.gov, so they read more upbeat than a private diary would. The words that tag spaceflight writing were added after reading these two journals: this is a first look, not a validation. Source: ${j.author}, ${j.mission}, NASA.`}</p>
    </section>
  );
}

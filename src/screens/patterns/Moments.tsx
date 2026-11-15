import { useNavigate } from 'react-router-dom';
import { useView } from '../../state/useView';
import { marksFor, moodWeek } from '../../state/view';
import { median } from '../../lib/stats';
import { weekDays, weekOf, fmtClock } from '../../lib/time';
import { MoodGlyph } from '../../components/DayRing';
import { Tag, UsualBar } from '../../components/ui';
import type { MoodMark } from '../../types';

function where(marks: MoodMark[], mood: 'high' | 'low'): [string, number][] {
  const c = new Map<string, number>();
  for (const m of marks) if (m.mood === mood) {
    const k = m.blockLabel ?? (m.min >= 1260 ? 'Late evening' : 'Free time');
    c.set(k, (c.get(k) ?? 0) + 1);
  }
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

export function Moments() {
  const v = useView();
  const nav = useNavigate();
  const W = weekOf(v.day);
  const weeks = Array.from({ length: Math.min(8, W) }, (_, i) => W - Math.min(8, W) + 1 + i);
  const usualWeeks = [3, 4, 5, 6, 7, 8].filter(w => 7 * w <= v.day);
  const uh = usualWeeks.length >= 3 ? median(usualWeeks.map(w => moodWeek(v.scenario, v.events, w, v.day).high)) : null;
  const ul = usualWeeks.length >= 3 ? median(usualWeeks.map(w => moodWeek(v.scenario, v.events, w, v.day).low)) : null;
  const now = moodWeek(v.scenario, v.events, W, v.day);
  const weekMarks = Array.from({ length: now.days }, (_, i) => marksFor(v.scenario, v.events, 7 * W - 6 + i)).flat();
  const scale = 28;
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">High and low moments</h1>
        <p className="t-lede">How often you pressed each wrist button, week by week, next to your own usual. A count of presses, not a grade.</p></div>
        <Tag data="sim" /></div>
      <div className="cols">
        <div className="col col--wide">
          <section className="panel" aria-label="Weeks of presses">
            <p className="t-stmt-sm">{uh === null ? `This week so far: ${now.high} high, ${now.low} low. Your usual appears after day 56.`
              : `This week so far: ${now.high} high, ${now.low} low. Your usual week: ${uh} high, ${ul} low.`}</p>
            <div className="mood-weeks">
              {weeks.map(w => {
                const m = moodWeek(v.scenario, v.events, w, v.day);
                const [a, b] = weekDays(w);
                return (
                  <div key={w} className="mood-week">
                    <div className="t-small num">{`Days ${a} to ${Math.min(b, v.day)}`}</div>
                    <div className="mood-bars">
                      <div className="mood-bar"><MoodGlyph mood="high" /><span className="t-small num mood-n">{m.high}</span>
                        <UsualBar value={m.high} usual={uh} scaleMax={scale} color="var(--ink-muted)" label={`High presses: ${m.high}${uh !== null ? `, usual ${uh}` : ''}`} /></div>
                      <div className="mood-bar"><MoodGlyph mood="low" /><span className="t-small num mood-n">{m.low}</span>
                        <UsualBar value={m.low} usual={ul} scaleMax={scale} color="var(--t-work)" label={`Low presses: ${m.low}${ul !== null ? `, usual ${ul}` : ''}`} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="t-small">The tick is your usual, from days 15 to 56. More low presses is not a verdict: it is a place to look.</p>
          </section>
        </div>
        <div className="col col--narrow">
          <section className="panel panel--tight" aria-label="Where they happened">
            <h2 className="t-head">Where they happened this week</h2>
            {(['low', 'high'] as const).map(mood => (
              <div key={mood} className="where">
                <div className="t-label"><MoodGlyph mood={mood} />{mood === 'low' ? ' Low presses' : ' High presses'}</div>
                {where(weekMarks, mood).length === 0 ? <p className="t-small">None yet this week.</p> : (
                  <ul className="plain-list t-body">{where(weekMarks, mood).map(([k, n]) => <li key={k}>{`${k}: ${n}`}</li>)}</ul>
                )}
              </div>
            ))}
            <div className="btn-row"><button className="btn btn--primary" onClick={() => nav('/journal')}>Walk through today</button></div>
          </section>
          <section className="panel panel--tight" aria-label="Today">
            <h2 className="t-head">Today</h2>
            {v.marksToday.length === 0 ? <p className="t-small">No presses yet today.</p> : (
              <ul className="moments">{v.marksToday.map((m, i) => <li key={i} className="t-small"><MoodGlyph mood={m.mood} />{`${fmtClock(m.min)}${m.blockLabel ? ` · ${m.blockLabel}` : ''}`}</li>)}</ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

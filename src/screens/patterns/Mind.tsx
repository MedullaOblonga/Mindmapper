import { useState } from 'react';
import { D } from '../../config';
import { useView } from '../../state/useView';
import { useUI } from '../../state/ui';
import { weekShares, feltCounts, usualShare, SHARE_GROUPS } from '../../logic/shares';
import { oneInN, shareWords } from '../../logic/words';
import { weekDays, weekOf } from '../../lib/time';
import { params } from '../../data/params';
import { groupDef, groupShort } from '../../data/topics';
import { MarkRow, MarkLegend, Tag, cssVars, topicVar } from '../../components/ui';
import type { Group, Segment } from '../../types';
import type { View } from '../../state/view';

const ANCHOR_TEXTS = new Set(params.anchorEntries.map(a => a.text));

function weeksShown(day: number): number[] {
  const W = weekOf(day);
  const out: number[] = [];
  for (let w = Math.max(1, W - 7); w <= W; w++) out.push(w);
  return out;
}

function defaultTopic(v: View, weeks: number[]): Group {
  const last = weeks[weeks.length - 1];
  let best: Group = 'work', rise = 0;
  for (const g of params.groupsOrder) {
    const now = weekShares(v.entries, last)?.find(x => x.group === g)?.share ?? 0;
    const u = usualShare(v.entries, g, last);
    if (u !== null && now - u > rise) { rise = now - u; best = g; }
  }
  return best;
}

/** The three most recent sentences of a topic, preferring ones the astronaut wrote themselves. */
function quotes(v: View, g: Group): Segment[] {
  const segs = v.entries.flatMap(e => e.segments).filter(s => s.group === g && s.day <= v.day);
  const own = segs.filter(s => s.origin === 'user' || ANCHOR_TEXTS.has(s.text));
  const pick = [...own].sort((a, b) => b.day - a.day).slice(0, 3);
  if (pick.length < 3) pick.push(...segs.filter(s => !pick.includes(s)).sort((a, b) => b.day - a.day).slice(0, 3 - pick.length));
  return pick.sort((a, b) => b.day - a.day);
}

function WeekRow({ v, w, sel }: { v: View; w: number; sel: Group }) {
  const [a, b] = weekDays(w);
  const label = `Days ${D(a)} to ${D(Math.min(b, v.day))}`;
  const sh = weekShares(v.entries, w);
  return (
    <div className="week-row">
      <div className="t-small num week-label">{label}</div>
      {sh ? (
        <div className="share-row" role="img" aria-label={`${label}: ${sh.filter(x => x.pct > 0).map(x => `${groupShort(x.group)} ${x.pct}%`).join(', ')}`}>
          {sh.filter(x => x.pct > 0).map(x => (
            <span key={x.group} className={`share-seg ${groupDef(x.group).ink === 'light' ? 'share-seg--light' : ''} ${x.group === sel ? 'share-seg--sel' : ''}`}
              style={cssVars({ gridColumn: `span ${x.pct}`, background: topicVar(x.group) })}>{x.pct >= 9 ? `${x.pct}%` : ''}</span>
          ))}
        </div>
      ) : <div className="share-row share-row--empty t-small">No entries this week</div>}
    </div>
  );
}

export function Mind() {
  const v = useView();
  const ui = useUI();
  const weeks = weeksShown(v.day);
  const [picked, setPicked] = useState<Group | null>(null);
  const head = (
    <div className="page-head"><div><h1 className="t-title">What has been on your mind</h1>
      <p className="t-lede">The share of each week’s diary about each topic. A map of where your attention has gone, not a grade.</p></div></div>
  );
  if (v.day < 15) return <>{head}<section className="panel"><p className="t-stmt-sm">The picture starts after your first two weeks.</p></section></>;
  const sel = picked ?? defaultTopic(v, weeks);
  const first = weeks[0], last = weeks[weeks.length - 1];
  const pctOf = (w: number) => weekShares(v.entries, w)?.find(x => x.group === sel)?.pct ?? 0;
  const p1 = pctOf(first), p2 = pctOf(last);
  const n = weeks.length;
  const nWord = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][n];
  const [f1a] = weekDays(first), [, f1b] = weekDays(Math.min(first + 1, last));
  const [l2a] = weekDays(Math.max(last - 1, first)), l2b = Math.min(7 * last, v.day);
  const fc1 = feltCounts(v.entries, sel, f1a, f1b), fc2 = feltCounts(v.entries, sel, l2a, l2b);
  const qs = quotes(v, sel);
  const topic = groupShort(sel);
  const draft = `Over the last ${nWord} weeks, ${topic.toLowerCase()} has gone from ${shareWords(p1)} of my diary to ${shareWords(p2)}. I would like to talk it through.`;
  return (
    <>
      {head}
      <div className="cols">
        <div className="col col--wide">
          <section className="panel" aria-label="Weeks">
            <div className="panel-title-row"><h2 className="t-head">Each week of your diary</h2><Tag data="ai-sample" /></div>
            <div className="weeks">{weeks.map(w => <WeekRow key={w} v={v} w={w} sel={sel} />)}</div>
            <div className="legend">{params.groupsOrder.map(g => <span key={g}><i className="swatch" style={{ background: topicVar(g) }} />{groupShort(g)}</span>)}
              {SHARE_GROUPS.includes('other') && v.entries.some(e => e.segments.some(s => s.group === 'other')) && <span><i className="swatch" style={{ background: topicVar('other') }} />Other</span>}</div>
            <p className="t-small">Each row adds up to 100%. The outlined blocks are the topic you are looking at.</p>
            <div className="btn-row">
              <a href="#why" className="t-head link-tap" onClick={e => { e.preventDefault(); ui.openWhy('why.topics'); }}>Where do the topics come from?</a>
            </div>
          </section>
        </div>
        <div className="col col--narrow">
          <div className="btn-row" role="group" aria-label="Topic">
            {params.groupsOrder.map(g => <button key={g} className="btn btn--sm" aria-pressed={g === sel} onClick={() => setPicked(g)}>{groupShort(g)}</button>)}
          </div>
          <section className="panel panel--tight" aria-label={`${topic} detail`}>
            <div className="t-label" style={{ color: topicVar(sel) }}>{groupDef(sel).label}</div>
            <p className="t-stmt-sm">{`${oneInN(p1)} of your entries in the first of these ${nWord} weeks. ${oneInN(p2)} now.`}</p>
            {[[first, p1], [last, p2]].map(([w, p]) => (
              <div className="usual-item" key={w}>
                <div className="usual-item-head"><span className="t-small">{`Days ${D(weekDays(w)[0])} to ${D(Math.min(weekDays(w)[1], v.day))}`}</span><span className="t-small num">{`${p}%`}</span></div>
                <div className="usual" role="img" aria-label={`${p} percent`} style={cssVars({ '--c': topicVar(sel) })}><i style={{ width: `${p}%` }} /></div>
              </div>
            ))}
            <div className="t-label">How it felt to you</div>
            <div className="evidence">
              <div className="evidence-row"><div>{`Days ${D(f1a)} to ${D(f1b)}`}<br />{`${fc1.count} mentions`}</div><MarkRow {...fc1} group={sel} /></div>
              <div className="evidence-row"><div>{`Days ${D(l2a)} to ${D(l2b)}`}<br />{`${fc2.count} mentions`}</div><MarkRow {...fc2} group={sel} /></div>
            </div>
            <MarkLegend group={sel} />
            {qs.length > 0 && <>
              <div className="t-label">Your sentences</div>
              {qs.map(q => <div key={q.id} className="quote-row"><p className="t-quote">{`“${q.text}”`}</p><span className="t-small num">{`Day ${D(q.day)}`}</span></div>)}
            </>}
          </section>
          <section className="panel panel--tight" aria-label="Talk it through">
            <p className="t-body">More or less of a topic is not better or worse. If you want to talk this through, you choose who.</p>
            <div className="btn-row">
              <button className="btn" onClick={() => ui.openTalk({ route: 'work', draft })}>Message a crewmate</button>
              <button className="btn" onClick={() => ui.openTalk({ route: 'sharing', draft })}>Draft a message to the flight surgeon</button>
            </div>
            <a href="#why" className="t-head link-tap" onClick={e => { e.preventDefault(); ui.openWhy('why.no-mood-score'); }}>Why is there no mood score?</a>
          </section>
        </div>
      </div>
    </>
  );
}

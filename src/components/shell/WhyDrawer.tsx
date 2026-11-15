import { Drawer, Tag, DATA_TAG, EVIDENCE_TAG, cssVars, topicVar } from '../ui';
import { useUI } from '../../state/ui';
import { WHY, USUAL_RULE } from '../../data/evidence';
import { topics, GROUPS, groupShort } from '../../data/topics';
import { roundTo100 } from '../../lib/stats';
import { params } from '../../data/params';
import type { DataTag, EvidenceTag, Group } from '../../types';

export function ToneList() {
  const tone = Object.entries(topics.h01NetToneByCategory).filter(([k]) => !k.startsWith('_')) as [string, number][];
  return (
    <div className="why-extra">
      <div className="t-label">Average tone by topic in the ISS journals <Tag>NASA data</Tag></div>
      <ul className="tone-list">{tone.map(([k, v]) => <li key={k} className="t-small num"><span>{k}</span><span>{v > 0 ? `+${v.toFixed(3)}` : v.toFixed(3)}</span></li>)}</ul>
    </div>
  );
}

export function NasaMixRow() {
  const counts = topics.h01CategoryCounts as Record<string, number>;
  const byGroup: Record<string, number> = {};
  for (const c of topics.categories) if (counts[c.name]) byGroup[c.group] = (byGroup[c.group] ?? 0) + counts[c.name];
  const gs = params.groupsOrder.filter(g => byGroup[g]);
  const pct = roundTo100(gs.map(g => byGroup[g]));
  return (
    <div className="why-extra">
      <div className="t-label">What ten ISS astronauts wrote about <Tag>NASA data</Tag></div>
      <div className="share-row" role="img" aria-label={gs.map((g, i) => `${groupShort(g as Group)} ${pct[i]}%`).join(', ')}>
        {gs.map((g, i) => pct[i] > 0 && (
          <span key={g} className={`share-seg ${GROUPS.find(x => x.id === g)?.ink === 'light' ? 'share-seg--light' : ''}`}
            style={cssVars({ gridColumn: `span ${pct[i]}`, background: topicVar(g as Group) })}>{pct[i] >= 9 ? `${pct[i]}%` : ''}</span>))}
      </div>
      <div className="legend">{gs.map(g => <span key={g}><i className="swatch" style={{ background: topicVar(g as Group) }} />{groupShort(g as Group)}</span>)}</div>
      <p className="t-small">Shown as background. It is not a target, and the demo astronaut’s own mix is simulated.</p>
    </div>
  );
}

export function WhyDrawer() {
  const ui = useUI();
  const rec = ui.whyKey ? WHY[ui.whyKey] : null;
  if (!rec) return null;
  const compared = rec.compared.replace('{topic}', ui.whyTopic ?? 'this topic');
  const cardKey = ['why.topic-shift', 'why.own-sign', 'why.check', 'why.ledger', 'why.rhythm'].includes(ui.whyKey!);
  return (
    <Drawer title={rec.title} onClose={() => ui.openWhy(null)}>
      {compared && <><div className="t-label">What the tool compared</div><p className="t-body">{compared}</p></>}
      <div className="t-label">The rule</div>
      <p className="t-stmt-sm">{rec.rule}</p>
      {cardKey && <p className="t-small">{USUAL_RULE}</p>}
      <div className="btn-row">{rec.tags.map(t => <Tag key={t}>{(DATA_TAG as Record<string, string>)[t as DataTag] ?? EVIDENCE_TAG[t as EvidenceTag]}</Tag>)}</div>
      {ui.whyKey === 'why.no-mood-score' && <ToneList />}
      {ui.whyKey === 'why.topics' && <NasaMixRow />}
      <div className="t-label">Source</div>
      <p className="t-small">{rec.source}</p>
    </Drawer>
  );
}

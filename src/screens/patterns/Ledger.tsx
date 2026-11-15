import { useNavigate } from 'react-router-dom';
import { useView } from '../../state/useView';
import { useUI } from '../../state/ui';
import { appStore } from '../../state/store';
import { ledgerDraft, ledgerNow } from '../../logic/drafts';
import { Tag, UsualBar } from '../../components/ui';
import type { LedgerItem } from '../../types';

const RESERVES: { id: LedgerItem['reserve']; label: string }[] = [
  { id: 'rest', label: 'Rest' }, { id: 'connection', label: 'Connection' }, { id: 'movement', label: 'Movement' }, { id: 'calm', label: 'Calm' }];

/** "What brought it back before" (board G strip). Fixed demo history, tagged Simulated. */
const BROUGHT_BACK: Record<LedgerItem['reserve'], { text: string; reminderId: string }> = {
  connection: { text: 'The last 3 times Connection came back to your usual, a crew dinner and a call with Sam fell in the same week.', reminderId: 'dinner' },
  rest: { text: 'The last 2 times Rest came back to your usual, a wind-down at 21:00 fell in the same week.', reminderId: 'winddown' },
  calm: { text: 'The last 2 times Calm came back to your usual, greenhouse time fell in the same week.', reminderId: 'winddown' },
  movement: { text: 'The last 2 times Movement came back to your usual, a stand-and-stretch reminder was on.', reminderId: 'stretch' },
};

function Item({ i, before15 }: { i: LedgerItem; before15: boolean }) {
  const usual = before15 ? null : i.usual;
  return (
    <div className="usual-item">
      <div className="usual-item-head"><span className="t-head">{i.label}</span><span className="t-small">{i.sentence}</span></div>
      <UsualBar value={i.value} usual={usual} early={before15 ? null : i.earlyUsual} scaleMax={i.scaleMax} label={`${i.label}. ${i.sentence}`} color="var(--t-work)" />
    </div>
  );
}

function Column({ title, items, empty, before15 }: { title: string; items: LedgerItem[]; empty?: string; before15: boolean }) {
  return (
    <section className="panel" aria-label={title}>
      <div className="t-label">{title}</div>
      {items.length === 0 && empty && <p className="t-body">{empty}</p>}
      {RESERVES.map(r => {
        const its = items.filter(i => i.reserve === r.id);
        if (!its.length) return null;
        return (
          <div key={r.id} className="reserve">
            <div className="t-label reserve-head">{r.label}</div>
            {its.map(i => <Item key={i.key} i={i} before15={before15} />)}
          </div>
        );
      })}
    </section>
  );
}

export function Ledger() {
  const v = useView();
  const ui = useUI();
  const nav = useNavigate();
  const items = ledgerNow(v);
  const before15 = v.day < 15;
  const away = before15 ? [] : items.filter(i => i.away);
  const near = before15 ? items : items.filter(i => !i.away);
  const top = [...away].sort((a, b) => Math.abs(b.value - (b.usual ?? 0)) / b.scaleMax - Math.abs(a.value - (a.usual ?? 0)) / a.scaleMax)[0];
  const back = top ? BROUGHT_BACK[top.reserve] : null;
  const add = appStore.getState().add;
  return (
    <>
      <div className="page-head"><div><h1 className="t-title">This week, against your usual</h1>
        <p className="t-lede">Each item sits next to your own usual, marked with a tick. Nothing is added up into one number, and away from your usual is not a verdict.</p></div>
        <Tag data="sim" /></div>
      {(before15 || items.some(i => i.key !== 'copingDone' && i.usual === null)) && <p className="t-small">Your usual appears after day 14.</p>}
      <div className="cols">
        <div className="col col--half"><Column title="Away from your usual" items={away} empty="Everything is at or near your usual this week." before15={before15} /></div>
        <div className="col col--half"><Column title="At or near your usual" items={near} before15={before15} /></div>
      </div>
      <div className="t-label">Three ways to act on this. You choose.</div>
      <div className="cols cols--three">
        <section className="panel panel--tight panel--act col" aria-label="Try">
          <div className="t-head">Try</div>
          {back ? (
            <>
              <p className="t-body">{back.text}</p>
              <div><Tag data="sim" /></div>
              <div className="btn-row"><button className="btn btn--primary" onClick={() => { add({ type: 'reminder', reminderId: back.reminderId, on: true }); ui.showToast('Your wrist will remind you. Nothing on the schedule moved.'); }}>Add a wrist reminder</button></div>
            </>
          ) : <p className="t-body">Nothing here is far from your usual this week.</p>}
        </section>
        <section className="panel panel--tight col" aria-label="Talk">
          <div className="t-head">Talk</div>
          <p className="t-body">Send this page to someone. You edit it first and see it before it goes.</p>
          <div className="btn-row">
            <button className="btn" onClick={() => ui.openTalk({ route: 'work', draft: ledgerDraft(v) })}>Crewmate</button>
            <button className="btn" onClick={() => ui.openTalk({ route: 'sharing', draft: ledgerDraft(v) })}>Flight surgeon</button>
          </div>
        </section>
        <section className="panel panel--tight col" aria-label="Agreed before launch">
          <div className="t-head">Agreed before launch</div>
          <p className="t-body">{`You and your flight surgeon set what is shared automatically. ${v.lineCrossed ? `One line was crossed on day ${v.lineCrossed.day}.` : 'Nothing this week has crossed it.'}`}</p>
          <a href="#/profile/sharing" className="t-head link-tap" onClick={e => { e.preventDefault(); nav('/profile/sharing'); }}>See the rules</a>
        </section>
      </div>
    </>
  );
}

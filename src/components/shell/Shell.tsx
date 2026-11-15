import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { StoryBar } from './StoryBar';
import { Rail } from './Rail';
import { ShareLogDrawer } from './ShareLogDrawer';
import { WhyDrawer } from './WhyDrawer';
import { NotRightSheet } from '../cards/NotRightSheet';
import { TalkSheet } from '../cards/TalkSheet';
import { Toast } from '../ui';
import { useView } from '../../state/useView';
import { useUI } from '../../state/ui';
import { BedtimeLight, EntryDueChip } from './BedtimeLight';
import { WristDock } from '../Wrist';

export function Footer() {
  return <div className="t-foot page-foot">Sample data for illustration. Names are placeholders.</div>;
}

export function Overlays() {
  const v = useView();
  const ui = useUI();
  return (
    <>
      {ui.shareLogOpen && <ShareLogDrawer log={v.shareLog} />}
      {ui.whyKey && <WhyDrawer />}
      {ui.notRight && <NotRightSheet key={ui.notRight.id} card={ui.notRight} v={v} />}
      {ui.talk && <TalkSheet key={ui.talk.draft} req={ui.talk} />}
      <Toast />
    </>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const v = useView();
  const ui = useUI();
  const loc = useLocation();
  if (loc.pathname.startsWith('/check')) return <>{children}<Overlays /></>;
  return (
    <div className="app">
      <BedtimeLight v={v} />
      <TopBar day={v.day} shared={v.shareLog.length} onOpenLog={() => ui.openShareLog(true)} due={<EntryDueChip v={v} />} />
      <StoryBar branch={v.branch} />
      <Rail dot={v.openCards.length > 0} wrist={<WristDock v={v} />} />
      <main className="page">
        {children}
        <Footer />
      </main>
      <Overlays />
    </div>
  );
}

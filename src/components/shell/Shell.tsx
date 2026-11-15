import type { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { StoryBar } from './StoryBar';
import { Rail } from './Rail';

export function Footer() {
  return <div className="t-foot">Sample data for illustration. Names are placeholders.</div>;
}

export function Shell({ children }: { children: ReactNode }) {
  const day = 112;
  return (
    <div className="app">
      <TopBar day={day} shared={0} />
      <StoryBar day={day} />
      <Rail />
      <main className="page">
        {children}
        <Footer />
      </main>
    </div>
  );
}

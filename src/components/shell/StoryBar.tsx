import { useEffect, useRef } from 'react';
import { D } from '../../config';
import { useNavigate } from 'react-router-dom';
import { params } from '../../data/params';
import { useApp, appStore } from '../../state/store';
import { Toggle } from '../ui';
import type { Branch } from '../../types';

const DEFAULT_CAPTION = 'Simulated mission. Use the chapters, or step a day at a time.';

function useHoldRepeat(step: () => void) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => { if (timer.current) clearInterval(timer.current); if (delay.current) clearTimeout(delay.current); timer.current = delay.current = null; };
  useEffect(() => stop, []);
  return {
    onPointerDown: (e: React.PointerEvent) => { if (e.button !== 0) return; delay.current = setTimeout(() => { timer.current = setInterval(step, 120); }, 400); },
    onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop,
    onClick: step,
  };
}

function ViewSwitch() {
  const viewer = useApp(s => s.viewer);
  const set = (on: boolean) => appStore.getState().setViewer(on ? 'surgeon' : 'astronaut');
  return (
    <span className="story-view">
      <Toggle on={viewer === 'surgeon'} onChange={set} label="Flight surgeon view" />
      <span className="t-small">{viewer === 'surgeon' ? 'Flight surgeon view' : 'Astronaut view'}</span>
    </span>
  );
}

export function StoryBar({ branch }: { branch: Branch }) {
  const day = useApp(s => s.day), hidden = useApp(s => s.storyHidden), override = useApp(s => s.branchOverride);
  const nav = useNavigate();
  const st = appStore.getState();
  const prev = useHoldRepeat(() => appStore.getState().setDay(appStore.getState().day - 1));
  const next = useHoldRepeat(() => appStore.getState().setDay(appStore.getState().day + 1));
  const ch = params.chapters.find(c => c.day === day);
  const shift = (t: string) => t.replace(/\b([Dd]ays?) (\d+)/g, (_, w: string, n: string) => `${w} ${D(+n)}`);
  const caption = shift(ch ? (ch.caption ?? (branch === 'A' ? ch.captionA : ch.captionB)) ?? '' : DEFAULT_CAPTION);
  if (hidden) return (
    <nav className="storybar storybar--hidden" aria-label="Demo story">
      <button className="btn btn--quiet btn--strip" onClick={() => st.setStoryHidden(false)} aria-expanded="false">Demo story</button>
      <ViewSwitch />
    </nav>
  );
  return (
    <nav className="storybar" aria-label="Demo story">
      <span className="t-label storybar-label">Demo story · simulated</span>
      <div className="story-chips">
        {params.chapters.map(c => (
          <button key={c.id} className="story-chip" aria-current={c.day === day ? 'true' : undefined}
            onClick={() => { st.setDay(c.day); nav(c.route); }}>{shift(c.label)}</button>
        ))}
        {ch?.id === 'followed' && (['A', 'B'] as const).map(b => (
          <button key={b} className="story-chip story-chip--branch" aria-pressed={branch === b}
            onClick={() => st.setBranch(b)}>{b === 'A' ? 'If you acted' : 'If you didn’t'}</button>
        ))}
      </div>
      <span className="story-step">
        <button className="btn btn--sm" aria-label="Previous day" disabled={day <= 1} {...prev}>‹</button>
        <span className="t-small num story-day" aria-live="polite">Day {D(day)}</span>
        <button className="btn btn--sm" aria-label="Next day" disabled={day >= params.mission.lastDay} {...next}>›</button>
        <button className="btn btn--sm btn--quiet" onClick={() => st.setStoryHidden(true)} aria-expanded="true">Hide</button>
      </span>
      <ViewSwitch />
      <p className="story-caption">{caption}{override && ch?.id !== 'followed' ? ` Story branch forced: ${override === 'A' ? 'you acted' : 'you did not'}.` : ''}</p>
    </nav>
  );
}

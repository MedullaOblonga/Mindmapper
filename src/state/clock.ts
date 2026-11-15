import { useEffect, useState } from 'react';
import { create } from 'zustand';

const loadedAt = Date.now();
/** Demo clock: 19:42 on the current mission day, plus real time since the page loaded, unless the demo sets a time. */
interface ClockState { override: number | null; overrideAt: number; atBunk: boolean; setOverride: (min: number | null) => void; setAtBunk: (b: boolean) => void; }
export const useClockStore = create<ClockState>(set => ({
  override: null, overrideAt: 0, atBunk: false,
  setOverride: min => set({ override: min, overrideAt: Date.now() }),
  setAtBunk: b => set({ atBunk: b }),
}));
export function clockNow(): number {
  const { override, overrideAt } = useClockStore.getState();
  const base = override ?? 19 * 60 + 42;
  const since = override === null ? Date.now() - loadedAt : Date.now() - overrideAt;
  return Math.min(1439, base + Math.floor(since / 60000));
}
/** Re-renders every `ms` and returns the demo clock in minutes after 00:00. */
export function useClock(ms = 1000): number {
  const override = useClockStore(s => s.override);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), ms); return () => clearInterval(t); }, [ms]);
  void override;
  return clockNow();
}
export const resetClock = () => useClockStore.setState({ override: null, atBunk: false });

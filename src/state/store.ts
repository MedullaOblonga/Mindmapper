import { createStore, useStore, type StoreApi } from 'zustand';
import { DEFAULT_DAY } from '../config';
import { lastDayOf, openingDayOf } from '../data/journalScenario';
import type { Branch, Source } from '../types';
import type { AppEvent, NewEvent } from './events';

export const STORAGE_KEY = 'pn.v1';
/** Which simulation is open. Each one keeps its own day, choices and entries, so switching back finds it as it was. */
export const SOURCE_KEY = 'pn.source';
export const SOURCES: Source[] = ['demo', 'williams', 'anderson'];
const keyFor = (src: Source) => (src === 'demo' ? STORAGE_KEY : `${STORAGE_KEY}.${src}`);   // the demo keeps its original key
/** Demo only: whose screen is shown. The surgeon sees what was sent to Earth and nothing else. */
export type Viewer = 'astronaut' | 'surgeon';

export interface AppState {
  source: Source; day: number; branchOverride: Branch | null; events: AppEvent[]; storyHidden: boolean; viewer: Viewer;
  setDay: (n: number) => void; setBranch: (b: Branch | null) => void; add: (e: NewEvent) => AppEvent;
  reset: () => void; setStoryHidden: (h: boolean) => void; setViewer: (w: Viewer) => void; setSource: (s: Source) => void;
}

interface Saved { v: 1; day: number; branchOverride: Branch | null; events: AppEvent[]; storyHidden?: boolean; viewer?: Viewer }

function loadSource(): Source {
  try { const s = globalThis.localStorage?.getItem(SOURCE_KEY); return SOURCES.includes(s as Source) ? (s as Source) : 'demo'; } catch { return 'demo'; }
}
function load(src: Source): Partial<Saved> {
  try {
    const raw = globalThis.localStorage?.getItem(keyFor(src));
    if (!raw) return {};
    const d = JSON.parse(raw) as Saved;
    if (!d || d.v !== 1 || !Array.isArray(d.events) || typeof d.day !== 'number') return {};
    const events = d.events.filter(e => e && typeof e === 'object' && typeof e.type === 'string' && typeof e.day === 'number' && typeof e.id === 'string');
    return { day: d.day, branchOverride: d.branchOverride === 'A' || d.branchOverride === 'B' ? d.branchOverride : null, events, storyHidden: !!d.storyHidden,
      viewer: d.viewer === 'surgeon' ? 'surgeon' : 'astronaut' };
  } catch { return {}; }
}
function save(s: AppState) {
  try {
    const d: Saved = { v: 1, day: s.day, branchOverride: s.branchOverride, events: s.events, storyHidden: s.storyHidden, viewer: s.viewer };
    globalThis.localStorage?.setItem(keyFor(s.source), JSON.stringify(d));
    globalThis.localStorage?.setItem(SOURCE_KEY, s.source);
  } catch { /* storage missing or full: keep running in memory */ }
}
const openingDay = (src: Source) => (src === 'demo' ? DEFAULT_DAY : openingDayOf(src));
const clamp = (n: number, src: Source) => Math.max(1, Math.min(lastDayOf(src), Math.round(Number.isFinite(n) ? n : openingDay(src))));
let seq = 0;
const newId = () => `e${Date.now().toString(36)}${(seq++).toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

/** The saved state of one simulation, or its fresh start. */
function stateFor(src: Source) {
  const saved = load(src);
  return { source: src, day: clamp(saved.day ?? openingDay(src), src), branchOverride: src === 'demo' ? saved.branchOverride ?? null : null,
    events: saved.events ?? [], storyHidden: saved.storyHidden ?? false, viewer: saved.viewer ?? 'astronaut' as Viewer };
}

export function createAppStore(): StoreApi<AppState> {
  const store = createStore<AppState>((set, get) => ({
    ...stateFor(loadSource()),
    setDay: n => set({ day: clamp(n, get().source) }),
    setBranch: b => set({ branchOverride: get().source === 'demo' ? b : null }),
    add: e => { const ev = { ...e, id: newId(), day: get().day } as AppEvent; set({ events: [...get().events, ev] }); return ev; },
    reset: () => set({ events: [], branchOverride: null, day: openingDay(get().source) }),
    setStoryHidden: h => set({ storyHidden: h }),
    setViewer: w => set({ viewer: w }),
    setSource: src => { if (src === get().source) return; save(get()); set(stateFor(src)); },
  }));
  store.subscribe(s => save(s));
  return store;
}

export const createStoreForTest = createAppStore;
export const appStore = createAppStore();
export function useApp<T>(sel: (s: AppState) => T): T { return useStore(appStore, sel); }

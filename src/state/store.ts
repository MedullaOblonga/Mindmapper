import { createStore, useStore, type StoreApi } from 'zustand';
import { DEFAULT_DAY, LAST_DAY } from '../config';
import type { Branch } from '../types';
import type { AppEvent, NewEvent } from './events';

export const STORAGE_KEY = 'pn.v1';

export interface AppState {
  day: number; branchOverride: Branch | null; events: AppEvent[]; storyHidden: boolean;
  setDay: (n: number) => void; setBranch: (b: Branch | null) => void; add: (e: NewEvent) => AppEvent;
  reset: () => void; setStoryHidden: (h: boolean) => void;
}

interface Saved { v: 1; day: number; branchOverride: Branch | null; events: AppEvent[]; storyHidden?: boolean }

function load(): Partial<Saved> {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return {};
    const d = JSON.parse(raw) as Saved;
    if (!d || d.v !== 1 || !Array.isArray(d.events) || typeof d.day !== 'number') return {};
    const events = d.events.filter(e => e && typeof e === 'object' && typeof e.type === 'string' && typeof e.day === 'number' && typeof e.id === 'string');
    return { day: d.day, branchOverride: d.branchOverride === 'A' || d.branchOverride === 'B' ? d.branchOverride : null, events, storyHidden: !!d.storyHidden };
  } catch { return {}; }
}
function save(s: AppState) {
  try {
    const d: Saved = { v: 1, day: s.day, branchOverride: s.branchOverride, events: s.events, storyHidden: s.storyHidden };
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch { /* storage missing or full: keep running in memory */ }
}
const clamp = (n: number) => Math.max(1, Math.min(LAST_DAY, Math.round(Number.isFinite(n) ? n : DEFAULT_DAY)));
let seq = 0;
const newId = () => `e${Date.now().toString(36)}${(seq++).toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

export function createAppStore(): StoreApi<AppState> {
  const saved = load();
  const store = createStore<AppState>((set, get) => ({
    day: clamp(saved.day ?? DEFAULT_DAY), branchOverride: saved.branchOverride ?? null, events: saved.events ?? [], storyHidden: saved.storyHidden ?? false,
    setDay: n => set({ day: clamp(n) }),
    setBranch: b => set({ branchOverride: b }),
    add: e => { const ev = { ...e, id: newId(), day: get().day } as AppEvent; set({ events: [...get().events, ev] }); return ev; },
    reset: () => set({ events: [], branchOverride: null, day: DEFAULT_DAY }),
    setStoryHidden: h => set({ storyHidden: h }),
  }));
  store.subscribe(s => save(s));
  return store;
}

export const createStoreForTest = createAppStore;
export const appStore = createAppStore();
export function useApp<T>(sel: (s: AppState) => T): T { return useStore(appStore, sel); }

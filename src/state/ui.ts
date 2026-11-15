import { create } from 'zustand';
import type { Card, Segment } from '../types';

export type TalkRoute = 'work' | 'home' | 'crew' | 'sleep' | 'body' | 'attention' | 'sharing' | 'ledger' | 'mind' | string;
export interface TalkRequest { route: TalkRoute; draft: string; attach?: Segment[]; card?: Card; to?: string; actionLabel?: string; }

interface UIState {
  toast: string | null; toastKey: number;
  shareLogOpen: boolean; whyKey: string | null; whyTopic?: string;
  talk: TalkRequest | null; notRight: Card | null;
  showToast: (m: string) => void; clearToast: () => void;
  openShareLog: (b: boolean) => void; openWhy: (k: string | null, topic?: string) => void;
  openTalk: (t: TalkRequest | null) => void; openNotRight: (c: Card | null) => void;
}
export const useUI = create<UIState>(set => ({
  toast: null, toastKey: 0, shareLogOpen: false, whyKey: null, talk: null, notRight: null,
  showToast: m => set(s => ({ toast: m, toastKey: s.toastKey + 1 })), clearToast: () => set({ toast: null }),
  openShareLog: b => set({ shareLogOpen: b }), openWhy: (k, topic) => set({ whyKey: k, whyTopic: topic }),
  openTalk: t => set({ talk: t }), openNotRight: c => set({ notRight: c }),
}));
export const resetUI = () => useUI.setState({ toast: null, shareLogOpen: false, whyKey: null, talk: null, notRight: null });

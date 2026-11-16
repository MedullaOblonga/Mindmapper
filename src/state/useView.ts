import { useMemo } from 'react';
import { useApp } from './store';
import { buildView, type View } from './view';

export function useView(): View {
  const day = useApp(s => s.day), events = useApp(s => s.events), o = useApp(s => s.branchOverride), src = useApp(s => s.source);
  return useMemo(() => buildView(day, events, o, src), [day, events, o, src]);
}

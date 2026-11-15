import raw from './topics.json';
import type { Group } from '../types';

export interface GroupDef { id: Group; label: string; short?: string; colorVar: string; ink: 'dark' | 'light'; }
export interface CategoryDef { name: string; group: Group; keywords: string[]; }
const t = raw as unknown as { groups: GroupDef[]; categories: CategoryDef[]; feltWords: { good: string[]; hard: string[] };
  h01NetToneByCategory: Record<string, number>; h01CategoryCounts: Record<string, number> };
export const topics = t;
export const GROUPS = t.groups;
export const groupDef = (g: Group): GroupDef => t.groups.find(x => x.id === g)!;
export const groupShort = (g: Group): string => { const d = groupDef(g); return d.short ?? d.label; };
export default t;

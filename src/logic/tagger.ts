import { topics } from '../data/topics';
import type { Felt, Group, Segment } from '../types';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CATS = topics.categories.filter(c => c.keywords.length).map(c => ({ ...c, res: c.keywords.map(k => new RegExp(`\\b${esc(k)}`, 'gi')) }));
const GOOD = topics.feltWords.good.map(k => new RegExp(`\\b${esc(k)}`, 'i'));
const HARD = topics.feltWords.hard.map(k => new RegExp(`\\b${esc(k)}`, 'i'));

export interface ExtraKeywords { category: string; group: Group; keywords: string[]; caseSensitive?: boolean }
export interface ExtraFelt { good: string[]; hard: string[] }
type Cat = { name: string; group: Group; res: RegExp[] };
const compile = (x: ExtraKeywords[]): Cat[] => x.map(c => ({ name: c.category, group: c.group, res: c.keywords.map(k => new RegExp(`\\b${esc(k)}`, c.caseSensitive ? 'g' : 'gi')) }));

function classify(sentence: string, cats: Cat[] = CATS): { category: string; group: Group } {
  let best: { category: string; group: Group; hits: number; first: number } | null = null;
  for (const c of cats) {
    let hits = 0, first = Infinity;
    for (const re of c.res) { re.lastIndex = 0; let m: RegExpExecArray | null; while ((m = re.exec(sentence))) { hits++; first = Math.min(first, m.index); if (re.lastIndex === m.index) re.lastIndex++; } }
    if (hits && (!best || hits > best.hits || (hits === best.hits && first < best.first))) best = { category: c.name, group: c.group, hits, first };
  }
  return best ? { category: best.category, group: best.group } : { category: 'Uncategorised', group: 'other' };
}

export function guessFelt(text: string, extra?: ExtraFelt): Felt | null {
  const more = (ws: string[] = []) => ws.some(k => new RegExp(`\\b${esc(k)}`, 'i').test(text));
  const g = GOOD.some(r => r.test(text)) || more(extra?.good), h = HARD.some(r => r.test(text)) || more(extra?.hard);
  return g && h ? 'mixed' : g ? 'good' : h ? 'hard' : null;
}

/** DESIGN §8.6 keyword tagger. Runs in the browser; nothing leaves the device. */
/** `extra`: more keywords for this text only, such as the names of a real crew (case-sensitive). */
export function tagEntry(text: string, day: number, idPrefix: string, extra: ExtraKeywords[] = [], extraFelt?: ExtraFelt): Segment[] {
  const cats = extra.length ? [...CATS, ...compile(extra)] : CATS;
  const sentences = (text.match(/[^.!?\n]+[.!?]*/g) ?? []).map(s => s.trim()).filter(s => s.replace(/[.!?\s]/g, '').length > 0);
  const merged: { text: string; category: string; group: Group }[] = [];
  for (const s of sentences) {
    const c = classify(s, cats);
    const last = merged[merged.length - 1];
    if (last && last.category === c.category) last.text += ` ${s}`;
    else merged.push({ text: s, ...c });
  }
  return merged.map((m, i) => ({ id: `${idPrefix}-s${i + 1}`, day, text: m.text, category: m.category, group: m.group,
    felt: guessFelt(m.text, extraFelt), feltBy: 'tool', origin: 'user' }));
}

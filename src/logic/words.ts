const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const numWord = (n: number) => NUM[n] ?? String(n);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const capFirst = cap;

/** DESIGN §8.2 ratio words. Under 1.5 → null. */
export function ratioWords(r: number): string | null {
  if (!Number.isFinite(r) || r < 1.5) return null;
  if (r < 2.0) return 'about one and a half times';
  if (r < 2.7) return 'about twice';
  if (r < 3.5) return 'about three times';
  if (r < 4.0) return 'nearly four times';
  if (r < 4.5) return 'about four times';
  return `about ${numWord(Math.round(r))} times`;
}

export function countWord(n: number): string { return `${cap(numWord(n))} ${n === 1 ? 'thing' : 'things'}`; }

/** "109, 110 and 111" */
export function listWords(xs: (string | number)[]): string {
  const s = xs.map(String);
  if (s.length <= 1) return s.join('');
  return `${s.slice(0, -1).join(', ')} and ${s[s.length - 1]}`;
}

/** Nearest of the share words used in drafts (Talk sheet). */
export function shareWords(pct: number): string {
  const opts: [number, string][] = [[10, 'about a tenth'], [20, 'about a fifth'], [25, 'about a quarter'], [33, 'about a third'], [50, 'about half'], [67, 'about two thirds']];
  let best = opts[0];
  for (const o of opts) if (Math.abs(o[0] - pct) < Math.abs(best[0] - pct)) best = o;
  return best[1];
}

/** "About 1 in 10", "Hardly any" under 4%. */
export function oneInN(pct: number): string {
  if (pct < 4) return 'Hardly any';
  return `About 1 in ${Math.round(100 / pct)}`;
}

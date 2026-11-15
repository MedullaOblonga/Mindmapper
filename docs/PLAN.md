# Psych Navigator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Psych Navigator web app described in `DESIGN.md` and deploy it to a public URL with no login.

**Architecture:** A static single-page app. One deterministic simulated mission is generated in the browser from `reference/scenario-params.json`. All screens are pure views of three things: the current mission day, the story branch, and an append-only list of user events kept in `localStorage`. No backend.

**Tech Stack:** Vite, React 18, TypeScript (strict), react-router-dom (HashRouter), zustand, lucide-react, Vitest, @testing-library/react, jsdom. Node 20 or newer. Deployed on Vercel as a static site.

**Spec:** `docs/DESIGN.md` (section numbers below, like §7.1, point into it). Visual reference: `docs/reference/app.css` and `docs/reference/shell-today.html`. Data: `docs/reference/scenario-params.json`, `docs/reference/topics.json`, `docs/reference/nasa/check_history.json` (real NASA data; never edit or re-order it).

## Global Constraints

- Copy `DESIGN.md`, `PLAN.md` and `reference/` into `docs/` of the new repo before Task 1. Read all of `DESIGN.md` before writing code.
- `src/styles/app.css` is a byte-for-byte copy of `reference/app.css`. New CSS goes in `src/styles/screens.css` and may only use the variables defined in `app.css`.
- No hex colour, `rgb(` or named colour in any `.tsx` file. Use classes or `var(--…)`.
- No red, amber or green anywhere. No overall score. Every rule in DESIGN §3 holds.
- All user-facing text comes from DESIGN.md word for word where DESIGN.md gives the words. Do not use these words in the UI: wellness, detected, flagged, burnout, sentiment, baseline. The word "score" appears only where DESIGN.md writes it (for example the link "Why is there no mood score?"). Do not use the words "normal range".
- Every threshold is a named constant in `src/logic/thresholds.ts` with a comment `// placeholder, DESIGN §8.x`.
- Mission day is an integer 1–126. Week `w` = days `7w−6 … 7w`. `dayIndex` is 1–7.
- Minutes are minutes after 00:00 of the wake day; sleep onset may be negative.
- Nothing is fetched at runtime except Google Fonts. The three JSON files (`scenario-params.json`, `topics.json`, `nasa/check_history.json`) are imported at build time.
- App name comes only from `APP_NAME` in `src/config.ts` (`'Psych Navigator'`).
- No NASA logo or insignia. Footer on every screen: "Sample data for illustration. Names are placeholders."
- Commit after every task with the message given. Run `npm test -- --run` and `npm run build` before each commit; both must pass.

## Review Focus

1. **Going back in time.** A user resolves a card on day 112, then steps to day 98. Nothing they did on day 112 may show on day 98, and it must reappear on returning to 112. (Tests in Task 6.)
2. **Diary text with no keywords, only spaces, or 5,000 characters.** Must save (or refuse empty), tag as Uncategorised, and never crash. (Task 8.)
3. **A week with no diary entries.** Share rows must show "No entries this week", not `NaN%` or a broken grid. (Task 4 and 9.)
4. **Attention test interrupted:** tab hidden, window blurred, key held down, double tap. Must not record garbage. (Task 11.)
5. **`localStorage` missing, full, or holding data from an older version.** The app must still run, in memory, from a clean state. (Task 6.)

---

## Milestone 0 — Scaffold

### Task 1: Project, styles and a static shell that matches the mock

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/config.ts`, `src/styles/app.css`, `src/styles/screens.css`, `src/test/setup.ts`
- Create: `src/components/shell/TopBar.tsx`, `StoryBar.tsx`, `Rail.tsx`, `Shell.tsx`
- Create: `src/screens/Placeholder.tsx`
- Test: `src/components/shell/Shell.test.tsx`, `src/test/guards.test.ts`

**Interfaces:**
- Produces: `<Shell>{children}</Shell>` rendering top bar, story bar, rail and a `<main className="page">`. Routes from DESIGN §5.1, each rendering `<Placeholder title=… />` for now.
- Produces: `APP_NAME: string`, `MISSION_LENGTH = 520`, `LAST_DAY = 126`, `DEFAULT_DAY = 112` in `src/config.ts`.

- [ ] **Step 1:** `npm create vite@latest . -- --template react-ts` (the folder already holds `docs/`; if asked, choose "Ignore files and continue"), then `npm i react-router-dom zustand lucide-react` and `npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`. Add `"test": "vitest"` to scripts and a `test: { environment: 'jsdom', setupFiles: 'src/test/setup.ts', globals: true }` block to `vite.config.ts`. In `tsconfig.json` set `"resolveJsonModule": true`.
- [ ] **Step 2:** Copy `docs/reference/app.css` to `src/styles/app.css`. Put the Google Fonts `<link>` tags from the mock into `index.html`. Set `<title>` to the app name.
- [ ] **Step 3: Write the failing tests**

```tsx
// Shell.test.tsx
it('renders the three navigation regions', () => {
  render(<HashRouter><App /></HashRouter>);
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Demo story' })).toBeInTheDocument();
  expect(screen.getByText(/Stays on this device/)).toBeInTheDocument();
  expect(screen.getByText('MISSION DAY 112 OF 520', { exact: false })).toBeInTheDocument();
});
```

```ts
// guards.test.ts — runs over every file in src/**/*.tsx
it('has no hard-coded colours in components', () => {
  for (const [path, text] of tsxFiles) expect(text, path).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
it('has no banned words in UI text', () => {
  const banned = /\b(wellness|detected|flagged|burnout|sentiment|baseline)\b/i;
  for (const [path, text] of tsxFiles) expect(stripImportsAndComments(text), path).not.toMatch(banned);
});
```
Load `tsxFiles` with `import.meta.glob('/src/**/*.tsx', { query: '?raw', import: 'default', eager: true })`, skipping `*.test.tsx`.

- [ ] **Step 4:** Run `npm test -- --run`. Expected: FAIL (App has no shell).
- [ ] **Step 5:** Build `Shell`, `TopBar`, `StoryBar`, `Rail` by porting the markup of `reference/shell-today.html` (same class names, same order). The top bar label is one text node: `MISSION DAY {day} OF 520`. Use lucide icons `Sun, NotebookPen, AlignLeft, Bookmark, Info, Lock`. For now the day is the constant 112 and the story chips are static.
- [ ] **Step 6:** Run tests. Expected: PASS. Run `npm run dev` and compare against `docs/reference/shell-today.html` opened in a browser at 1366 × 768: rail, top bar and story bar must match.
- [ ] **Step 7:** Commit: `feat: scaffold app shell and design system`.

---

## Milestone 1 — Data

### Task 2: Types, small maths and formatting

**Files:**
- Create: `src/types.ts` (copy the block in DESIGN §9.2 exactly; add `WeekRow` and `Profile` mirroring the JSON), `src/lib/stats.ts`, `src/lib/time.ts`, `src/lib/prng.ts`, `src/logic/thresholds.ts`
- Test: `src/lib/stats.test.ts`, `src/lib/time.test.ts`

**Interfaces — Produces:**
```ts
// stats.ts
export function median(xs: number[]): number;                       // [] -> NaN
export function usualForWeek(byWeek: Record<number, number>, week: number): number | null;
export function roundTo100(parts: number[]): number[];              // largest remainder; all-zero -> all zero
// time.ts
export function weekOf(day: number): number;                        // 1..18
export function dayIndex(day: number): number;                      // 1..7
export function fmtClock(min: number): string;                      // 42 -> "00:42", -50 -> "23:10", 400 -> "06:40"
export function fmtDuration(min: number): string;                   // 358 -> "5h 58m"
export function fmtLater(min: number): string;                      // 92 -> "1 h 32 min"
// prng.ts
export function mulberry32(seed: number): () => number;
// thresholds.ts
export const T = { settlingDays: 14, usualWeeks: [3, 8] as const, minWeeksForUsual: 3,
  shareRisePoints: 0.10, shareRiseRatio: 1.5, shareRiseWeeks: 3, hardRisePoints: 0.20, hardMinEntries: 5,
  sleepShortMin: 60, ledgerGap: 2, ledgerRatio: 2, lapseOver: 2, rtWobbleTimes: 3, rtRunSessions: 2, minSessionsForUsual: 6, newUsualWeeks: 4, lapseMs: 355, falseStartMs: 100,
  onsetLateMin: 60, onsetLateNights: 3, quietActedDays: 28, quietSkippedDays: 7, maxCardsPerWeek: 3 };
```

- [ ] **Step 1: Write the failing tests**

```ts
it('usualForWeek follows DESIGN §8.1', () => {
  const d = { 3: 5, 4: 5, 5: 5, 6: 2, 7: 5, 8: 5, 9: 9, 16: 1 };
  expect(usualForWeek(d, 5)).toBeNull();          // needs 3 earlier weeks from week 3
  expect(usualForWeek(d, 6)).toBe(5);             // median of weeks 3..5
  expect(usualForWeek(d, 9)).toBe(5);             // median of weeks 3..8
  expect(usualForWeek(d, 16)).toBe(5);            // still weeks 3..8
});
it('roundTo100 sums to 100', () => {
  expect(roundTo100([8, 8, 3, 3, 1, 1, 0]).reduce((a, b) => a + b)).toBe(100);
  expect(roundTo100([0, 0, 0])).toEqual([0, 0, 0]);
});
it('formats times', () => {
  expect(fmtClock(42)).toBe('00:42'); expect(fmtClock(-50)).toBe('23:10'); expect(fmtClock(400)).toBe('06:40');
  expect(fmtDuration(358)).toBe('5h 58m'); expect(fmtDuration(430)).toBe('7h 10m'); expect(fmtLater(92)).toBe('1 h 32 min');
  expect(weekOf(112)).toBe(16); expect(dayIndex(112)).toBe(7); expect(dayIndex(106)).toBe(1);
});
```
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: types, stats and time helpers`.

### Task 3: The simulated mission

**Files:**
- Create: `src/data/params.ts` (typed re-export of `docs/reference/scenario-params.json`, copied to `src/data/scenario-params.json`), `src/data/topics.ts` (same for `topics.json`), `src/data/nasa/check_history.json` (copied from `docs/reference/nasa/`; real NASA bed-rest test sessions, do not edit), `src/data/sentences.ts`, `src/data/scenario.ts`
- Test: `src/data/scenario.test.ts`

**Interfaces:**
- Consumes: Task 2.
- Produces: `buildScenario(branch: Branch): Scenario` (memoised per branch); `SENTENCES: Record<Group, Record<Felt, string[]>>` with 6 strings each for the 7 real groups, written to the voice rules in `scenario-params.json → sentenceBank`.

Follow `scenario-params.json → generation` literally: `segmentAssignment`, `feltCycles`, `sleepRule`, `blockDayIndexes`, `blockTimes`, `checks`. Weeks 17–18 come from `weeksBranchA` or `weeksBranchB`. Segment ids are `d{day}-s{n}`; block ids `d{day}-{kind}-{n}`. Every generated segment has `origin: 'ai-sample'`, `feltBy: 'tool'`. Day 112 has no entry. Apply `day112BlockFelt` to day 112's blocks. Mark the block in `mission.safetyCriticalBlocks` as `safetyCritical`.

- [ ] **Step 1: Write the failing tests**

```ts
const A = buildScenario('A'), B = buildScenario('B');
const segs = (s: Scenario, w: number) => s.entries.flatMap(e => e.segments).filter(x => weekOf(x.day) === w);
it('has 126 days and is deterministic', () => {
  expect(A.days).toHaveLength(126);
  expect(JSON.stringify(buildScenario('A'))).toBe(JSON.stringify(A));
});
it('matches the weekly tables exactly', () => {
  for (const row of params.weeks) for (const g of params.groupsOrder)
    expect(segs(A, row.week).filter(s => s.group === g).length, `w${row.week} ${g}`).toBe(row.segments[g]);
  const home16 = segs(A, 16).filter(s => s.group === 'home');
  expect(home16.filter(s => s.felt === 'hard')).toHaveLength(5);
});
it('reproduces the story numbers', () => {
  const d112 = A.days[111];
  expect([d112.onsetMin, d112.sleepMin, d112.wakeMin]).toEqual([42, 358, 400]);
  expect(A.days.slice(109, 112).every(d => d.onsetMin >= 0)).toBe(true);     // wake days 110,111,112
  expect(A.days[108].onsetMin).toBeLessThan(0);
  const journalDays = new Set(A.entries.filter(e => e.day >= 57 && e.day <= 112).map(e => e.day));
  expect(journalDays.size).toBe(41);
  expect(A.entries.some(e => e.day === 112)).toBe(false);
  expect(A.entries.flatMap(e => e.segments).some(s => s.text.startsWith('I keep doing the math'))).toBe(true);
});
it('has checks every fourth day and the day-112 morning result', () => {
  expect(A.checks.filter(c => c.day === 8)).toHaveLength(2);
  const c = A.checks.find(c => c.day === 112 && c.slot === 'am')!;
  expect([c.meanRtMs, c.lapses, c.origin]).toEqual([281, 4, 'sim']);
  const first = A.checks[0];                                  // day 4 am = first replayed NASA session
  expect([first.day, first.slot, first.meanRtMs, first.origin]).toEqual([4, 'am', 193, 'nasa-replay']);
  expect(A.checks.filter(c => c.day <= 108 && c.origin === 'nasa-replay')).toHaveLength(54);
  expect(A.checks.some(c => c.day === 112 && c.slot === 'pm')).toBe(false);
});
it('branches after day 112', () => {
  expect(JSON.stringify(A.days.slice(0, 112))).toBe(JSON.stringify(B.days.slice(0, 112)));
  expect(A.days[113].onsetMin).toBeLessThan(0);     // wake day 114
  expect(B.days[113].onsetMin).toBeGreaterThanOrEqual(0);
});
```
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Write `sentences.ts`, then `scenario.ts`. **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: deterministic simulated mission`.

### Task 4: Weekly pictures (shares, felt, ledger, signs)

**Files:**
- Create: `src/logic/shares.ts`, `src/logic/ledger.ts`, `src/logic/signs.ts`
- Test: `src/logic/shares.test.ts`, `ledger.test.ts`, `signs.test.ts`

**Interfaces — Produces:**
```ts
// All take entries/days already filtered to "what exists on `day`" by the caller (Task 6).
export function weekCounts(entries: Entry[], week: number): Record<Group, number>;
export function weekShares(entries: Entry[], week: number): { group: Group; count: number; share: number; pct: number }[] | null; // null = no entries
export function feltCounts(entries: Entry[], group: Group, fromDay: number, toDay: number): { count: number; good: number; mixed: number; hard: number };
export function usualShare(entries: Entry[], group: Group, week: number): number | null;
export function usualHardShare(entries: Entry[], group: Group, week: number): number | null;   // hard / count over weeks 3..8

export interface LedgerFlags { countWristDinners: boolean; quietKeys: LedgerKey[];
  movedUsual: Partial<Record<LedgerKey, { fromWeek: number; value: number }>>; }   // set by "this is my new usual", DESIGN §8.1
export function ledgerForWeek(s: Scenario, week: number, extra: { copingDone: number; wristDinners: Record<number, number> }, flags: LedgerFlags): LedgerItem[];
//   order and labels as the table in DESIGN §7.4; `far` per DESIGN §8.2 "Far from usual, draining direction"
//   dinners for week 6 = 2, or 2 + generation.week6UnloggedDinners when flags.countWristDinners

export function pastMidnightRun(days: DayRecord[], day: number): { run: number; eveningDays: number[] };   // counts back from wake day `day`
export type SignStatus = { id: string; status: 'showed' | 'not' | 'unknown'; text: string; days?: number[] };
export function signStatuses(s: Scenario, day: number): SignStatus[];
```

- [ ] **Step 1: Write the failing tests** (use `buildScenario('A')`)

```ts
it('family share goes from 10% to 33%', () => {
  const pct = (w: number) => weekShares(A.entries, w)!.find(x => x.group === 'home')!.pct;
  expect(pct(9)).toBe(10); expect(pct(16)).toBe(33);
  expect(weekShares(A.entries, 16)!.reduce((a, x) => a + x.pct, 0)).toBe(100);
  expect(weekShares([], 16)).toBeNull();
});
it('counts how family felt', () => {
  expect(feltCounts(A.entries, 'home', 57, 70)).toEqual({ count: 4, good: 4, mixed: 0, hard: 0 });
  expect(feltCounts(A.entries, 'home', 99, 112)).toEqual({ count: 15, good: 4, mixed: 2, hard: 9 });
});
it('ledger week 16 matches the design', () => {
  const L = ledgerForWeek(A, 16, { copingDone: 0, wristDinners: {} }, { countWristDinners: false, quietKeys: [], movedUsual: {} });
  const get = (k: string) => L.find(i => i.key === k)!;
  expect(get('sleep').sentence).toBe('5h 58m a night. Below your usual 7h 10m.');
  expect(get('dinners').sentence).toBe('1 this week. Below your usual 5.');
  expect(L.filter(i => i.far).map(i => i.key).sort()).toEqual(['callsMissed', 'callsSam', 'dinners', 'noisyNights', 'sleep', 'suitPrepLong']);
  expect(L.filter(i => i.away).map(i => i.key).sort()).toEqual(['callsMissed', 'callsSam', 'dinners', 'noisyNights', 'sleep', 'suitPrepLong']);
  expect(get('gym').away).toBe(false);                          // 5 against a usual of 4 is near, not away
  const moved = ledgerForWeek(A, 17, { copingDone: 0, wristDinners: {} }, { countWristDinners: false, quietKeys: [], movedUsual: { dinners: { fromWeek: 17, value: 3 } } }).find(i => i.key === 'dinners')!;
  expect([moved.usual, moved.earlyUsual]).toEqual([3, 5]);
});
it('week 6 dinners depend on the wrist flag', () => {
  const f = (b: boolean) => ledgerForWeek(A, 6, { copingDone: 0, wristDinners: {} }, { countWristDinners: b, quietKeys: [], movedUsual: {} }).find(i => i.key === 'dinners')!;
  expect([f(false).value, f(false).far]).toEqual([2, true]); expect([f(true).value, f(true).far]).toEqual([5, false]);
});
it('midnight sign', () => {
  expect(pastMidnightRun(A.days, 112)).toEqual({ run: 3, eveningDays: [109, 110, 111] });
  expect(pastMidnightRun(buildScenario('B').days, 114).run).toBe(5);
  const st = signStatuses(A, 112);
  expect(st.find(x => x.id === 'midnight')!.text).toBe('Showed up: 3 nights in a row');
  expect(st.find(x => x.id === 'short')!.status).toBe('unknown');
  expect(st.find(x => x.id === 'light')!.text).toBe('Showed up on 2 nights');
});
```
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: weekly shares, ledger and early signs`.

---

## Milestone 2 — The noticing engine and state

### Task 5: Cards

**Files:**
- Create: `src/logic/words.ts`, `src/logic/cards.ts`, `src/data/evidence.ts`
- Test: `src/logic/cards.test.ts`

**Interfaces:**
- Consumes: Tasks 3–4.
- Produces:
```ts
export function ratioWords(r: number): string | null;                 // DESIGN §8.2 table; < 1.5 -> null
export function countWord(n: number): string;                         // 1 "One thing", 2 "Two things", 3 "Three things"
export interface CardContext { entries: Entry[]; checks: CheckSession[]; flags: LedgerFlags;
  quiet: { kind: CardKind; subject: string; untilDay: number }[];
  movedUsual: Record<string, { fromWeek: number; value: number }>; }   // keys: `ledger:${LedgerKey}`, `topic:${Group}`, 'sleepStart', 'rt'
export function candidateCards(s: Scenario, week: number, ctx: CardContext): Card[];   // every qualifying card, in DESIGN §8.2 order, no cap
export const WHY: Record<string, { title: string; compared: string; rule: string; source: string }>;   // keys from DESIGN §9.4
```
`candidateCards` returns `[]` for weeks 1–2 and whenever a usual is missing. It applies: one own-sign per week, rhythm dropped when a sleep own-sign qualifies, quiet periods, ledger subject and title rules, statements and actions from DESIGN §8.2–8.3. Where `movedUsual` has an entry whose `fromWeek <= week`, that value replaces the early-mission usual for that measure.

- [ ] **Step 1: Write the failing tests**

```ts
const ctx = (over: Partial<CardContext> = {}): CardContext => ({ entries: A.entries, checks: A.checks,
  flags: { countWristDinners: false, quietKeys: [], movedUsual: {} }, quiet: [], movedUsual: {}, ...over });
it('day 42: one ledger card about dinners', () => {
  const c = candidateCards(A, 6, ctx());
  expect(c.map(x => x.kind)).toEqual(['ledger']);
  expect(c[0].statement).toBe('Dinners with crew: 2 this week. Your usual is 5.');
  expect(c[0].title).toBe('Fewer dinners with crew');
});
it('weeks 7 to 14 are quiet', () => { for (let w = 7; w <= 14; w++) expect(candidateCards(A, w, ctx()), `w${w}`).toEqual([]); });
it('day 105: one ledger card, two items', () => {
  const c = candidateCards(A, 15, ctx());
  expect(c).toHaveLength(1);
  expect(c[0].title).toBe('Fewer dinners with crew and more long suit-prep days');
});
it('day 112: family, own sign, check come first, in that order', () => {
  const c = candidateCards(A, 16, ctx());
  expect(c.slice(0, 3).map(x => [x.kind, x.subject])).toEqual([['topic-shift', 'home'], ['own-sign', 'midnight'], ['check', 'am']]);
  expect(c[0].statement).toBe('Family has come up nearly four times as often as in your first two weeks. More of it felt hard.');
  expect(c[0].evidence).toMatchObject({ type: 'marks', rows: [{ label: 'Days 57 to 70', count: 4, good: 4 }, { label: 'Days 99 to 112', count: 15, hard: 9 }] });
  expect(c[0].actions.map(a => a.label)).toEqual(['Write about it', 'Book a call window', 'Talk to someone']);
  expect(c[1].statement).toContain('It showed up on days 109, 110 and 111.');
  expect(c[2].actions[0].label).toBe('Ask Ana to second-check the EVA prep review');
  expect(c.some(x => x.kind === 'rhythm')).toBe(false);
});
it('a bigger share without harder entries makes no card', () => {
  const softened = A.entries.map(e => ({ ...e, segments: e.segments.map(s => s.group === 'home' ? { ...s, felt: 'good' as const } : s) }));
  expect(candidateCards(A, 16, ctx({ entries: softened })).some(x => x.kind === 'topic-shift')).toBe(false);
});
it('quiet periods and ratio words', () => {
  expect(candidateCards(A, 16, ctx({ quiet: [{ kind: 'topic-shift', subject: 'home', untilDay: 130 }] }))[0].kind).toBe('own-sign');
  expect(ratioWords(3.75)).toBe('nearly four times'); expect(ratioWords(2.1)).toBe('about twice'); expect(ratioWords(1.2)).toBeNull();
});
```
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: noticing engine`.

### Task 6: Store, time travel and the view model

**Files:**
- Create: `src/state/events.ts`, `src/state/store.ts`, `src/state/view.ts`
- Test: `src/state/view.test.ts`, `src/state/store.test.ts`

**Interfaces:**
- Consumes: Tasks 3–5.
- Produces:
```ts
// events.ts — every user action is one event; nothing else is stored
export type AppEvent = { id: string; day: number } & (
  | { type: 'resolve'; cardId: string; status: 'acted' | 'not-right' | 'skipped'; title: string; choice: string; effect: string; reason?: 'missing' | 'new-usual' | 'fine' | 'other'; kind: CardKind; subject: string }
  | { type: 'share'; to: string; text: string }
  | { type: 'entry'; entry: Entry }
  | { type: 'retag'; segmentId: string; group?: Group; felt?: Felt }
  | { type: 'check'; session: CheckSession }
  | { type: 'mark'; min: number; blockLabel: string | null }
  | { type: 'reminder'; reminderId: string; on?: boolean; text?: string; buzz?: ('short' | 'long')[] }
  | { type: 'block-felt'; blockId: string; felt: Felt }
  | { type: 'block-add'; block: Block }
  | { type: 'coping'; taskId: string; phase: 'start' | 'done'; before?: number; after?: number }
  | { type: 'activity'; key: 'dinners' | 'greenhouse' | 'gym' | 'other'; label: string }
  | { type: 'rule-change'; ruleId: string; text: string; atLeast: number }
  | { type: 'dismiss'; what: 'tonight' });
// store.ts
export const useApp: UseBoundStore<…>;   // state: { day, branchOverride: Branch | null, events: AppEvent[], storyHidden }
//   actions: setDay(n) (clamped 1..126), setBranch(b | null), add(event without id/day), reset()
//   persisted under localStorage key 'pn.v1' as { v: 1, day, branchOverride, events }; any read/parse/write error -> run in memory
export function createStoreForTest(): StoreApi<…>;   // a fresh store that reads localStorage the same way; default day 112
export interface ReminderView { id: string; text: string; wristLabel: string; buzz: ('short' | 'long')[]; on: boolean; oneOff: boolean; }
// view.ts — pure
export function branchFor(events: AppEvent[], override: Branch | null): Branch;        // A iff an 'acted' resolve exists for a week-16 card
export interface View { day: number; week: number; branch: Branch; scenario: Scenario; entries: Entry[]; checks: CheckSession[];
  openCards: Card[]; resolutions: Resolution[]; skippedThisWeek: number; shareLog: ShareLogEntry[];
  lineCrossed: { day: number; message: string } | null; flags: LedgerFlags; reminders: ReminderView[];
  marksToday: { min: number; blockLabel: string | null }[]; entryToday: Entry | null; }
export function buildView(day: number, events: AppEvent[], override: Branch | null): View;
```

Rules for `buildView` (DESIGN §8.2–8.5):
1. Use only events with `event.day <= day`, and only scenario data with `day <= day`.
2. For each review week `w` with `7w <= day`, starting at week 3: compute candidates; a card is *resolved* if a resolve event for its id exists, or if a scripted resolution exists for that day and `day > scriptedDay` (then synthesise the resolution). When computing the candidates of week `w`, ignore the effects (flags, quiet periods, threshold scale) of resolutions whose card belongs to week `w` or later; otherwise correcting a card would erase the card it corrects. `View.flags`, used for display, includes every resolution up to `day`, so a correction shows at once on the ledger.
3. The cards *raised* at a review = unresolved cards from earlier weeks whose condition still holds, plus that week's new candidates, cut to the first 3 in DESIGN order. This set is fixed for the week: resolving one does not promote a fourth. `openCards` = the raised cards not yet resolved.
4. `lineCrossed` when a share rule with `auto: true` first reached its threshold within the last 7 days; `shareLog` includes that automatic entry (derived, not stored) plus `share` and `rule-change` events.
5. `entries` = scenario entries up to `day`, plus `entry` events, with `retag` events applied.
6. A resolve event with `reason: 'new-usual'` on a card of week `w` adds `movedUsual` entries for everything named on that card, with `fromWeek: w + 1` and `value` = the median of weeks `w−3 … w` (DESIGN §8.1). It also starts the 28-day quiet period.

- [ ] **Step 1: Write the failing tests**

```ts
const v = (day: number, ev: AppEvent[] = [], o: Branch | null = null) => buildView(day, ev, o);
it('story chapters', () => {
  expect(v(12).openCards).toEqual([]);
  expect(v(42).openCards.map(c => c.title)).toEqual(['Fewer dinners with crew']);
  expect(v(98).openCards).toEqual([]);
  expect(v(98).resolutions[0]).toMatchObject({ day: 42, status: 'not-right', effect: 'It now counts dinners you log from your wrist too.' });
  expect(v(112).openCards.map(c => c.kind)).toEqual(['topic-shift', 'own-sign', 'check']);
  expect(v(112).resolutions.map(r => r.day)).toEqual([105, 42]);
});
it('never shows the future', () => {
  const act: AppEvent = { id: 'e1', day: 112, type: 'resolve', cardId: v(112).openCards[0].id, status: 'acted', title: 't', choice: 'c', effect: 'e', kind: 'topic-shift', subject: 'home' };
  expect(v(112, [act]).openCards).toHaveLength(2);
  expect(v(98, [act]).resolutions.some(r => r.day === 112)).toBe(false);
  expect(v(42, [act]).openCards).toHaveLength(1);
});
it('branches', () => {
  expect(v(119).branch).toBe('B');
  expect(v(119).lineCrossed).toMatchObject({ day: 114 });
  expect(v(119).shareLog[0]).toMatchObject({ day: 114, auto: true });
  expect(v(113).lineCrossed).toBeNull();
  expect(v(119, [], 'A').lineCrossed).toBeNull();
});
it('a new usual stops the same card coming back', () => {
  const card = v(112).openCards[0];                              // family topic-shift
  const nu: AppEvent = { id: 'e2', day: 112, type: 'resolve', cardId: card.id, status: 'not-right', reason: 'new-usual', title: card.title, choice: 'That’s not right', effect: 'x', kind: 'topic-shift', subject: 'home' };
  expect(v(112, [nu]).openCards.map(c => c.kind)).toEqual(['own-sign', 'check']);
  expect(v(126, [nu]).openCards.some(c => c.kind === 'topic-shift')).toBe(false);
  expect(v(126, [nu]).resolutions.some(r => r.status === 'not-right' && r.day === 112)).toBe(true);
});
it('survives a broken localStorage', () => {
  localStorage.setItem('pn.v1', '{not json'); 
  expect(() => createStoreForTest()).not.toThrow();
  expect(createStoreForTest().getState().day).toBe(112);
});
```
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: event store and time-travel view model`.

---

## Milestone 3 — P0 screens (deploy at the end of this milestone)

Each screen task follows the same five steps: (1) write the listed tests with Testing Library, (2) run and see them fail, (3) build the screen to its DESIGN section using only classes from `app.css` plus `screens.css`, (4) run tests and compare with the mock or the named canvas board at 1366 × 768, (5) commit. Shared UI parts go in `src/components/ui/`: `Button`, `Panel`, `Mark`, `MarkRow`, `UsualBar`, `Tag`, `Toggle`, `Sheet`, `Drawer`, `Toast`, `Tabs`.

### Task 7: Shell wiring, Today, Not-right sheet, Talk sheet

**Files:** Modify `Shell.tsx`, `TopBar.tsx`, `StoryBar.tsx`, `Rail.tsx`. Create `src/components/ui/*`, `src/components/cards/CardStack.tsx`, `MatchCard.tsx`, `Evidence.tsx`, `NotRightSheet.tsx`, `TalkSheet.tsx`, `src/components/shell/ShareLogDrawer.tsx`, `WhyDrawer.tsx`, `src/screens/Today.tsx`. Test: `src/screens/Today.test.tsx`, `src/components/shell/StoryBar.test.tsx`.

**Spec:** DESIGN §5.2, §7.1, §7.15, §7.16, §8.3, §8.4.

**Tests must assert:**
- Day 12 shows the heading "Still learning your usual"; day 98 shows "On your usual pattern"; day 112 shows "Does this match?" and "1 of 3 this week".
- Clicking the chapter "Day 42 · It gets one wrong" sets the day to 42, navigates to `/today`, and shows the caption from the JSON.
- The Not-right sheet's second row reads "It is accurate, and this is my new usual" on a `topic-shift`, `ledger`, `rhythm` or `check` card, and "It is accurate, but it is not a concern right now" on an `own-sign` card.
- On day 42: click "That's not right" → choose "The data is wrong, or something is missing" → "Tell the tool" → the card disappears and "It now counts dinners you log from your wrist too." is visible.
- On day 112: click "Talk to someone" → the sheet's draft contains "about a third of my diary" and does not contain any diary sentence → "Send" → top bar reads "Share log: 1 shared".
- On day 112: "Skip for now" three times → heading "On your usual pattern" is NOT shown; instead the heading is "Nothing left to look at this week" and the text "You skipped 3 cards this week." is visible.
- Talk-sheet drafts turn a share into words by the nearest of: 10% "about a tenth", 20% "about a fifth", 25% "about a quarter", 33% "about a third", 50% "about half", 67% "about two thirds".
- On day 119 with no events, the "AGREED BEFORE LAUNCH" banner shows the exact message from `shareRules[0].message`.
- Escape closes a sheet and returns focus to the button that opened it.

- [ ] Steps 1–5 as above. Commit: `feat: today screen, cards and sheets`.

### Task 8: Diary tagger and Journal

**Files:** Create `src/logic/tagger.ts`, `src/screens/Journal.tsx`. Test: `src/logic/tagger.test.ts`, `src/screens/Journal.test.tsx`.

**Interfaces — Produces:** `tagEntry(text: string, day: number, idPrefix: string): Segment[]` per DESIGN §8.6 (`origin: 'user'`).

**Tests must assert:**
```ts
it('tags by NASA category, first-mentioned wins ties', () => {
  const s = tagEntry('Missed the call window with Sam again. The printer jammed and I fixed it, finally.', 112, 'u1');
  expect(s.map(x => [x.category, x.group, x.felt])).toEqual([['Outside Communications', 'home', 'hard'], ['Equipment', 'work', 'good']]);
});
it('handles empty, unknown and long text', () => {
  expect(tagEntry('   ', 112, 'u')).toEqual([]);
  expect(tagEntry('Zxqv blorp.', 112, 'u')[0]).toMatchObject({ category: 'Uncategorised', group: 'other', felt: null });
  expect(() => tagEntry('Work. '.repeat(1000), 112, 'u')).not.toThrow();
});
```
- Screen: "Save entry" is disabled when the textarea is blank; after saving, "How the tool read it" lists the segments; pressing "Hard" on a segment sets `aria-pressed` and removes "Guessed. Tap to correct."; the week's family count in the view goes up by one after saving a family sentence on day 112.

- [ ] Steps 1–5. Commit: `feat: journal and keyword tagger`.

### Task 9: Patterns — On your mind and Against your usual

**Files:** Create `src/screens/patterns/Patterns.tsx` (tabs), `Mind.tsx`, `Ledger.tsx`. Test: `Mind.test.tsx`, `Ledger.test.tsx`.

**Spec:** DESIGN §7.3, §7.4. Canvas boards C and D.

**Tests must assert:** on day 112 the Mind screen has 8 rows, first labelled "Days 57 to 63", last "Days 106 to 112"; the Family detail reads "About 1 in 10 of your entries in the first of these eight weeks. About 1 in 3 now."; three quotes are shown, the newest from day 109; on day 10 it shows "The picture starts after your first two weeks."; with entries removed for a week the row reads "No entries this week". The ledger screen (tab label "Against your usual") on day 112 shows "5h 58m a night. Below your usual 7h 10m.", lists "Dinners with crew" under "AWAY FROM YOUR USUAL" and "Gym" under "AT OR NEAR YOUR USUAL", contains none of the words "refuel", "refill" or "drawing", and has no element whose text is a sum or total; on day 10 shows "Your usual appears after day 14."

- [ ] Steps 1–5. Commit: `feat: patterns screens`.

### Task 10: My plan — Early signs and Sharing; About

**Files:** Create `src/screens/plan/Plan.tsx` (tabs), `Signs.tsx`, `Sharing.tsx`, `src/screens/About.tsx`. Test: `Signs.test.tsx`, `Sharing.test.tsx`.

**Spec:** DESIGN §7.7, §7.9, §7.18, §9.3, §10.3.

**Tests must assert:** Signs on day 112 lists 6 quotes, the midnight sign is selected, shows "Showed up on days 109, 110 and 111." and "At 5 nights, your flight surgeon is told it happened, not what you wrote. At 3 now."; "Start step 1 tonight" adds a reminder event. Sharing shows three panels and the exact automatic message; saving a rule change adds a share-log line starting "Rule changed on day". About contains every bullet of DESIGN §10.3 and the sentence "Built with AI assistance (Claude)."; "Reset the demo" empties events.

- [ ] Steps 1–5. Commit: `feat: plan and about screens`.

### Task 11: Scheduled check

**Files:** Create `src/logic/pvt.ts`, `src/components/ui/Dial.tsx`, `src/screens/Check.tsx`. Test: `src/logic/pvt.test.ts`, `src/screens/Check.test.tsx`.

**Interfaces — Produces:**
```ts
export interface Trial { rtMs: number | null; falseStart: boolean; timedOut: boolean; }
export function scoreTrials(trials: Trial[], durationS: number, day: number, slot: 'am' | 'pm'): CheckSession;  // DESIGN §8.7; counts = durationS >= 180
export function nextWaitMs(rand: () => number): number;   // uniform 1000..4000
```
**Tests must assert:**
```ts
it('scores per PVT-B rules', () => {
  const t = [240, 260, 355, 500, 90].map(rt => ({ rtMs: rt, falseStart: rt < 100, timedOut: false }));
  const s = scoreTrials([...t, { rtMs: null, falseStart: false, timedOut: true }], 180, 112, 'pm');
  expect([s.trials, s.lapses, s.falseStarts, s.counts]).toEqual([4, 3, 1, true]);   // 355, 500 and the timeout are slow
  expect(Math.round(s.meanRtMs)).toBe(339);
  expect(scoreTrials(t, 30, 112, 'pm').counts).toBe(false);
});
```
- Screen (fake timers): "Next" is disabled until every dial has a value; a keydown with `repeat: true` is ignored; a tap before the counter shows "Too early"; firing `visibilitychange` to hidden during the test ends it with "Interrupted. Not recorded." and adds no event; a completed 30-second run shows "Demo length." and adds a check event with `counts: false`.

- [ ] Steps 1–5. Commit: `feat: scheduled check and attention test`.

### Task 12: Deploy and smoke-check

- [ ] **Step 1:** `npm run build`. Expected: no errors, `dist/` under 600 kB gzipped total.
- [ ] **Step 2:** Deploy `dist/` to Vercel as a static site (framework preset: Vite). Turn off deployment protection so the URL opens without login.
- [ ] **Step 3:** Open the public URL in a private window at 1366 × 768 and walk the five chapters. Expected at each: day 12 settling panel; day 42 one card, correctable; day 98 On your mind with a widening family band and a quiet Today; day 112 three cards; day 119 the banner (and none after choosing "If you acted").
- [ ] **Step 4:** Write `README.md`: what it is, the public URL, how to run, the NASA resources (DESIGN §9.3), and the AI-use statement. Commit: `chore: deploy and readme`.

**The app is submittable from here. Everything below improves it.**

---

## Milestone 4 — P1

Same five steps per task.

### Task 13: Patterns — Your days
**Files:** `src/logic/ring.ts`, `src/screens/patterns/Days.tsx`, tests. **Spec:** DESIGN §7.5, board M.
**Produces:** `arcPath(startMin: number, endMin: number, r: number, cx: number, cy: number): string` (midnight at top, clockwise; a sleep block with negative start is drawn from `1440 + startMin` to `endMin`), `dayPartSentence(grid): string`.
**Tests:** `dayPartSentence(params.dayPartFelt)` is "Evenings felt hard on 5 of the last 7 days. Mornings mostly did not."; day 112 lists blocks Sleep "00:42 to 06:40. From your wearable", Suit prep, Experiments, Gym, Call with Sam; pressing "Hard" on Gym adds a `block-felt` event.
Commit: `feat: day ring`.

### Task 14: Wrist and reminders
**Files:** `src/components/shell/WristDock.tsx`, `src/components/Wrist.tsx`, `src/screens/plan/Reminders.tsx`, tests. **Spec:** DESIGN §7.8, §7.14, board J.
**Tests:** a press adds a `mark` event with the current block label and shows "Marked. It will be waiting tonight."; a 600 ms hold lists three items from `profile.enjoys`; on day 100 the wind-down reminder is not listed and on day 112 it is.
Commit: `feat: wrist and reminders`.

### Task 15: Coping task sheet and What has helped
**Files:** `src/logic/coping.ts`, `src/components/cards/CopingSheet.tsx`, `src/screens/plan/Helped.tsx`, tests. **Spec:** DESIGN §7.10, §7.17, §8.3.
**Produces:** `pickCoping(fit: string, profile: Profile, minutesFree: number | null, log): CopingTask[]`.
**Tests:** `pickCoping('stress', …)[0].id` is `'green15'` and `'mind8'` is last; a start then done with before 6 and after 4 adds one use with change −2; rows under 10 uses show "Tentative".
Commit: `feat: coping tasks and record`.

### Task 16: removed
The Body screen was dropped from the design (DESIGN §7.12). Skip this number.

### Task 17: Voice
**Files:** `src/lib/speech.ts`, modify `Journal.tsx`, `MatchCard.tsx`. **Spec:** DESIGN §7.2 edge cases.
**Produces:** `canListen(): boolean`, `listen(onText, onEnd): () => void` (Web Speech API, `webkitSpeechRecognition` fallback), `speak(text): void` (`speechSynthesis`). A "Read to me" button on the card speaks the statement.
**Tests:** with no recognition API on `window`, the Speak button is not rendered; with a stub, the cloud-speech notice is shown while listening.
Commit: `feat: voice in and read-aloud`.

---

## Milestone 5 — P2 (only with time to spare)

### Task 18: moved
Replaying NASA test history is now part of Task 3 (the file `docs/reference/nasa/check_history.json` ships with the pack). Skip this number.

### Task 19: People (home half only) — DESIGN §7.6. Commit: `feat: people screen`.

### Task 20: Language-model tagger behind a switch
A Vercel function `api/tag.ts` that sends the entry and the 24 category definitions to a language model and returns segments in the `Segment` shape. Off by default; a switch on the About screen labelled "Use a cloud language model to tag new entries (prototype only; your text leaves this device)". Check the provider's current documentation for the SDK and model name; do not rely on memory. On any error, fall back to the keyword tagger. Commit: `feat: optional model tagger`.

---

## Final task: Review against the rules

- [ ] Walk DESIGN §3 rule by rule on the deployed site and tick each one.
- [ ] Keyboard only: reach and operate every control on Today, a sheet and the attention test.
- [ ] Check 1366 × 768, 1024 × 768 and 390 × 844.
- [ ] Confirm the footer, the data tags and the About screen's "does not claim" list are present.
- [ ] Record the 30-second video per DESIGN §11.

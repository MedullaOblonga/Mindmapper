# Psych Navigator: final product design

NASA Space Apps 2026 · Challenge: Create Health Monitoring Software for Astronauts on Space Missions
Design date: 15 Nov 2026 · Submission closes Sun 15 Nov, 11:59 p.m. local

"Psych Navigator" is the working name from the build spec. It lives in one constant (`APP_NAME`), so renaming is a one-line change.

This document is the design. `PLAN.md` is the order to build it in. `reference/` holds the look (`app.css`, `shell-today.html`) and the data (`scenario-params.json`, `topics.json`, and `nasa/check_history.json`, which is real NASA bed-rest test data).

**If two sources disagree, this is the order of authority:** `DESIGN.md` → `reference/app.css` and `reference/shell-today.html` → the design canvas boards → the older build spec doc.

---

## 1. What we are building

A web app that an astronaut on a long mission uses to check their own state and decide what to do about it, without needing a live call to Earth.

It works in four steps that repeat:

1. **Write.** The astronaut keeps a private diary, spoken or typed. A wrist button marks moments worth writing about later.
2. **Notice.** The tool compares this person with their own usual: what the diary is about, how those things felt to them, sleep, contact with people, and a short attention test NASA already uses.
3. **Ask.** At most three times a week it shows a card: "Does this match?" Every card ends in something the astronaut can do, or in "That's not right".
4. **Follow up.** It records what the astronaut chose and what happened next. If they say the tool is wrong, the tool visibly changes.

One sentence for the pitch: *a private self-check that notices slow change against your own usual, asks before it assumes, and never gives you a score.*

### What a judge must see in the first 60 seconds

1. The Today screen on mission day 112 with one clear card and three big actions.
2. A "Demo story" bar with five chapters that jump through the mission, including one where the tool is wrong and gets corrected.
3. No score, no red/amber/green, and a small tag on every number saying whether it is replayed NASA data, a NASA method, or simulated.

---

## 2. Decisions

### 2.1 Decided by Eric (do not change)

| Decision | Where it shows in the design |
|---|---|
| The diary is the main input. It is for the astronaut, not a letter to family. | Journal screen; "Tonight" panel on Today |
| "Positive/negative" means how the astronaut judged the event, not how cheerful the words are | The three felt marks (good, mixed, hard) that the astronaut taps |
| No dashboard, no overall score, no red/amber/green | Colour means topic or action only (§6.2) |
| Two displays to build: what the diary is about (concept C) and the ledger (concept D) | Patterns → On your mind; Patterns → Against your usual |
| The ledger is about holding your usual, not refuelling. (15 Nov) | §7.4 |
| A usual can change. The astronaut says "this is my new usual" from inside a card; there is no separate button for it. (15 Nov) | §7.15, §8.1 |
| The tool will sometimes be wrong, and that must not be frustrating | "That's not right" on every card, with a visible effect |
| Not a calendar tool. The schedule is read, never moved. | Actions create wrist reminders or drafts, never timeline edits |
| Not a "bot" that hands out decisions | The tool states what it noticed and offers; the astronaut chooses |
| Three levels of response: low → coping options only; medium → astronaut chooses whether to involve someone; serious → flight surgeon is told | §8 |
| Wrist button marks a moment to write about later | Wrist dock; "Tonight" panel |
| Use tests astronauts already take | Scheduled check modelled on NASA's Reaction Self-Test (§7.11) |
| "Manage early", never "prevent" or "detect depression" | Copy rules (§10) |
| The tool is anonymous and private, and the astronaut is told so | Top bar lock line; share log |
| NASA data informs design decisions; nothing is trained on it | About screen; data tags |
| No body screen. The brief offers a clickable body as an idea, not a requirement. (15 Nov) | Removed: §7.12 |
| No game element for now. (15 Nov) | Removed: §7.13 |

### 2.2 Calls made in this design (Eric: check these)

| Call | Reason |
|---|---|
| Home screen is "Does this match?" cards, not a navigator card | Later decisions moved from "tells you what to do next" to "reflect first, offer second" |
| From the "reserves" board (G) only the four group headings and the "what brought it back before" strip are kept. No tank levels. | A tank level is a hidden formula, which is a score by another name |
| The ledger screen is neutral about direction, but a ledger card is raised only for a move in the costly direction (less sleep, fewer dinners) | Keeps cards few. A move up can still be seen on the screen |
| Comparing with the last four weeks all the time was considered and dropped | A rolling usual slowly follows a decline, and a slow decline is the thing this tool exists to catch |
| A "Demo story" bar drives the whole app from a simulated 126-day mission | Judges will not explore. A guided story shows change over time without a line chart |
| New diary entries are tagged by a keyword tagger that runs in the browser | Keeps "stays on this device" true in the prototype, and cannot fail during judging. A language-model tagger is an optional extra (P2) |
| "Your usual" starts as mission days 15–56 and moves only when the astronaut says so | Simple, reproducible, and it cannot drift on its own. Labelled as a placeholder rule |
| People/orbits board (L) is built last (P2) | It depends on a proximity badge that does not exist |
| Hopelessness screening questions are described, not built | Too sensitive to ship untested in a public demo |

### 2.3 Approaches considered

1. **Guided story over a simulated mission (chosen).** One deterministic data set, a chapter bar, and every screen is a pure function of "which day is it". Strong for judges, easy to test, no backend.
2. **Free sandbox.** The judge starts on day 1 with empty data and has to generate history. Honest but shows nothing in 60 seconds.
3. **Clickable slideshow of static screens.** Fast to build, but it is a mock-up, and Space Apps scores a working tool higher on Validity.

---

## 3. Rules that must hold everywhere

Each rule is checkable. A build that breaks one is wrong even if it looks right.

1. **No overall score, index, percentage of "wellness", or ranking.** Nowhere.
2. **No red, amber or green, and no colour that changes with good/bad.** Colour marks a topic, or the gold action colour marks "you can do something here".
3. **Every comparison is with the person's own usual.** Never with other people or a norm. The words "normal range" are not used.
4. **Every card has "That's not right" and "Skip for now".** Skipping costs nothing and is never nagged.
5. **At most 3 cards a week, 1 visible at a time.** No cards during the first 14 days.
6. **A drop in how often a topic appears is never a signal on its own.** Silence in a diary means nothing.
7. **Average tone across topics is never computed or shown.** How things felt is only compared inside one topic.
8. **The tool never edits, moves or colours the mission schedule.**
9. **Nothing is sent anywhere without the astronaut seeing the exact words first,** except lines they set before launch, which are shown word for word in My plan → Sharing.
10. **Every number or sentence that comes from data carries a data tag** (§6.6). Every feature carries an evidence tag where it first appears.
11. **No rewards, streaks or game elements.** If one is ever added, it counts actions logged, never diary content or how anything felt.
12. **Plain words.** No "wellness", "mental health score", "burnout risk", "detected". See §10.

---

## 4. Scope

| Tier | What | Ships when |
|---|---|---|
| **P0 – must ship** | Shell, story bar, Today with cards, "That's not right", Talk-to-someone sheet, Journal with tagging and felt marks, Patterns → On your mind, Patterns → Against your usual (with replayed NASA test history behind the check), My plan → Early signs and Sharing (with share log), Scheduled check with the 3-minute test, About screen, data tags | PLAN milestones 0–3 (Tasks 1–12) |
| **P1 – should ship** | Patterns → Your days (24-hour ring), My plan → Wrist reminders and What has helped, coping task sheet with before/after dial, wrist dock with mark and "something to do", voice in and read-aloud | PLAN milestone 4 (Tasks 13–15 and 17) |
| **P2 – only if time** | Patterns → People (orbits), language-model tagger behind a switch, noise feed from the NASA chamber data | PLAN milestone 5 (Tasks 19–20) |
| **Not built** | Intake interview flow, hopelessness screening, crew pulse, crewmate nudge, character/voice persona, camera or speech-pattern features, time-capsule clips | Described on the About screen as "designed, not built" |

Every milestone ends with a deployable app. Stop at any milestone boundary and the submission still works.

---

## 5. Structure

### 5.1 Routes (hash routing)

| Route | Screen |
|---|---|
| `#/today` | Today (default) |
| `#/journal` | Journal |
| `#/patterns/mind` · `/ledger` · `/days` · `/people` | Patterns, four tabs |
| `#/plan/signs` · `/reminders` · `/sharing` · `/helped` | My plan, four tabs |
| `#/about` | About this prototype |
| `#/check` | Scheduled check (full-screen flow, no rail) |

### 5.2 Shell

Always present: top bar, story bar, left rail. See `reference/shell-today.html` for exact markup.

**Top bar** (`.topbar`, 56 px)
- Left: `MISSION DAY {day} OF 520` (`.t-label`) and a 160 px meter filled to `day/520`.
- Right: lock icon + "Stays on this device. Only you can see it." Then a link "Share log: nothing shared" or "Share log: {n} shared". The link opens the share log drawer.

**Story bar** (`.storybar`, sunk background)
- Label "DEMO STORY · SIMULATED".
- Five chapter chips from `scenario-params.json → chapters`. The chip whose day equals the current day has `aria-current="true"`.
- Day stepper: ‹ Day N ›. Range 1 to 126. Holding a stepper button repeats every 120 ms.
- Under the chips, one line of caption (`.story-caption`) for the current chapter. If the current day is not a chapter day, the caption is "Simulated mission. Use the chapters, or step a day at a time."
- On the "What followed" chapter, two extra chips appear: "If you acted" / "If you didn't". They set the branch.
- Clicking a chapter sets the day and navigates to the chapter's route.
- A small "Hide" button collapses the bar to a 24 px strip that says "Demo story" and expands on click.

**Left rail** (`.rail`, 88 px): Today, Journal, Patterns, My plan; About pinned at the bottom. A 8 px gold dot on Today when a card is open and the user is on another screen.

**Wrist dock.** A floating round button, bottom right, 56 px, gold watch icon, label "Wrist". It opens a 220 px panel holding the wrist device (§7.14). On Today the wrist is also drawn inline (see the mock), so the dock button is hidden there.

**Share log drawer.** Right-side drawer, 420 px. Title "Share log". One line of explanation: "Everything that has left this device, in full. If it is not here, it was not sent." Then entries, newest first: day, who it went to, the exact text. Empty state: "Nothing has been shared."

**Why drawer.** Right-side drawer opened by any "Why this?" link. Contents come from `src/data/evidence.ts` (§9.4): what the tool compared, the rule in plain words with its numbers, the data tags, the evidence tag, and the source with page number.

### 5.3 Breakpoints

| Width | Layout |
|---|---|
| ≥ 1024 px | Rail on the left, two columns. Design target is 1366 × 768: the Today card and its actions must be fully visible without scrolling |
| 700–1023 px | Rail stays, columns stack, page head stacks |
| < 700 px | Rail becomes a bottom tab bar, top bar drops the meter and lock text, story bar shows chips only (scrolls sideways) |

---

## 6. Visual system

All values are in `reference/app.css`. Copy that file to `src/styles/app.css` and use its classes. Do not write new colours, radii or font sizes in components.

### 6.1 Character

A quiet instrument for one person at the end of a long day. Deep navy, warm paper-coloured text, a serif voice for anything the tool "says" and for the astronaut's own words, and a plain sans for controls. It should feel closer to a ship's log than to a fitness app.

### 6.2 Colour roles

| Role | Token | Use |
|---|---|---|
| Page | `--bg` | Background |
| Panel | `--panel` | Every panel and card |
| Raised | `--raised` | Selected chip, pressed button, bar track |
| Sunk | `--sunk` | Story bar, wrist face, test screen |
| Hairline / border | `--line` / `--border` | Dividers / outlined controls |
| Text | `--ink`, `--ink-muted`, `--ink-faint` | Main, secondary, footnotes |
| **Action** | `--act` | The one primary button in a panel, links, the astronaut's own quoted words, "you chose" lines. Means "yours to act on". Never means warning |
| Mission meter | `--progress` | Only the top-bar meter |
| Topics | `--t-work`, `--t-home`, `--t-crew`, `--t-body`, `--t-timeoff`, `--t-self`, `--t-space`, `--t-other` | Diary topic groups. Sleep blocks on the day ring use `--c-sleep` |

Text on a topic colour is `--bg`, except on `--t-space` and `--t-other`, where it is `--ink`.

### 6.3 Type roles

| Class | Use |
|---|---|
| `.t-title` | One per screen. Serif 34 |
| `.t-lede` | One sentence under the title. Serif 17, muted |
| `.t-stmt` | What the tool noticed, on a card. Serif 30 |
| `.t-stmt-sm` | Smaller statements and summary lines. Serif 19 |
| `.t-quote` | The astronaut's own sentences. Serif italic 17, gold, in curly quotes |
| `.t-label` | Small caps labels |
| `.t-head` | Panel headings. Sans 14 semibold |
| `.t-body`, `.t-small`, `.t-foot` | Body 15, secondary 13, footnote 12 |

Numbers that change use `.num` (tabular figures).

### 6.4 The felt marks

How something felt is always shown with shape, never colour:

| Mark | Class | Meaning |
|---|---|---|
| ● solid | `.mark.mark--good` | Felt good |
| ◐ half | `.mark.mark--mixed` | Mixed |
| ○ ring | `.mark.mark--hard` | Felt hard |
| ◌ dashed | `.mark.mark--none` | Not marked yet |

Set `--c` on the mark to a topic colour when it sits inside a topic. A legend with the three marks appears on every screen that uses them.

### 6.5 "Against your usual" bar

`.usual` is a 10 px track, a fill for this week's value, and a white 2 px tick at the person's usual. The sentence beside it does the judging in words: "5h 58m a night. Below your usual 7h 10m." The bar never changes colour. After the astronaut has moved a usual (§8.1), the white tick is the new usual and a shorter, fainter tick (`<s>` inside `.usual`) marks the early-mission usual, so the old reference is never lost.

### 6.6 Tags

`.tag` is a small outlined chip. Two families:

| Data tag | Text shown |
|---|---|
| `nasa-replay` | Replayed NASA data |
| `nasa-method` | NASA method |
| `sim` | Simulated |
| `ai-sample` | AI-written sample |
| `user` | Your entry |

| Evidence tag | Text shown |
|---|---|
| `nasa-use` | Used by NASA crews |
| `earth` | Tested on Earth |
| `analog` | Tested in analog missions |
| `exp` | Experimental |
| `placeholder` | Placeholder threshold |

Rule of thumb: one data tag per panel is enough when everything in the panel has the same origin.

### 6.7 Motion

| Element | Trigger | Motion | Duration |
|---|---|---|---|
| Card | Next card appears | Fade in, rise 8 px (`.card-enter`) | 240 ms |
| Card | Resolved | Fade out, slide left 24 px, then the next enters | 200 ms |
| Drawer / sheet | Open | Slide in from the right / up from the bottom, backdrop fades to 50% black | 240 ms |
| Buttons, chips | Hover, press | Border and background ease | 160 ms |
| Stacked bars (On your mind) | Day changes | Segment widths ease | 240 ms |

All motion is removed under `prefers-reduced-motion`.

### 6.8 Accessibility

- Every control is a real `<button>` or `<a>`, at least 44 × 44 px.
- Visible focus ring (already in `app.css`). Tab order follows reading order; drawers and sheets trap focus and close on Escape.
- Marks, bars and the day ring have text equivalents (`aria-label` with the same sentence a sighted user reads).
- The story bar is a `<nav aria-label="Demo story">`; the rail is `<nav aria-label="Main">` with `aria-current="page"`.
- When a new card appears, its statement is announced through an `aria-live="polite"` region.
- Contrast: body text on panels is at least 7:1; muted text at least 4.5:1.

---

## 7. Screens

For each screen: purpose, layout, content, states, behaviour. Canvas boards named below are in the artifact "Astronaut well-being readout: interface concepts" (https://claude.ai/artifact/BgiwtjZfpRHbiGTVYKmDpr). A builder that can read artifacts will find each board's markup at `project/<Name>.dc.html`; otherwise follow the text here.

Every screen ends with a `.t-foot` line: "Sample data for illustration. Names are placeholders."

### 7.1 Today — `#/today`

**Purpose.** The one place the tool speaks. Quiet on most days.

**Layout.** Exactly as `reference/shell-today.html`. Wide column: card stack, then "What the tool did with your answers". Narrow column: Tonight, Scheduled check (only on check days), the wrist device.

**States of the wide column**

| State | When | Title / lede | Body |
|---|---|---|---|
| Settling | day ≤ 14 | "Still learning your usual" / "For the first 14 days the tool only watches. It will not suggest anything until day 15." | A panel with a 14-step row of dots, filled up to the current day, and the line "Day {d} of 14." |
| Quiet | no open card | "On your usual pattern" / "Nothing this week looks different from your own usual. The tool stays quiet until something does." | No card. The "what the tool did" panel moves up. |
| Cleared | cards were raised this week and none is open | "Nothing left to look at this week" / "You have answered or skipped everything the tool noticed. It will look again at the end of the week." | No card. If any were skipped: "You skipped {n} cards this week. Nothing changes, and only you can see that count." |
| Cards | 1–3 open cards | "Does this match?" / "{Three things} the tool noticed this week. Each one ends in something you can do, or in telling the tool it is wrong." (One thing / Two things / Three things) | Card stack |
| Line crossed | a pre-agreed sharing line fired in the last 7 days | Banner above the stack, `.panel.panel--act`: label "AGREED BEFORE LAUNCH", statement "On day {d} a line you set before launch was crossed. Your flight surgeon was told this, and only this:", then the exact message as `.t-quote`, then buttons "Open share log" and "Change this rule". | Stack continues below |

**The card** (`.stack > .card`). `data-left` on `.stack` is the number of open cards, which draws the cards behind.

1. Top row: "{i} of {n} this week" and pips.
2. Evidence block, depends on card kind (§8.2).
3. Statement, `.t-stmt`.
4. Link row: "See the {n} entries" (topic cards only; opens Journal filtered to those segments), "Why this?" (opens the Why drawer), and the data tag.
5. `.t-small`: "Do something with it, or tell the tool it is wrong."
6. Up to three `.btn--lg` actions. The first is `.btn--primary`.
7. Bottom row: "That's not right" (`.btn--wrong`) on the left, "Skip for now" (`.btn--quiet`) on the right.

**Card behaviour**

| Action | Result |
|---|---|
| Any action button | Runs the action (§8.3). Card status → `acted`. A line is added to "What the tool did with your answers". Next card enters. |
| That's not right | Opens the Not-right sheet (§7.15). On confirm: status → `not-right`, effect applied, line added, next card enters. |
| Skip for now | Status → `skipped`. No line is added. Next card enters. The same pattern cannot produce a card for 7 days. |
| Keyboard | ← → do nothing (no swiping between cards). Tab reaches every control in visual order. |

**"What the tool did with your answers"** shows the last three resolved cards: what was noticed (`.t-head`), "Day {d}. You said: …" or "You chose: …" in gold, and the effect in serif. Under the list when anything was skipped this week: "You skipped {n} cards this week. Nothing changes, and only you can see that count."
Empty state: "Nothing yet. When you answer a card, what the tool changed shows up here."

**Tonight panel** (`.panel--act`)

| State | Content |
|---|---|
| Marked moments exist today and no entry yet | Statement "{Two moments} you marked today are waiting." Rows: time, "during {block label}", "Marked on your wrist". Buttons "Speak or write" (primary → `#/journal` with the composer focused and the moments as chips), "Not tonight" (dismisses the panel for the day). |
| No marked moments, no entry yet | Statement "Anything from today worth keeping?" Same buttons. |
| Entry written today | Statement "Written. {n} things, tagged." Link "Open today's entry". No primary button. |
| Day ≤ 14 | Same as above; the diary works from day 1. |

Foot line, always: "Your diary is for you. Nobody else reads it, and it is not graded."

**Scheduled check panel.** Only when `day % 4 === 0`. Text: "Every fourth day. Two dials and a 3-minute attention test, about 4 minutes." Button "Start this morning's check" / "Start this evening's check" by slot. If the slot's session already exists: "This {morning}'s check is recorded." with no button. On day 112 the morning session exists in the scenario and the evening one is open for the judge.


### 7.2 Journal — `#/journal`

**Purpose.** Write or speak a private entry. See how the tool read it. Correct it with one tap.

**Layout.** Two columns. Wide: composer, then today's tagged entry. Narrow: earlier entries.

**Composer** (`.panel`)
- Label "DAY {d} · PRIVATE DIARY".
- If there are marked moments for the day, a row of chips: "10:47 · Suit prep". Tapping a chip inserts "At 10:47, during Suit prep: " at the cursor.
- A textarea styled as paper-on-navy: transparent background, serif 19/1.5, minimum 6 lines, placeholder "What happened, and how did it sit with you?"
- Button row: microphone "Speak" (P1; toggles to "Stop"), "Save entry" (primary, disabled when empty), `.t-small` on the right: "Nothing leaves this device."
- Under the buttons, `.t-foot`: "The tool reads what each part is about and guesses how it felt. You can correct both."

**After saving: the tagged entry** (`.panel`)
- Heading "How the tool read it".
- One row per segment: the text in serif 17; under it a topic chip (`.chip`, topic colour; tapping opens a menu of the 8 groups) and three felt buttons (Good, Mixed, Hard as `.btn--sm`, each with its mark; the current one has `aria-pressed="true"`). When the felt value is a guess, a `.t-small` note "Guessed. Tap to correct." sits beside the buttons and disappears after the first tap.
- If the tagger found no felt words, no button is pressed and the note reads "How did this one feel?"
- Footer: "Counts toward this week's picture. The words themselves stay in your diary."

**Earlier entries** (narrow column)
- Filter chips: All, then the 7 groups.
- A list grouped by day, newest first: "Day 111", then each segment as a short line with its topic swatch and felt mark. Scenario entries carry the tag "AI-written sample" once at the top of the list, not on every row.
- When opened from a card's "See the {n} entries" link, the list is pre-filtered and a line at the top says "Showing {n} entries about {topic}, days {a} to {b}." with a "Clear" link.

**Edge cases**
- Entry longer than 2,000 characters: accepted; segments beyond 12 are grouped under "and {n} more".
- Speech not supported by the browser: the Speak button is hidden.
- Speech in use: a `.t-foot` line "This prototype uses your browser's speech service, which may send audio to its maker. The flight design transcribes on board."

### 7.3 Patterns → On your mind — `#/patterns/mind`

Reference board: **C · What's on your mind** (`Attention.dc.html`).

**Purpose.** Show where attention has gone, week by week, as shares of the diary. A map, not a grade.

**Title / lede.** "What has been on your mind" / "The share of each week's diary about each topic. A map of where your attention has gone, not a grade."

**Wide column: the weeks panel**
- Eight rows, the eight most recent complete or current weeks up to the current day, oldest at the top. Row label "Days 57 to 63".
- Each row is a 100-column CSS grid, 40 px tall; each topic is a segment spanning its rounded percentage, in `groupsOrder`, with a 2 px panel-coloured right border. The percentage is printed inside when it is 9 or more. Rounding must sum to 100 (largest-remainder method).
- The selected topic's segments get `box-shadow: inset 0 0 0 2px var(--ink)`.
- Legend of the 7 groups. Note under it: "Each row adds up to 100%. The outlined blocks are the topic you are looking at."
- Fewer than 8 weeks of data: show the weeks that exist. Before day 15: "The picture starts after your first two weeks."

**Narrow column**
- Topic chips (pill buttons) for all 7 groups; default selection is the topic with the largest rise against usual, or Work if none rose.
- Detail panel for the selected topic:
  - Label in the topic colour.
  - Statement: "About 1 in 10 of your entries in the first of these eight weeks. About 1 in 3 now." (Use "About 1 in N" where N = round(100 / percent), and "Hardly any" under 4%.)
  - Two `.usual`-style rows (no tick): first week and latest week, with percentages.
  - "HOW IT FELT TO YOU": two rows of marks, first two weeks against last two weeks, in the topic colour (same component as the card evidence).
  - "YOUR SENTENCES": up to three most recent segments of that topic as `.t-quote` with "Day N".
- Closing panel: "More or less of a topic is not better or worse. If you want to talk this through, you choose who." Buttons "Message a crewmate" and "Draft a message to the flight surgeon" (both open the Talk sheet, §7.16).
- A text link "Why is there no mood score?" opens the Why drawer with the explainer in §9.4 (`why.no-mood-score`).

### 7.4 Patterns → Against your usual — `#/patterns/ledger`

Reference boards: **D · Load and refuel ledger** (`Ledger.dc.html`) for layout only, plus the bottom strip of **G** (`Reserves.dc.html`). The words on board D are replaced by the words below. The tab is labelled "Against your usual".

**Title / lede.** "This week, against your usual" / "Each item sits next to your own usual, marked with a tick. Nothing is added up into one number, and away from your usual is not a verdict."

**Two panels side by side**

Left, label "AWAY FROM YOUR USUAL"; right, label "AT OR NEAR YOUR USUAL". Both labels use `--ink-muted`. An item sits on the left when it is *away* (defined in §8.2), in either direction. Inside each panel, items are grouped under four small headings in this order: Rest, Connection, Movement, Calm. A heading with no items is not shown. Empty left panel: "Everything is at or near your usual this week."

The "Side" column below is internal. It records which direction is costly and is used only to decide cards (§8.2). It is never shown.

| Item | Side | Group | Sentence pattern | Bar scale max |
|---|---|---|---|---|
| Sleep | Draw | Rest | "{5h 58m} a night. {Below} your usual {7h 10m}." | 10 h |
| Long suit-prep days | Draw | Rest | "{3} this week. {Above} your usual {1}." | 7 |
| Days since a full rest day | Draw | Rest | "{11}. {Above} your usual {6}." | 14 |
| Call windows missed | Draw | Connection | "{2} this week. Your usual is {0}." | 4 |
| Noisy nights | Draw | Calm | "{2} this week. Your usual is {0}." | 7 |
| Dinners with crew | Refill | Connection | "{1} this week. {Below} your usual {5}." | 7 |
| Calls with Sam | Refill | Connection | "{1} call. {Below} your usual {3}." | 5 |
| Calls with Mom | Refill | Connection | "{1} call. {Below} your usual {2}." | 5 |
| Gym | Refill | Movement | "{5} sessions. {Above} your usual {4}." | 7 |
| Greenhouse time | Refill | Calm | "{3} sessions. {Above} your usual {2}." | 7 |
| Coping tasks done | Refill | Calm | "{n} this week." (no usual, no tick) | 7 |

Each item is: name (`.t-head`, 16 px) and sentence (`.t-small`) on one line, then a `.usual` bar filled with `--t-work`. When value equals usual the sentence is "{value}. Your usual."

**Under the panels**

Label "THREE WAYS TO ACT ON THIS. YOU CHOOSE." Then three panels:

1. **Try** (`.panel--act`): one sentence built from the top away item's best match in "what brought it back before", for example "The last 3 times Connection came back to your usual, a crew dinner and a call with Sam fell in the same week." Button "Add a wrist reminder" (creates or enables the matching reminder; never edits the schedule). If there is no history: one item from the coping menu that fits, with "Start".
2. **Talk**: "Send this page to someone. You edit it first and see it before it goes." Buttons "Crewmate", "Flight surgeon" → Talk sheet with a draft built from the items that are far from usual.
3. **Agreed before launch**: "You and your flight surgeon set what is shared automatically. Nothing this week has crossed it." (or "One line was crossed on day {d}.") Link "See the rules" → `#/plan/sharing`.

**States.** Before day 15: both panels show this week's values with no ticks and the note "Your usual appears after day 14." Week with everything at usual: the Try panel says "Nothing here is far from your usual this week."

### 7.5 Patterns → Your days — `#/patterns/days` (P1)

Reference board: **M · Rebuild your day, and how it felt** (`Rhythm.dc.html`).

**Title / lede.** "Rebuild your day, and how it felt" / "The tool draws your day from your wearable and the mission timeline. You fix it and tap how each stretch felt."

**Left panel: the ring.** A 460 px SVG. A 24-hour ring (radius 150, stroke 44, track `--raised`) with midnight at the top, time running clockwise, hour labels 00:00, 06:00, 12:00, 18:00 outside. Each block of the day is an arc in its colour: sleep `--c-sleep`, work `--t-work`, gym `--t-body`, call `--t-home`, dinner `--t-crew`, greenhouse `--t-timeoff`. A felt mark sits just outside the middle of each arc (dashed if unmarked). Centre text: "Today" (or "Day N") and "Day 112". Legends for block colours and for the three marks.

**Right top panel: the blocks.** Heading "Rebuild day {d}". When the cue fired: `.t-small` "Asked because your sleep started {1 h 32 min} later than your usual. You can turn this cue off." One row per block: colour bar, name, "00:42 to 06:40. From your wearable" (or "From the mission timeline", "From your messages", "Added by you"), and three felt buttons. Buttons: "Add what is missing" (adds a block: name, start, end), "Write about one" (primary; goes to the Journal composer with "About {block}, {start} to {end}: " inserted).

**Right bottom panel: saved days.** A 7-day grid, rows Morning / Afternoon / Evening, a felt mark per cell. Then one statement built from the grid, for example "Evenings felt hard on 5 of the last 7 days. Mornings mostly did not." Rule for the sentence: name the day part with the most "hard" marks if it has 4 or more; add "{Other part}s mostly did not" for the part with the fewest if it has 1 or fewer. Otherwise: "No part of the day stands out this week."

**The cue.** The Today screen shows a `rhythm` card (§8.2) only when no early-sign card about sleep is open. The screen itself is always reachable from Patterns.

Foot: "A rebuilt day is from memory and can be off, so every block is editable. Nothing here is sent anywhere."

### 7.6 Patterns → People — `#/patterns/people` (P2)

Reference board: **L · Who you have been in touch with** (`Orbits.dc.html`). Build only the home half unless there is spare time: calls and messages with Sam and Mom against the usual for each, as two `.usual` rows and the sentence "Everyone at home is farther than usual this week." Mark the crew half "Designed, not built: it needs a proximity badge that all crew agree to before launch."

### 7.7 My plan → Early signs — `#/plan/signs`

Reference board: **K · Your own early signs** (`Signs.dc.html`).

**Title / lede.** "Your own early signs, checked against your week" / "Your own list, written before launch. This page only checks it." Note pill: "Written by you on day −41".

**Left panel.** One row per sign from `profile.signs`: a status glyph, the quote in serif 20, the source in `.t-small`, and the status text.

| Status | Glyph | Text |
|---|---|---|
| Showed up | 18 px solid `--act` circle | "Showed up on {n} nights" / "Showed up: {n} nights in a row" |
| Did not show up | 18 px ring, `--ink-muted` | "Did not show up" |
| Cannot tell | 18 × 4 px dash, `--border` | "Not enough data yet" |

Tapping a row selects it (raised background and an inset 2 px `--ink` outline). Default selection: the first sign that showed up. Under the list: the three-glyph legend and "The tool adds no signs of its own."

**Right top panel (selected sign).** The quote in gold; "Showed up on days 109, 110 and 111."; heading "Your own steps, written before launch"; the numbered steps in serif 19; buttons: "Start step 1 tonight" (primary; creates a one-off wrist reminder with the step's text), one button per further step that can be an action ("Message Sam" → Talk sheet with the step's quoted words), and "That's not right".
If the sign has no steps: "You did not write steps for this one." and a button "Add a step".

**Right bottom panel.** Only when the sign has a sharing line. Lock icon, heading "Agreed before launch", text "At 5 nights, your flight surgeon is told it happened, not what you wrote. At 3 now." Button "Change this rule" → `#/plan/sharing`.

Foot: "A sign showing up is not an alarm."

### 7.8 My plan → Wrist reminders — `#/plan/reminders` (P1)

Reference board: **J · Reminders on your wrist** (`Tomorrow.dc.html`).

Left panel: the wrist device showing the next reminder, a list "What each buzz means" (pattern dots + meaning), and a button "Feel each buzz" (plays the patterns as dot animations, and calls `navigator.vibrate` where it exists). Right top: "Rules you set", one row per reminder with a `.toggle`, and "Add a rule" (free text + a buzz pattern picker). Right bottom: "Limits you set", the four lines from `profile.reminderLimits`.

A reminder with `fromDay` greater than the current day is not listed.

### 7.9 My plan → Sharing — `#/plan/sharing`

**Purpose.** Make the three levels of response visible and the automatic one fully transparent.

**Title / lede.** "What leaves this device, and when" / "Three levels. You set all of them before launch, and you can read every word that has ever been sent."

**Three panels in a row**

| Panel | Heading | Body |
|---|---|---|
| 1 | "Most weeks: nothing" | "The tool offers things you can do yourself. Nothing is sent to anyone." Evidence tag: none. |
| 2 | "When you choose: a message you approve" | "From any card you can draft a note to a crewmate, the crew medical officer or the ground. You see and edit the exact words. Messages to Earth take about {18} minutes each way." |
| 3 (`.panel--act`) | "Lines you set before launch" | Each share rule as a row: the rule text in serif 19; a status line ("At 3 of 5 now." / "Not crossed."); for automatic rules the exact message that would be sent, as `.t-quote`; a "Change this rule" button. |

**Change this rule.** Opens a sheet with the rule text editable, the threshold as a stepper, and this note: "A change is itself written to the share log, so a line cannot be removed silently." Saving adds a share-log entry "Rule changed on day {d}: {old} → {new}", addressed to "Flight surgeon". (This is a design call; see §12.)

**Share log** (full list, same content as the drawer).

Foot: "Prototype: nothing actually leaves this browser. 'Sent' means written to the share log."

### 7.10 My plan → What has helped — `#/plan/helped` (P1)

**Title / lede.** "What you tried, and what followed" / "Each row is your own record. A few tries cannot prove that something works, so early rows are marked tentative."

A table-like list, one row per coping task that has been used: name and length; "Tried {n} times"; "Stress after, against before: {−2} on your 1–10 dial (middle value)"; a `.tag` "Tentative · {n} of 10" until 10 uses; the evidence tag and one-line evidence from the coping menu. Under it, the rest of the menu as "Not tried yet", preferences first. A final row: "Dips where you did nothing: {n}. Stress came back to your usual in about {m} days." (Fixed demo values: 3 and 2, tagged Simulated.)

### 7.11 Scheduled check — `#/check`

Full-screen, no rail, `--sunk` background, a "Leave" link top right.

**Step 1 · Two dials** (three in the morning or evening)

| Dial | Scale | Labels |
|---|---|---|
| Stress | 1–10 | The astronaut's own anchors at 1, 5 and 10 from `profile.stressAnchors` |
| Sleepiness | 1–9, Karolinska Sleepiness Scale | 1 Extremely alert · 3 Alert · 5 Neither alert nor sleepy · 7 Sleepy, but no effort to keep awake · 9 Very sleepy, great effort to keep awake |
| Morning only: "How did you sleep?" | 1–10 | 1 Badly · 10 Very well |
| Evening only: "How heavy was today's work?" | 1–10 | 1 Light · 10 Very heavy |

A dial is a row of numbered round buttons (44 px), the chosen one filled `--ink` with `--bg` text, and the label for the chosen value in serif 21 under the row. "Next" is enabled when every dial has a value.

**Step 2 · Attention test**

- Intro: "A 3-minute attention test, modelled on the one ISS crews take. A counter will appear in the box at random moments. Tap the box or press Space as fast as you can each time." A switch: "Demo length (30 seconds)", on by default when the story bar is visible. Tag: "Modelled on PVT-B. Not NASA's software."
- Test screen: a centred box 320 × 160, 2 px `--border`, on `--sunk`. Nothing else on screen except a thin progress line at the top.
- Each trial: wait a random 1–4 s (uniform), then show a running millisecond counter in the box (sans 56, tabular). On response, freeze the counter for 1 s, then clear. The 1 s display counts as part of the next wait.
- A response with no counter showing, or under 100 ms: show "Too early" in the box for 1 s; count a false start.
- No response for 30 s: count a lapse and start the next trial.
- Ends after 180 s (30 s in demo length). Use `performance.now()`; listen for `pointerdown` on the box and `keydown` Space.

**Step 3 · Recorded**

- Title "Recorded."
- One sentence: "In line with your usual." or "More slow responses than your usual. It has been added to this week's things to look at."
- A disclosure "Show my numbers" (closed by default): responses, average response time in ms, slow responses (355 ms or more), early taps, and the usual range for each. Tag for the usual range: "Simulated" or "Replayed NASA data".
- Demo-length sessions add the line "Demo length. A 30-second run is too short to judge; the flight version is 3 minutes." and never create a card.
- Button "Done" → Today.

Why no score screen: feedback on a poor result made people feel and report worse in a sleep-feedback trial (Gavriloff 2018). Their own numbers are still theirs to open.

### 7.12 Body screen — removed

Removed on 15 Nov. The brief suggests a clickable body as one idea; it is not required, and this tool does not include one. Do not build it.

### 7.13 Greenhouse tray — removed

Removed on 15 Nov. No game element for now. Do not build it.

### 7.14 Wrist device (P1; mark button is P0 as a plain button in the Tonight panel)

Markup in the mock (`.wrist`). The face shows, in priority order: a due reminder ("21:00 / Wind down / ●● / Tap to start. Hold to skip."), a confirmation, or the idle text.

| Gesture | Result |
|---|---|
| Press the side button (or the face when idle) | Marks the moment: stores the day, the clock time (the scenario clock is 19:42 on the current day plus real seconds since load), and the timeline block in progress. Face shows "Marked. It will be waiting tonight." for 4 s. |
| Hold 600 ms | "Something to do": face lists up to three items from `profile.enjoys` that fit the minutes until the next block (use the coping menu's minutes; default 15). Tapping one logs it as done when the user confirms "Done". A hold is never read as loneliness or low mood. |
| Tap a due reminder | Marks it started. |
| Hold a due reminder | Marks it skipped. Counted only for the astronaut. |

P0 fallback: a button "Mark this moment" in the Tonight panel does the same as a press.

### 7.15 Not-right sheet

A bottom sheet, 520 px wide, centred.

- Title: "What is off?"
- The card's statement repeated in `.t-stmt-sm`.
- Three radio rows:
  1. "The data is wrong, or something is missing" → reveals a list "What should count?" with options specific to the card kind (§8.4).
  2. "It is accurate, and this is my new usual" → note: "From now on the tool compares this with your last four weeks instead. The early-mission mark stays on the bar. Lines you set before launch do not move." (On an `own-sign` card this row reads "It is accurate, but it is not a concern right now" with the note "The tool will not raise this again for 4 weeks.")
  3. "Something else" → a one-line text field, optional.
- Buttons: "Tell the tool" (primary), "Cancel".
- On confirm, a toast for 4 s with the effect sentence, the same sentence that is added to "What the tool did with your answers".

### 7.16 Talk sheet

A bottom sheet, 640 px wide.

- Title: "Who do you want to talk to?"
- Recipient chips: the crewmate from the support map for this kind of stressor first (work → Ana; home → Sam appears as "Message home"), then "Crew medical officer (Mei)", "Flight surgeon (Earth)", "Ground psychologist (Earth)". One is preselected by the routing rule in §8.3.
- A draft in an editable textarea. The draft is built from the card's evidence only, never from diary text. Example for the family card: "Over the last two weeks, family has taken up about a third of my diary, up from about a tenth, and more of it has felt hard. I have missed two call windows this week. I would like to talk it through."
- A checkbox, off by default: "Attach the {n} diary entries". When on, the entries are listed so the user sees exactly what is added.
- For Earth recipients: "Reaches Earth in about 18 minutes. A reply takes at least as long again."
- Buttons: "Send" (primary), "Save as draft", "Cancel".
- Send writes a share-log entry and closes. Toast: "Sent. It is in your share log."

### 7.17 Coping task sheet (P1)

- Title: the task and its length, "Greenhouse time · 15 minutes".
- "WHY NOW": one line from the card.
- "WHY THIS ONE": "From your own list." or the evidence line, with its evidence tag.
- "BEFORE": the stress dial, prefilled from today's latest dial if one exists ("From this morning's check: 6"), otherwise asked now.
- Buttons: "Start" (primary), "Something else" (shows the next two fitting tasks), "Not now".
- After Start, Today shows a small panel "Greenhouse time, started 19:44" with "Done". Done asks one optional dial, "And now?", with "Skip". The before, the after and the next morning's dial are logged to What has helped.

### 7.18 About — `#/about`

Sections, each a panel:

1. **What this is.** Two sentences and the three rules (no score, your own usual, you choose).
2. **What is real here.** A table: each feature, its data tag, its evidence tag.
3. **NASA resources used.** The list in §9.3, with links.
4. **What this does not claim.** The list in §10.3.
5. **Designed, not built.** The "Not built" row of §4.
6. **AI use.** "Built with AI assistance (Claude). Journal entries in the demo are AI-written samples. The idea, scope and design decisions are the team's." No NASA logos or insignia anywhere in the app.
7. **Reset.** Button "Reset the demo" clears saved state.

---

## 8. Logic

Plain rules first, exact numbers second. Every threshold here is a **placeholder**: NASA lists validated thresholds as an open gap (BH-102). Thresholds live in one file, `src/logic/thresholds.ts`, each with a comment naming this section.

### 8.1 Your usual, and what happens when it changes

- Week `w` covers days `7w−6` to `7w`. The weekly review happens on the last day of each week.
- **Your usual starts as the early-mission usual:** the median of a number over weeks 3 to 8 (days 15–56). For weeks 6, 7 and 8 themselves, it is the median of weeks 3 to `w−1`. Before week 6 there is no usual. Pre-flight values are not used as the reference, because flight itself shifts things: NASA's sleep evidence report notes ISS crews sleep less in flight than before it.
- Nightly sleep start: the median over days 15–56.
- **The tool never moves a usual on its own.** A usual that followed the last few weeks would slowly follow a decline too, and the decline would stop being visible.
- **The astronaut can move it.** Every card asks, in effect, "new usual, or drift?" without adding a button:
  - Choosing any action on the card treats the change as a drift to bring back.
  - Choosing "That's not right" → "It is accurate, and this is my new usual" moves the usual for the things named on that card to the median of the four weeks ending at that review (`w−3 … w`), rounded to a whole number for counts. It applies from the next review on.
  - The early-mission usual is kept, shown as a faint mark, and never deleted. The move is logged in "What the tool did with your answers" with its day.
  - Lines set before launch are fixed numbers (for example 5 nights). Moving a usual does not move them.
  - This applies to `topic-shift`, `ledger`, `rhythm` and `check` cards. An `own-sign` card has no usual to move.
- The About screen and the Why drawer say: "Prototype rule: your usual is taken from days 15 to 56, and moves only when you say so."

### 8.2 What can produce a card

Checked at each weekly review, in this order. Take the first three that qualify. Cards left open from last week stay and count toward the three. The three are fixed at the review: answering one does not pull in a fourth.

| # | Kind | Qualifies when | Statement | Evidence block |
|---|---|---|---|---|
| 1 | `topic-shift` | A topic's share of entries has been at least 10 points above its usual **and** at least 1.5 times its usual for 3 weeks running, **and** over the last 2 weeks the "hard" share of that topic is at least 20 points above its usual hard share, with at least 5 entries. | "{Topic} has come up {ratio words} as often as in your first two weeks. More of it felt hard." Ratio = entries in the last 2 weeks ÷ entries in the first 2 of the last 8 weeks. | Two rows of marks in the topic colour: first two weeks, last two weeks, each with "Days a to b / n mentions" |
| 2 | `own-sign` | One of the astronaut's own signs showed up (rule in `profile.signs`). | "You wrote this sign yourself: “{quote}” It showed up on days {list}." | The quote in gold, and the line "Written by you on day −41" |
| 3 | `check` | Latest full-length check has more slow responses than usual + 2, **or** the last two full-length checks in a row were both slower than usual by more than 3 times the person's own wobble. Usual = median of earlier sessions; wobble = the median distance of earlier sessions from that median. Needs at least 6 earlier sessions. | "More slow responses than your usual on this {morning}'s attention test{, after {n} short nights}." ("short night" = at least 60 minutes under usual sleep; clause only when n ≥ 2) | Two `.usual` rows: slow responses and average response time, each with tick at usual |
| 4 | `ledger` | Any ledger item is far from usual in the draining direction (see below). | One item: "{Item}: {value} this week. Your usual is {usual}." Two or more: "{Item A}: {value}, usual {usual}. {Item B}: {value}, usual {usual}." (top two by size of gap) | The same items as `.usual` rows |
| 5 | `rhythm` | Sleep started at least 60 minutes later than usual on 3 nights running. Dropped if an `own-sign` card about sleep qualifies. | "Your sleep has started about {1 h 30 min} later than your usual for {three} nights." | Three small rows, one per night: start time and usual |

Ratio words: 1.5–1.9 "about one and a half times" · 2.0–2.6 "about twice" · 2.7–3.4 "about three times" · 3.5–3.9 "nearly four times" · 4.0–4.4 "about four times" · above that "about {n} times" (n rounded).

**Away from usual (for the ledger screen, either direction)**
- Sleep: weekly average at least 60 minutes above or below usual.
- Counted items: the gap is at least 2, and the value is at least double or at most half the usual (when usual is 0: value ≥ 2).

**Far from usual, costly direction (for cards only)**
- Sleep: weekly average at least 60 minutes under usual.
- Draw items counted in whole numbers: value − usual ≥ 2 and value ≥ 2 × usual (when usual is 0: value ≥ 2).
- Refill items: usual − value ≥ 2 and value ≤ usual ÷ 2.

**The table from the build spec, as rules**

| What the diary shows | Card? |
|---|---|
| A topic's share rises, and how it felt is unchanged | No |
| A topic's share rises, and more of it felt hard | Yes (`topic-shift`) |
| A topic that is always griped about is griped about more | No (its hard share is not above its own usual) |
| A topic stops appearing | No |

**One own-sign card a week.** If several signs showed up, the card is for the one that has a sharing line, otherwise the one that showed up on the most days. The others are still listed on My plan → Early signs.

**Subject of a ledger card** is its top item. Items are ranked by gap ÷ bar scale max, and an item in a quiet period is left out. The card needs at least one item left.

**Card title** (used in "What the tool did with your answers"): `topic-shift` → "{Topic} is coming up more" · `own-sign` → the quote · `check` → "Slow responses on the attention test" · `ledger` → "Fewer {refill item}" or "More {draw item}", two items joined with "and", only the first capitalised · `rhythm` → "Sleep is starting later".

**Quiet periods.** After a card is acted on or marked not-right, the same kind for the same topic or item cannot return for 28 days. After a skip: 7 days. During days 1–14: nothing.

**Stale cards.** At each weekly review, an open card whose condition no longer holds is removed silently. It is not logged.

**Story autopilot.** `scenario-params.json → scriptedResolutions` lists what the demo astronaut did with the cards on days 42 and 105. If the story moves past one of those days and the card is still open, apply the scripted resolution. This keeps later chapters consistent. The day-112 cards are never auto-resolved.

**Check on the story numbers** (tests must assert these): day 42 → exactly one card, `ledger`, about Dinners with crew (2, usual 5). Day 98 → no cards. Day 105 → one `ledger` card (dinners 2, usual 5; long suit-prep days 3, usual 1), titled "Fewer dinners with crew and more long suit-prep days". Day 112 → three cards in this order: `topic-shift` for Family ("nearly four times", marks 4 good then 4 good / 2 mixed / 9 hard), `own-sign` for the midnight sign (days 109, 110 and 111), `check`.

### 8.3 What each action does

| Action kind | Label examples | Effect |
|---|---|---|
| `write` | "Write about it" | Go to Journal, composer focused, prefilled with "About {topic}: " |
| `call-window` | "Book a call window" | Enables the "Call window starts in 10 minutes" reminder and adds a one-off wrist reminder "Ask Jonas for the long call window". It does not touch the schedule. Effect line: "Your wrist will remind you before the next call window." |
| `talk` | "Talk to someone" | Opens the Talk sheet |
| `own-step` | "Start step 1 tonight" | One-off wrist reminder with the step's own words |
| `protective` | "Ask Ana to second-check the EVA prep review" | Opens the Talk sheet addressed to that crewmate with a two-line draft. Performance wording, no feelings wording |
| `coping` | "20-minute nap" | Opens the coping task sheet |
| `reminder` | "Add a wrist reminder" | Creates or enables a reminder |
| `rebuild-day` | "Rebuild yesterday" | Go to Patterns → Your days |

**Actions per card kind** (first is primary)

| Kind | Actions |
|---|---|
| `topic-shift`, topic Family | Write about it · Book a call window · Talk to someone |
| `topic-shift`, topic Work | Write about it · Talk to {work support crewmate} · Problem-solving sheet (coping) |
| `topic-shift`, topic Crew | Write about it · Conflict and stress module (coping) · Talk to someone |
| `topic-shift`, other topics | Write about it · {best-fitting coping task} · Talk to someone |
| `own-sign` | Start step 1 tonight · {step 2 as an action, if it names a person} · Talk to someone |
| `check` | Ask {work support crewmate} to second-check the {next safety-critical block's label} (for example "Ask Ana to second-check the EVA prep review"; if no such block is within 2 days, this action is left out) · 20-minute nap · Talk to someone |
| `ledger` | Add a wrist reminder · {best-fitting coping task} · Talk to someone |
| `rhythm` | Rebuild yesterday · Start a wind-down reminder · Talk to someone |

**Routing rule for the Talk sheet's default recipient** (support should match the stressor): work → the work crewmate; family → "Message home"; sleep, body, attention test → crew medical officer; anything the user opens from Sharing → flight surgeon.

**Choosing a coping task.** Filter the coping menu by what the card is about (`fits`), put items with `fromPreferences: true` first, then by fewest "did not help" results, and drop anything longer than the minutes until the next block when that is known.

### 8.4 What "That's not right" changes

| Reason | Effect | Effect sentence |
|---|---|---|
| Data wrong or missing, `ledger` card about dinners | Sets `countWristDinners`. Dinners logged from the wrist now count; week 6 shows 5 instead of 2. | "It now counts dinners you log from your wrist too." |
| Data wrong or missing, `topic-shift` | Opens the entries so tags can be corrected; the card is rebuilt at the next review. | "You can retag those entries. The tool will look again next week." |
| Data wrong or missing, `check` | Marks that session as not counting toward anything. | "That test will not be counted." |
| Data wrong or missing, `own-sign` or `rhythm` | Marks those nights as "wearable was wrong". | "Those nights will not be counted." |
| Accurate, and this is my new usual (`topic-shift`, `ledger`, `rhythm`, `check`) | Moves the usual as in §8.1 for everything named on the card, and starts a 28-day quiet period for that kind and topic or item. | Ledger: "{Item}: your usual is now {new} (was {old}). The early mark stays on the bar." Topic: "{Topic} at about 1 in {N} of your diary is now your usual (was about 1 in {M})." Sleep start: "Your usual sleep start is now {hh:mm} (was {hh:mm})." Check: "Your usual response time is now {x} ms (was {y} ms)." |
| Accurate, but not a concern right now (`own-sign` only) | 28-day quiet period for that sign. | "The tool will not raise this for 4 weeks." |
| Something else | Nothing changes except the log. | "Noted. Nothing else changed." |

### 8.5 The three levels of response

| Level | What it is | How it shows |
|---|---|---|
| 1 | Things the astronaut can do alone | The actions on a card |
| 2 | Involving someone, when the astronaut chooses | "Talk to someone" → Talk sheet → share log |
| 3 | A line set before launch is crossed | Checked every day, not weekly. On the day the run of past-midnight nights first reaches 5, write the rule's exact message to the share log addressed to the flight surgeon, and show the "Line crossed" banner on Today for 7 days. It fires once per run, and can fire again only after the run has reset to 0. No diary text is ever included. |

In the story, level 3 fires on day 114 in branch B (nights of days 109–113).

### 8.6 Reading a diary entry (keyword tagger)

1. Split the text into sentences at `.`, `!`, `?` and line breaks. Drop empty ones.
2. For each sentence, count keyword hits per category from `topics.json` (case-insensitive, match at the start of a word). The category with the most hits wins; on a tie, the one whose first hit comes earliest in the sentence (NASA's coders used "the one mentioned first"). No hits → `Uncategorised`.
3. Merge neighbouring sentences with the same category into one segment.
4. Guess how it felt from `feltWords`: only "good" words → good; only "hard" words → hard; both → mixed; none → no guess.
5. A segment's group is its category's group. The astronaut's corrections always replace the guess (`feltBy: 'you'`).

Shares are counted in segments: a topic's share for a week = its segments ÷ all segments that week. The About screen says so, and says the keyword tagger is a stand-in: the build spec's plan is a language model using the same 24 NASA categories, tested against human labels.

### 8.7 Scoring the attention test

From the list of response times in ms: `n` = valid responses (≥ 100 ms); average response time = mean; speed = mean of 1000 ÷ RT; slow responses = count with RT ≥ 355; early taps = responses under 100 ms or with no counter showing. A trial with no response in 30 s counts as a slow response and is left out of the average. Thresholds 355 ms, 1–4 s waits and 3 minutes follow the PVT-B design (Basner, Mollicone and Dinges 2011).

---

## 9. Data

### 9.1 The simulated mission

`reference/scenario-params.json` is the single source. A generator (`buildScenario(branch)`) expands it into days. The generator is deterministic: same input, same output, on every machine.

Story in one paragraph: a crew of five on a 520-day mission. Days 1–14 the tool only watches. Weeks 3–8 are the astronaut's usual. In week 6 the mission timeline misses three dinners that were moved to the greenhouse module, and the tool wrongly says dinners are down. From week 11, long suit-prep days increase, sleep slides later, call windows get missed, and family takes up more of the diary and feels harder. On day 112 three things qualify at once. After that the story branches on whether the astronaut acted.

### 9.2 Types (authoritative; `src/types.ts`)

```ts
export type Group = 'work'|'home'|'crew'|'body'|'timeoff'|'self'|'space'|'other';
export type Felt = 'good'|'mixed'|'hard';
export type DataTag = 'nasa-replay'|'nasa-method'|'sim'|'ai-sample'|'user';
export type EvidenceTag = 'nasa-use'|'earth'|'analog'|'exp'|'placeholder';
export type Branch = 'A'|'B';

export interface Segment { id: string; day: number; text: string; category: string; group: Group;
  felt: Felt|null; feltBy: 'tool'|'you'; origin: DataTag; }
export interface Entry { id: string; day: number; segments: Segment[]; origin: DataTag; }

export type BlockKind = 'sleep'|'work'|'gym'|'call'|'dinner'|'greenhouse';
export interface Block { id: string; day: number; kind: BlockKind; label: string;
  startMin: number; endMin: number;            // minutes from 00:00 of `day`; sleep start may be negative
  source: 'wearable'|'timeline'|'messages'|'you'; felt: Felt|null; safetyCritical?: boolean; }

export interface DayRecord { day: number; week: number; dayIndex: number;   // dayIndex 1..7
  onsetMin: number; wakeMin: number; sleepMin: number; blocks: Block[];
  marks: { min: number; blockLabel: string|null }[];
  dials: { stress: number; sleepiness: number }; }

export interface CheckSession { id: string; day: number; slot: 'am'|'pm'; trials: number;
  meanRtMs: number; speed: number; lapses: number; falseStarts: number;
  durationS: number; counts: boolean; origin: DataTag; }

export type LedgerKey = 'sleep'|'suitPrepLong'|'daysSinceRest'|'callsMissed'|'noisyNights'
  |'dinners'|'callsSam'|'callsMom'|'gym'|'greenhouse'|'copingDone';
export interface LedgerItem { key: LedgerKey; side: 'draw'|'refill';
  reserve: 'rest'|'connection'|'movement'|'calm'; label: string;
  value: number; usual: number|null; earlyUsual: number|null;   // earlyUsual differs from usual only after the astronaut moved it
  scaleMax: number; sentence: string; far: boolean; away: boolean; }   // far = costly direction (cards); away = either direction (screen)

export interface Scenario { branch: Branch; days: DayRecord[]; entries: Entry[];
  checks: CheckSession[]; weeks: WeekRow[]; profile: Profile; }   // WeekRow, Profile mirror the JSON

export type CardKind = 'topic-shift'|'own-sign'|'check'|'ledger'|'rhythm';
export type ActionKind = 'write'|'call-window'|'talk'|'own-step'|'protective'|'coping'|'reminder'|'rebuild-day';
export interface CardAction { id: string; kind: ActionKind; label: string; payload?: Record<string, unknown>; }
export interface Card { id: string;            // `${week}-${kind}-${subject}`
  week: number; day: number; kind: CardKind; subject: string;   // group id, sign id, ledger key, check slot ('am'|'pm') or 'sleep'
  title: string; statement: string; evidence: CardEvidence; actions: CardAction[]; whyKey: string; dataTag: DataTag; }
export type CardEvidence =
  | { type: 'marks'; rows: { label: string; count: number; good: number; mixed: number; hard: number }[]; group: Group }
  | { type: 'quote'; quote: string; note: string }
  | { type: 'usual-rows'; rows: { label: string; value: number; usual: number; scaleMax: number; text: string }[] }
  | { type: 'nights'; rows: { day: number; onsetMin: number; usualMin: number }[] };

export interface Resolution { cardId: string; day: number; status: 'acted'|'not-right'|'skipped';
  title: string; choice: string; effect: string; }
export interface ShareLogEntry { id: string; day: number; to: string; text: string; auto: boolean; }
```

### 9.3 NASA resources and what each one does in the app

| Resource | What the app takes from it | Where the user sees it |
|---|---|---|
| ISS astronaut journals study (Stuster 2010; NASA TM-2010-216130; Life Sciences Portal set H01). **Read from the file on 15 Nov.** | The 24 topic categories, word for word; the premise that how often a topic appears shows how much it matters to the writer; the tone value of each of the top 18 categories (recreation +0.687 down to organisation and management −0.641); how many of the 8,213 category assignments fell in each category | Journal tags; On your mind; "Why is there no mood score?"; About |
| ISS Reaction Self-Test (Jones et al., Sleep 2022) and PVT-B (Basner et al. 2011) | The every-4-days check: slider ratings plus a 3-minute test; 355 ms slow-response line | Scheduled check |
| Bed Rest Standard Measures: Performance Testing (L01), one volunteer's simple reaction-time sessions. **Read from the file on 15 Nov.** | (1) The demo astronaut's test history before day 112 is this volunteer's real sessions, in order (`reference/nasa/check_history.json`). (2) The rule for a slow test: across the three volunteers a fixed "25 ms slower" line would have gone off on 11%, 14% and 19% of ordinary sessions; "two sessions in a row beyond 3 times your own wobble" went off on 0%, 0% and 3%; "slow responses above usual + 2" on 0% | Check card; "Show my numbers" (tag: Replayed NASA data); Why drawer |
| WinSCAT bed-rest data (H03) | Not used in the app. It backs the build spec's point that test results improve with practice | — |
| HRP evidence report: Behavioral Health (2025) | Crews must monitor themselves and act without Earth (p.55); under-reporting from fear for flight status (p.28); per-person baselines (p.59, p.120); matching support to stressor (p.61); evidence behind each coping task (p.87–93) | Why drawers; coping evidence lines; Sharing screen |
| HRP evidence report: Sleep (2016) | Short sleep and performance; boredom on the transit (p.57) | Check card; wrist "something to do" |
| HRP research plan, June 2026, gap BH-201 | The gap this tool answers: indicators and thresholds for semi-autonomous monitoring | About; pitch |
| Acoustic noise chamber data (L04) | Night noise feed (P2) | Ledger "Noisy nights" |

Not NASA, and labelled so: Mars Desert Research Station crew reports (test set for the tagger, not in the app), Karolinska Sleepiness Scale, Gavriloff 2018, Klasnja 2018.

### 9.4 Why-drawer content (`src/data/evidence.ts`)

One record per `whyKey`: `{ title, compared, rule, tags, source }`. Required keys and their core text:

| Key | Compared | Rule in plain words | Source |
|---|---|---|---|
| `why.topic-shift` | "How much of your diary was about {topic} each week, and how those entries felt to you." | "Shown only when a topic takes a much bigger share than your usual for three weeks running and more of it felt hard. A bigger share alone is not shown." | Stuster 2010 (NASA journals study); placeholder thresholds |
| `why.own-sign` | "A sign you wrote before launch, checked against your wearable." | "The tool adds no signs of its own." | Behavioral Health evidence report 2025, p.60 (self-reflection training) |
| `why.check` | "Your slow responses and response time against your earlier tests." | "Slow means 355 ms or more, the line used for the 3-minute test ISS crews take. A single slower test is ignored: in NASA bed-rest test records, one person's results wobble by 10 to 20 ms from session to session, so the tool waits for two in a row beyond three times your own wobble." | Basner 2011; Jones 2022; NASA bed-rest performance tests (L01) |
| `why.ledger` | "This week's count against your usual from days 15 to 56." | "Shown when something that costs you (short sleep, long days) at least doubles, or something you usually have (dinners, calls) at least halves." | Placeholder thresholds; evidence report p.121–123 (interacting risks) |
| `why.rhythm` | "When your sleep started, from your wearable." | "Three nights running, an hour or more later than your usual." | Sleep evidence report 2016 |
| `why.no-mood-score` | — | "Topics carry their own tone. In NASA's study of ISS journals, entries about recreation leaned positive and entries about equipment leaned negative, whoever wrote them. An average would mostly show what you wrote about, not how you are. So the tool compares how things felt only inside one topic, against your own usual for that topic." Then the 18 values from `topics.json → h01NetToneByCategory` as a simple list, tagged "NASA data". | Stuster 2010 |
| `why.usual` | — | "Your usual is taken from days 15 to 56. It moves only when you say a change is your new usual. The early mark stays visible." (Prototype rule, §8.1) | — |
| `why.topics` | — | "The topics are the 24 categories NASA used to study ten ISS astronauts' journals. In those journals the most written-about were work, contact with home and ground, adjusting, and the crew." Then `topics.json → h01CategoryCounts` grouped into the 7 display groups as one stacked row, tagged "NASA data", with the line "Shown as background. It is not a target, and the demo astronaut's own mix is simulated." | Stuster 2010 |
| `why.sharing` | — | "Astronauts under-report symptoms when they fear for their flight status. So nothing leaves this device unless you send it, or unless a line you set yourself is crossed." | Behavioral Health evidence report 2025, p.28 |

---

## 10. Words

### 10.1 Voice

- The tool describes; it does not diagnose or instruct. "Family has come up more often" not "You are homesick".
- Second person, present or past tense, short sentences, no exclamation marks.
- Performance and practical words: "slow responses", "short nights", "second checker".
- Numbers as people say them: "about 1 in 3", "nearly four times", "5h 58m".

### 10.2 Words to use and avoid

| Use | Not |
|---|---|
| your usual | baseline, normal, target |
| felt good / mixed / hard | positive / negative, sentiment, mood score |
| noticed | detected, flagged, alert |
| away from your usual / at or near your usual | stressors, wellness, self-care, refuel, recharge |
| things you can do | interventions, countermeasures (except on About) |
| early signs | symptoms, warning signs |
| told only that it happened | reported, escalated |

### 10.3 Claims the product does not make

The About screen lists these as written:

- It does not diagnose anything or detect any condition.
- It does not prevent anything. It helps you notice a change early and choose what to do.
- It has not been tested on astronauts or in an analog mission.
- Its thresholds are placeholders. NASA lists validated thresholds as an open research gap.
- It is not NASA software, and the attention test is modelled on PVT-B, not the licensed test.
- A handful of "what followed" records cannot show that a coping task works.

---

## 11. Submission

**30-second video (one take of the live app, 6 shots of 5 s each):** Today on day 12 (settling) → day 42, tap "That's not right", effect line appears → On your mind at day 98, family band widening → day 112 card, tap "Book a call window" → Sharing screen, the three levels → day 119 "If you didn't", the line-crossed banner with the exact message. Text overlay on the last frame: team name, members, challenge name.

**Or 7 slides:** 1 team and challenge · 2 the gap, in NASA's words (evidence report p.55, BH-201) · 3 how it works (write, notice, ask, follow up) · 4 screenshot: day 112 card · 5 screenshot: On your mind + ledger, "no score" called out · 6 what is NASA data, what is simulated, what it does not claim · 7 the tool gets corrected + the three levels of response.

Project page fields: list every NASA resource in §9.3 under "NASA Data"; disclose AI use for code, sample journal text and this design.

---

## 12. Open items for Eric

1. **Name.** "Psych Navigator" came from the navigator framing you later moved away from. One constant to change.
2. **Changing a pre-launch line is logged to the flight surgeon** (§7.9). This is my proposal so a safety line cannot vanish silently. Say if you want it private instead.
3. **The demo astronaut's diary mix is not NASA's.** In the real ISS journals, contact with home and ground is about 18% of what astronauts wrote about and adjusting is about 13%; the simulated astronaut starts at 10% and 3%. The story still works, and the real mix is shown in the Why drawer. Re-basing the story on the real mix is possible but changes the card wording ("nearly four times" becomes "about twice") and every pinned number.
4. **Team name and members** for the video or slides.

# Psych Navigator

NASA Space Apps 2026 · Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*

A private self-check for astronauts on long missions. It notices slow change against **your own usual**, asks before it assumes ("Does this match?"), and never gives you a score. Every card ends in something you can do, or in telling the tool it is wrong, and the tool visibly changes when you do.

**Public URL:** https://mindmapper-taupe.vercel.app/

## Try it in 60 seconds

Use the **Demo story** bar at the top. It drives a simulated 126-day mission:

1. **Day 12 · Settling in.** For the first 14 days the tool only watches.
2. **Day 42 · It gets one wrong.** Tap *That's not right* → *The data is wrong* → *Tell the tool*. The tool changes.
3. **Day 98 · A quiet drift.** Patterns → On your mind: family takes a widening share of the diary. One week is not a pattern, so no card is raised. But that night's diary entry matches the one fixed safety line: open Journal to see the notice, the exact note that was sent, and the relief steps. Switch to Flight surgeon view to see what Earth received.
4. **Day 112 · Three things noticed.** Three cards, each with actions you choose.
5. **Day 119 · What followed.** Choose *If you acted* or *If you didn't*. If you didn't, a line you set before launch was crossed and the exact message is shown.

## Body trends, the reaction speed test and the delay to Earth

**Patterns → Body trends** shows only things that are measured, never rated: sleep, reaction speed, resting heart rate, exercise, body mass, blood pressure, fasting blood sugar, body temperature, and CO2 at the collar (awake and asleep). Each is a 28-day line chart against its own line. A ring marks a reading outside its line; colour never carries status. Anything outside its line often enough is listed under "Worth a second look", with a note you can edit and send.

| Measure | Worth a second look when | Where the line comes from |
|---|---|---|
| Reaction speed | 8% or more below your own usual, two tests in a row | Derived from NASA WinSCAT bed-rest records (MR085G): 28 healthy volunteers, 141 tests. 5.0% of single tests crossed it (95% CI 1.3 to 9.6%); 0.9% twice in a row (0 to 2.9%) |
| Sleep | Under 6 h on 3 of the last 5 nights | ISS Reaction Self-Test records (Jones 2022): nights under 6 h went with slower response speed |
| CO2 around you | Daily or sleep-period mean at or above 3.0 mmHg, two in a row | NASA-STD-3001 Vol 2 cabin limit, applied to a worn sensor by this prototype |
| Body mass | More than 5% below launch mass, two weekly readings in a row | NASA ISS nutrition data: 2 to 5% loss early in flight is the reported range |
| Resting heart rate, exercise | Outside your own usual on 3 of the last 5 days | Own range only. No NASA cutoff found |
| Blood pressure, blood sugar, temperature | Latest reading outside the clinical range | Ordinary clinical limits. Not NASA values |

The NASA volunteers were all well, so these figures are false-alert rates. They say nothing about how often a line catches a real change. Re-run the derivation with `python3 -I analysis/winscat_cutoffs.py /path/to/MR085G`; it writes `src/data/nasa/body_cutoffs.json`. The raw WinSCAT files are not in the repo.

The collar CO2 readings are modelled on NASA's Personal CO2 Monitor and are simulated, including a four-night pocket in the sleep station on days 99 to 102.

**Today** always offers the reaction speed test. Every fourth day it is part of the scheduled check; on other days it can be taken by itself.

**Header.** Every tab shows the one-way delay to Earth for the mission day, computed from the orbits of Earth and Mars with a minimum-energy outbound transfer (`src/lib/delay.ts`). It replaces the fixed 18 minutes used before: day 112 is 2 min 35 s.

## Flight surgeon view, and what breaks confidentiality

The Demo story bar has a switch: **Astronaut view / Flight surgeon view**. The flight surgeon view replaces the whole app with one page built only from share-log entries addressed to the flight surgeon. It shows the notes the astronaut chose to send, the lines agreed before launch with any note each one sent, and a list of what is not shared. It never shows the diary, cards, test results, body trends, notes to other people, or how close a line is to being crossed.

| Line | Kind | Sends |
|---|---|---|
| Imminent risk to self or to someone else | Fixed. The same limit to confidentiality as on Earth. Cannot be changed or switched off | A note to the crew medical officer at once, and to the flight surgeon, saying that it happened. Crossed when the astronaut reports it (Profile → Sharing → "Report a risk now"), or when a diary entry matches an on-device word check. Diary text is never sent. In the demo it is crossed by the day 98 entry |
| CO2 at the collar at or above 3.0 mmHg, 2 days or nights running | Negotiable between astronaut and flight surgeon | An automatic note to the flight surgeon. In the demo it is crossed on day 100 |
| Sleep starting past midnight, 5 nights running | Negotiable | An automatic note to the flight surgeon |
| Nothing written for 10 days | Negotiable. Asks the astronaut first | Nothing. Not visible to the flight surgeon |

A change to a negotiable line is itself sent to the flight surgeon.

**The word check.** `src/logic/safety.ts` holds a short list of phrases. It is a stand-in, like the topic tagger: it will miss real risk and match harmless sentences, and it has not been validated. When an entry matches, the astronaut sees a notice on Journal and Today for 7 days with the exact note that was sent, three relief steps built from their own pre-launch plan (the crew medical officer comes now; one item from their own list; a second checker on safety-critical work), and a button to add their own words for the flight surgeon. The flight surgeon view shows the note and the same relief steps, and says the match can be wrong.

## Run it locally

Node 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm test -- --run  # unit and screen tests
npm run build      # static site in dist/
```

Deploy `dist/` as a static site (Vercel framework preset: Vite). There is no backend; nothing is fetched at runtime except Google Fonts.

## NASA resources used

| Resource | What the app takes from it |
|---|---|
| ISS astronaut journals study (Stuster 2010; NASA TM-2010-216130; LSDA H01, DOI 10.83263/w7m8-qf96) | The 24 diary topic categories, word for word; topic tone values for the "Why is there no mood score?" explainer |
| ISS Reaction Self-Test (Jones et al., Sleep 2022) and PVT-B (Basner et al. 2011) | The every-fourth-day check: dials plus a 3-minute attention test, 355 ms slow-response line |
| Bed Rest Standard Measures: Performance Testing (LSDA L01, DOI 10.83263/7081-d617) | The demo astronaut's test history before day 112 is one volunteer's real sessions, in order; the slow-test rule was chosen against all three volunteers |
| HRP evidence report: Behavioral Health (2025) | Self-monitoring without Earth (p.55), under-reporting (p.28), per-person usuals (p.59, p.120), matching support to stressor (p.61), coping evidence (p.87–93) |
| WinSCAT in bed rest (NASA Life Sciences Portal, MR085G) | The reaction speed line in Body trends |
| NASA Personal CO2 Monitor (ICES-2018-309) | The collar-worn CO2 measure, values simulated |
| NASA-STD-3001 Vol 2; OCHMO carbon dioxide brief; Law et al. 2014 | The 3.0 mmHg CO2 line |
| NASA planetary fact sheets (NSSDCA) | Earth and Mars orbits for the delay to Earth |
| HRP evidence report: Sleep (2016) | Short sleep and performance; boredom on the transit (p.57) |
| HRP research plan, June 2026, gap BH-201 | The gap this tool answers |
| Acoustic noise chamber data (LSDA L04, DOI 10.83263/z56c-ea13) | Background for the "Noisy nights" item |

Not NASA, and labelled so in the app: Mars Desert Research Station crew reports (tagger test set only), Karolinska Sleepiness Scale, Gavriloff 2018, Klasnja 2018. NASA data informs design decisions; nothing is trained on it. No NASA logos or insignia are used.

## What it does not claim

- It does not diagnose anything or detect any condition.
- It does not prevent anything. It helps you notice a change early and choose what to do.
- It has not been tested on astronauts or in an analog mission.
- Its thresholds are placeholders. NASA lists validated thresholds as an open research gap.
- It is not NASA software, and the attention test is modelled on PVT-B, not the licensed test.

## AI use

Built with AI assistance (Claude), for code, the sample journal sentences and the design write-up. Journal entries in the demo are AI-written samples. The idea, scope and design decisions are the team's.

## Project layout

- `docs/DESIGN.md`: the product design (screens, rules, words, data). `docs/PLAN.md`: the build order.
- `src/data/`: the simulated mission (`scenario-params.json`, generated deterministically) and the real NASA test history (`nasa/check_history.json`).
- `src/logic/`: the noticing engine (cards, ledger, shares, early signs, tagger, attention-test scoring). Every threshold is in `src/logic/thresholds.ts`.
- `src/state/`: an append-only event log in `localStorage`; every screen is a pure view of (day, branch, events).

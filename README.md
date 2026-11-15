# Psych Navigator

NASA Space Apps 2026 · Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*

A private self-check for astronauts on long missions. It notices slow change against **your own usual**, asks before it assumes ("Does this match?"), and never gives you a score. Every card ends in something you can do, or in telling the tool it is wrong, and the tool visibly changes when you do.

**Public URL:** _to be added after deployment_

## Try it in 60 seconds

Use the **Demo story** bar at the top. It drives a simulated 126-day mission:

1. **Day 12 · Settling in.** For the first 14 days the tool only watches.
2. **Day 42 · It gets one wrong.** Tap *That's not right* → *The data is wrong* → *Tell the tool*. The tool changes.
3. **Day 98 · A quiet drift.** Patterns → On your mind: family takes a widening share of the diary. One week is not a pattern, so Today stays quiet.
4. **Day 112 · Three things noticed.** Three cards, each with actions you choose.
5. **Day 119 · What followed.** Choose *If you acted* or *If you didn't*. If you didn't, a line you set before launch was crossed and the exact message is shown.

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

# Psych Navigator: design and build pack

For NASA Space Apps 2026, "Create Health Monitoring Software for Astronauts on Space Missions".

## What is in here

| File | What it is |
|---|---|
| `DESIGN.md` | The product: what it does, every screen, the rules, the words, the data. Read first. |
| `PLAN.md` | The build order for a coding agent: 12 tasks to a deployed app, then extras. Each task has its files, function signatures and tests. |
| `reference/app.css` | The design system as CSS. Copied into the app unchanged. |
| `reference/shell-today.html` | A static mock of the app shell and the Today screen. Open it in a browser; the build must match it. |
| `reference/scenario-params.json` | The simulated 126-day mission that drives the demo. |
| `reference/topics.json` | NASA's 24 journal categories with their real counts and tone values from the ISS journals report, the 7 display groups, and tagger keywords. |
| `reference/nasa/check_history.json` | Real reaction-time sessions from one NASA bed-rest volunteer (Life Sciences Data Archive, BRSMPT). Used as the demo astronaut's test history. |

## How to hand this to Claude Code

1. Make an empty folder, put this pack in it as `docs/`, and open Claude Code there.
2. Say: "Read docs/DESIGN.md and docs/PLAN.md in full, then carry out PLAN.md task by task. Stop after Task 12 and show me the deployed URL."
3. After Task 12 the app is submittable. Tasks 13 onward are improvements; run them in order while time allows.

## Honest labels

This pack and the mock were made with AI assistance (Claude). The demo's journal entries are AI-written samples. Wearable values are simulated. Nothing here is NASA software.

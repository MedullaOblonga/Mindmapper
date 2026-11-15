# Real astronaut journals (stored for reference, not used by the app)

Two first-person journals written by NASA astronauts during long stays on the International Space Station, kept as one Markdown file per entry. They are stored separately from the app's AI-written sample diary and are **not** shown on the website or mixed with it.

| Folder | Author | Mission | Entries | Words |
|---|---|---|---|---|
| `williams/` | Sunita Williams | ISS Expeditions 14 and 15, Dec 2006 to Jun 2007 (195 days) | 28 weekly logs, from 7 weeks before launch to landing | about 30,000 |
| `anderson/` | Clayton Anderson | ISS Expedition 15, Jun to Nov 2007 (152 days) | Prologue, 13 chapters, post-flight epilogue | about 9,700 |

Why these two: they are the longest-running and most personal of the journals NASA published (holidays, being the only American aboard, missing family, a parent's illness). NASA's journal index also lists Pettit, Lu, Magnus, Whitson, Chamitoff, Lopez-Alegria, Jeff Williams and Phillips; those are shorter or mostly about the science and the station.

## Caveats

- Written for the public and edited for NASA's website, so more guarded than a private diary. The private ISS journals studied by Stuster (NASA TM-2010-216130) are confidential.
- Each file keeps the original nasa.gov address and the archived copy it was taken from. Photo captions were removed; the text is otherwise as published.
- Rights: these are writings by NASA astronauts, published by NASA as part of their official duties, so they are very likely US government works without copyright. That has not been confirmed with NASA. Credit the astronaut and NASA if any of it is quoted.

## Rebuilding

The pages were downloaded from the University of North Texas web archive of nasa.gov (2012 captures), for example
`https://webarchive.library.unt.edu/web/2012id_/http://www.nasa.gov/mission_pages/station/expeditions/expedition15/journal_sunita_williams_22.html`.
Save the Williams pages as `1.html` to `28.html` and the Anderson pages as `prologue.html`, `01.html` to `13.html`, `epilogue.html`, then run:

```bash
python3 -I research/journals/extract.py <williams_html_dir> williams research/journals/williams
python3 -I research/journals/extract.py <anderson_html_dir> anderson research/journals/anderson
```

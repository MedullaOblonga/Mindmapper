"""Build the app's real-journal data from the stored Markdown entries.

Usage: python3 -I research/journals/to_app.py research/journals src/data/journals

Each in-flight entry gets a mission day (day 1 = launch day, UTC). Days come from what the entry itself says
(holidays, "mission elapsed time 31 days", a named spacewalk) or, between those, from the weekly rhythm of the
writing. Entries written before launch or after landing are kept in the file but get no day, so the replay skips them.
"""
import json, os, re, sys

# entry number -> (mission day or None, how the day was set)
WILLIAMS = {
    'launch': '2006-12-10', 'landing_day': 195,
    'days': {
        1: (None, 'Written 7 weeks before launch'), 2: (None, 'Written 4.5 weeks before launch'), 3: (None, 'Written 1 week before launch'),
        4: (16, 'Says Merry Christmas: 25 Dec 2006'), 5: (22, 'Happy New Year: 31 Dec 2006'), 6: (29, 'Russian Christmas: 7 Jan 2007'),
        7: (35, 'Martin Luther King Day weekend: 13 Jan 2007'), 16: (98, "St Patrick's Day: 17 Mar 2007"),
        23: (147, 'Cinco de Mayo: 5 May 2007'), 24: (154, "Mother's Day weekend: 12 May 2007"),
        27: (175, 'After the Expedition 15 spacewalk of 30 May 2007'),
    },
    'weekly': 'Other entries: one a week, 7 days after the one before (her journal was weekly).',
    # names as they appear in the text, so the tagger can tell crew from home
    'people': {'crew': ['Misha', 'Mike', 'Thomas', 'Fyodor', 'Oleg', 'Beamer', 'Clay', 'Lopez-Alegria', 'Tyurin', 'Reiter', 'Kotov', 'Yurchikhin'],
               'home': ['Gorby', 'Michael', 'my husband', 'my parents', 'my mom', 'my dad']},
}
ANDERSON = {
    'launch': '2007-06-08', 'landing_day': 153,
    'days': {
        1: (None, 'Prologue, written about 90 days after landing'),
        2: (12, '"The last eleven days" since launch'), 3: (21, 'Between chapters 1 and 3'),
        4: (31, '"My mission elapsed time is now 31 days"'), 5: (47, 'After the 23 Jul 2007 spacewalk'),
        6: (56, '"Fifty-six days and counting"'), 7: (77, '"Some 77 days ... ago"'), 8: (85, 'Between chapters 6 and 8'),
        9: (95, 'After the last spacewalk, before the Soyuz move'), 10: (113, 'Day after the Soyuz relocation of 27 Sep 2007'),
        11: (125, '"Almost time for me to go home"'), 12: (136, 'Expedition 15 crew landed "today": 21 Oct 2007'),
        13: (143, 'Between chapters 11 and 13'), 14: (149, '"My final one from orbit", before undocking on 5 Nov 2007'),
        15: (None, 'Epilogue, written after landing on 7 Nov 2007'),
    },
    'people': {'crew': ['Fyodor', 'Oleg', 'Peggy', 'Yuri', 'Dan', 'Suni', 'Yurchikhin', 'Kotov', 'Whitson', 'Malenchenko', 'Tani', 'Three Musketeers'],
               'home': ['Susan', 'Cole', 'Sutton', 'Mother', 'Dad', 'Nebraska', 'my family', 'my wife', 'my kids', 'my children']},
}

def read(path):
    raw = open(path, encoding='utf-8').read()
    title = raw.split('\n', 1)[0].lstrip('# ').strip()
    meta = dict(re.findall(r'^- ([^:]+): (.*)$', raw, flags=re.M))
    body = raw.split('\n\n', 2)[2] if raw.count('\n\n') >= 2 else ''
    body = re.sub(r'^\s*Life on the ISS:\s*', '', body)
    body = re.sub(r'(?m)^\s*•\s*', '', body).strip()
    # leftover photo captions and credits
    body = re.sub(r'Image (?:above|below|(?:at|to) (?:left|right))?\s*:[^\n]*?Credit:\s*NASA\.?', '', body)
    body = re.sub(r'(?m)^\s*(?:Image )?Credit:\s*NASA[^\n]*$', '', body)
    # abbreviations the sentence splitter would cut in the wrong place
    for a, b in [('a.m.', 'am'), ('p.m.', 'pm'), ('U. S.', 'US'), ('U.S.', 'US'), ('e.g.', 'eg'), ('i.e.', 'ie'), ('Dr.', 'Dr'), ('Mr.', 'Mr'),
                 ('Mrs.', 'Mrs'), ('St.', 'St'), ('vs.', 'vs'), ('etc.', 'etc'), ('approx.', 'approx'), ('No.', 'No')]:
        body = body.replace(a, b)
    body = re.sub(r'(\d)\. (\d)', r'\1.\2', body)             # "33. 8 minutes" -> "33.8 minutes"
    body = re.sub(r'\n{3,}', '\n\n', body).strip()
    return title, meta, body

def build(src_dir, who, table, author, mission):
    files = sorted(f for f in os.listdir(os.path.join(src_dir, who)) if f.endswith('.md'))
    entries, prev = [], None
    for i, f in enumerate(files, start=1):
        title, meta, body = read(os.path.join(src_dir, who, f))
        if i in table['days']:
            day, how = table['days'][i]
        else:
            day, how = (prev + 7 if prev else None), 'One week after the entry before'
        if day is not None: prev = day
        entries.append({'n': i, 'title': title, 'day': day, 'dayFrom': how, 'words': len(body.split()),
                        'url': meta.get('Original page', ''), 'archive': meta.get('Archived copy', ''), 'text': body})
    return {'source': who, 'author': author, 'mission': mission, 'launch': table['launch'], 'lastDay': table['landing_day'],
            'note': table.get('weekly', ''), 'people': table['people'], 'entries': entries}

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    for who, table, author, mission in [
        ('williams', WILLIAMS, 'Sunita Williams', 'ISS Expeditions 14 and 15, 10 Dec 2006 to 22 Jun 2007'),
        ('anderson', ANDERSON, 'Clayton Anderson', 'ISS Expedition 15, 8 Jun to 7 Nov 2007'),
    ]:
        d = build(src, who, table, author, mission)
        json.dump(d, open(os.path.join(out, f'{who}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        flown = [e for e in d['entries'] if e['day']]
        print(who, len(d['entries']), 'entries,', len(flown), 'in flight, days', [e['day'] for e in flown])

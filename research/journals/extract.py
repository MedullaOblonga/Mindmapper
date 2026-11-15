"""Turn archived NASA astronaut-journal pages into one Markdown file per entry.

Usage: python3 -I extract.py <downloaded_html_dir> <author> <out_dir>
Pages come from the UNT web archive copy of nasa.gov (2012 captures). Photo captions are dropped.
"""
import html, os, re, sys

SRC = {
    'williams': ('Sunita Williams', 'ISS Expeditions 14 and 15 (Dec 2006 to Jun 2007)', 'journal_sunita_williams_{n}.html'),
    'anderson': ('Clayton Anderson', 'ISS Expedition 15 (Jun to Nov 2007)', 'journal_anderson_{n}.html'),
}
ARCHIVE = 'https://webarchive.library.unt.edu/web/2012/http://www.nasa.gov/mission_pages/station/expeditions/expedition15/'
ORIGINAL = 'http://www.nasa.gov/mission_pages/station/expeditions/expedition15/'

def text_of(raw: str) -> str:
    s = re.sub(r'(?is)<(script|style)\b.*?</\1>', '', raw)
    s = re.sub(r'(?i)<br\s*/?>|</p>|<p\b[^>]*>|</li>|<li\b[^>]*>|</div>', '\n', s)
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s))
    s = re.sub(r'[ \t\r\f\v]+', ' ', s)
    return '\n'.join(l.strip() for l in s.split('\n'))

def entry(raw: str):
    t = text_of(raw)
    start = t.find('+ Home')
    m = re.search(r'›\s*Back To Top', t[start:])
    end = start + m.start() if m else -1
    body = t[start + len('+ Home'): end if end > 0 else None]
    body = re.sub(r'Image (?:(?:at|to) (?:left|right)|above|below)?\s*:.*?Image credit:[^\n.]*\.?', '', body, flags=re.S)
    paras = [p.strip() for p in re.split(r'\n\s*\n|\n', body) if p.strip()]
    title = paras.pop(0) if paras else ''
    return title, paras

def main(src_dir, author, out_dir):
    who, mission, pattern = SRC[author]
    os.makedirs(out_dir, exist_ok=True)
    files = sorted(os.listdir(src_dir), key=lambda f: (not f[0].isdigit() and f != 'prologue.html', f == 'epilogue.html', f.zfill(16)))
    files = [f for f in files if f.endswith('.html')]
    order = sorted(files, key=lambda f: (0 if f == 'prologue.html' else 2 if f == 'epilogue.html' else 1, int(re.sub(r'\D', '', f) or 0)))
    for i, f in enumerate(order, 1):
        title, paras = entry(open(os.path.join(src_dir, f), encoding='utf-8', errors='ignore').read())
        key = f[:-5]
        page = pattern.format(n=key)
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:50] or key
        words = sum(len(p.split()) for p in paras)
        md = [f'# {title}', '',
              f'- Author: {who}', f'- Mission: {mission}', f'- Entry: {i} of {len(order)} ({key})', f'- Words: {words}',
              f'- Original page: {ORIGINAL}{page}', f'- Archived copy: {ARCHIVE}{page}', '',
              *[p + '\n' for p in paras]]
        with open(os.path.join(out_dir, f'{i:02d}-{slug}.md'), 'w', encoding='utf-8') as fh:
            fh.write('\n'.join(md).rstrip() + '\n')
        print(f'{i:02d} {words:5d} words  {title[:70]}')

if __name__ == '__main__':
    main(*sys.argv[1:4])

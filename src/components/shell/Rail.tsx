import { Sun, NotebookPen, AlignLeft, Bookmark, Info } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const ITEMS = [
  { to: '/today', match: '/today', label: 'Today', Icon: Sun },
  { to: '/journal', match: '/journal', label: 'Journal', Icon: NotebookPen },
  { to: '/patterns/mind', match: '/patterns', label: 'Patterns', Icon: AlignLeft },
  { to: '/plan/signs', match: '/plan', label: 'My plan', Icon: Bookmark },
];

export function Rail({ dot = false }: { dot?: boolean }) {
  const loc = useLocation();
  const nav = useNavigate();
  const item = (it: typeof ITEMS[number] | { to: string; match: string; label: string; Icon: typeof Info }, showDot: boolean) => {
    const current = loc.pathname.startsWith(it.match) || (it.match === '/today' && loc.pathname === '/');
    return (
      <button key={it.to} className="rail-item" aria-current={current ? 'page' : undefined} onClick={() => nav(it.to)}>
        <it.Icon size={22} strokeWidth={1.8} aria-hidden="true" />
        {showDot && <i className="badge" aria-label="A card is open" />}
        {it.label}
      </button>
    );
  };
  const onToday = loc.pathname.startsWith('/today') || loc.pathname === '/';
  return (
    <nav className="rail" aria-label="Main">
      {ITEMS.map(it => item(it, it.match === '/today' && dot && !onToday))}
      <span className="rail-spacer" />
      {item({ to: '/about', match: '/about', label: 'About', Icon: Info }, false)}
    </nav>
  );
}

import { render, screen, within } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../../App';
import { appStore } from '../../state/store';
import { buildScenario } from '../../data/scenario';

const open = (day: number) => { appStore.setState({ day }); window.location.hash = '#/patterns/mind'; return render(<HashRouter><App /></HashRouter>); };

it('day 112: eight weeks, family detail, three quotes', () => {
  open(112);
  const weeks = screen.getByRole('region', { name: 'Weeks' });
  const labels = within(weeks).getAllByText(/^Days \d+ to \d+$/);
  expect(labels).toHaveLength(8);
  expect(labels[0]).toHaveTextContent('Days 181 to 187');
  expect(labels[7]).toHaveTextContent('Days 230 to 236');
  expect(screen.getByText('About 1 in 10 of your entries in the first of these eight weeks. About 1 in 3 now.')).toBeInTheDocument();
  const detail = screen.getByRole('region', { name: 'Family detail' });
  const days = within(detail).getAllByText(/^Day \d+$/).map(e => +e.textContent!.slice(4));
  expect(days).toHaveLength(3);
  expect(days[0]).toBe(233);
});

it('day 10 says the picture starts later', () => {
  open(10);
  expect(screen.getByText('The picture starts after your first two weeks.')).toBeInTheDocument();
});

it('a week with no entries reads "No entries this week"', () => {
  const s = buildScenario('B');
  const saved = s.entries;
  s.entries = saved.filter(e => e.day < 99 || e.day > 105);
  try {
    open(112);
    expect(screen.getByText('No entries this week')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/NaN/);
  } finally { s.entries = saved; }
});

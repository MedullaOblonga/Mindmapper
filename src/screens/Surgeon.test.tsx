import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../App';
import { appStore } from '../state/store';
import { buildScenario } from '../data/scenario';

const open = (day: number, hash = '#/today') => { appStore.setState({ day }); window.location.hash = hash; return render(<HashRouter><App /></HashRouter>); };
const toSurgeon = (u: ReturnType<typeof userEvent.setup>) => u.click(screen.getByRole('switch', { name: 'Flight surgeon view' }));

it('the switch swaps the whole app for the flight surgeon view, and back', async () => {
  const u = userEvent.setup();
  open(112);
  expect(screen.getByRole('heading', { name: 'Does this match?' })).toBeInTheDocument();
  await toSurgeon(u);
  expect(screen.getByRole('heading', { name: 'Flight surgeon view' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull();
  expect(screen.queryByText(/Share log:/)).toBeNull();
  expect(screen.getByText('Flight surgeon view, on Earth. Shared notes only.')).toBeInTheDocument();
  await toSurgeon(u);
  expect(screen.getByRole('heading', { name: 'Does this match?' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
});

it('shows only notes addressed to the flight surgeon, never the diary or notes to others', async () => {
  const u = userEvent.setup();
  appStore.setState({ day: 112 });
  appStore.getState().add({ type: 'share', to: 'Ana', text: 'Private note for Ana.' });
  appStore.getState().add({ type: 'share', to: 'Flight surgeon', text: 'Sleep has been short this week.' });
  open(112);
  await toSurgeon(u);
  const sent = screen.getByRole('region', { name: 'Sent by the crew member' });
  expect(within(sent).getByText('Sleep has been short this week.')).toBeInTheDocument();
  const text = document.querySelector('main')!.textContent!;
  expect(text).not.toContain('Private note for Ana.');
  for (const s of buildScenario('B').entries.flatMap(e => e.segments)) expect(text).not.toContain(s.text);
  expect(text).not.toMatch(/\bAt \d+ of \d+\b/);   // never how close a line is
});

it('lists the fixed and negotiable lines with the notes they sent', async () => {
  const u = userEvent.setup();
  open(119);
  await toSurgeon(u);
  const lines = screen.getByRole('region', { name: 'Safety and agreed lines' });
  const rows = within(lines).getAllByRole('row').slice(1);
  expect(rows).toHaveLength(3);                     // the "ask me first" line is not the surgeon's to see
  expect(within(rows[0]).getByText(/imminent risk to my life or to someone else/)).toBeInTheDocument();
  expect(within(rows[0]).getByText(/^Fixed\./)).toBeInTheDocument();
  expect(within(rows[0]).getByText(/Sent on day 98/)).toBeInTheDocument();
  expect(within(rows[1]).getByText(/Sent on day 114/)).toBeInTheDocument();
  expect(within(rows[2]).getByText(/Sent on day 100 · reached Earth 1\d min \d\d s later/)).toBeInTheDocument();
  expect(within(lines).queryByText(/write nothing for 10 days/)).toBeNull();
});

it('reporting a risk tells the medical officer and reaches the surgeon view', async () => {
  const u = userEvent.setup();
  open(60, '#/profile/sharing');
  expect(screen.getByText('Not reported')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Report a risk now' }));
  expect(screen.getByText(/Mei, your crew medical officer, is told now and comes to you\./)).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Tell them now' }));
  expect(screen.getByText('Reported on day 60')).toBeInTheDocument();
  const to = appStore.getState().events.filter(e => e.type === 'safety');
  expect(to).toHaveLength(1);
  await toSurgeon(u);
  const row = within(screen.getByRole('region', { name: 'Safety and agreed lines' })).getAllByRole('row')[1];
  expect(within(row).getByText(/Sent on day 60/)).toBeInTheDocument();
  expect(within(row).getByText(/an imminent risk to self or others was reported on board/)).toBeInTheDocument();
});

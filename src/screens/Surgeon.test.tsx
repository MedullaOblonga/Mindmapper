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
  expect(screen.getByText('Flight surgeon view, on Earth. The diary is not included.')).toBeInTheDocument();
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
  expect(within(rows[2]).getByText(/Sent on day 100 · reached Earth 2 min 02 s later/)).toBeInTheDocument();
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

it('body trends are always open to the flight surgeon, in their voice and without the diary', async () => {
  const u = userEvent.setup();
  open(112);
  await toSurgeon(u);
  const rail = screen.getByRole('navigation', { name: 'Flight surgeon' });
  await u.click(within(rail).getByRole('button', { name: 'Body trends' }));
  expect(screen.getByRole('heading', { name: 'Body trends' })).toBeInTheDocument();
  expect(screen.getByText(/shared with you as routine medical monitoring/)).toBeInTheDocument();
  expect(screen.getAllByRole('img', { name: /last 28 days/ }).length).toBeGreaterThanOrEqual(9);
  const look = screen.getByRole('region', { name: 'Worth a second look' });
  expect(within(look).getByText(/Sleep: .* h\. Outside the NASA line on 3 of the last 5 nights\./)).toBeInTheDocument();
  expect(within(look).queryByRole('button')).toBeNull();          // nothing to send: it is already shared
  const text = document.querySelector('main')!.textContent!;
  expect(text).not.toMatch(/\b[Yy]our\b/);                        // addressed to the surgeon, about the crew member
  for (const s of buildScenario('B').entries.flatMap(e => e.segments)) expect(text).not.toContain(s.text);
  await u.click(within(rail).getByRole('button', { name: 'Received' }));
  expect(screen.getByRole('heading', { name: 'Flight surgeon view' })).toBeInTheDocument();
});

it('the astronaut is told that body trends are shared and the diary is not', () => {
  open(112, '#/patterns/body');
  expect(screen.getByText('Your flight surgeon sees these measures as routine medical monitoring. Your diary is not part of it.')).toBeInTheDocument();
  expect(screen.getByText(/Your diary stays on this device/)).toBeInTheDocument();
});

it('the day 98 chapter is named for the reported risk and opens the journal', async () => {
  const u = userEvent.setup();
  open(112);
  await u.click(screen.getByRole('button', { name: 'Day 98 · Imminent risk reported' }));
  expect(screen.getByRole('heading', { name: 'Your diary' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Safety line' })).toBeInTheDocument();
});

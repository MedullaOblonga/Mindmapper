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

it('shows no alert section and no agreed lines until a line has actually sent a note', async () => {
  const u = userEvent.setup();
  open(60);
  await toSurgeon(u);
  expect(screen.queryByRole('region', { name: 'Safety and agreed lines' })).toBeNull();
  const text = document.querySelector('main')!.textContent!;
  expect(text).not.toMatch(/past midnight|write nothing for 10 days|imminent risk to my life/i);   // uncrossed lines are not mentioned
  expect(text).not.toMatch(/CO2 at my collar/);
  expect(screen.getByRole('group', { name: 'SBAR for day 60' })).toBeInTheDocument();
});

it('day 98: the imminent-risk alert sits on top, short, with the detail folded away', async () => {
  const u = userEvent.setup();
  open(98);
  await toSurgeon(u);
  const alerts = screen.getByRole('region', { name: 'Safety and agreed lines' });
  expect(within(alerts).getByRole('img', { name: 'Imminent-risk alert' })).toBeInTheDocument();
  expect(within(alerts).getByText('Thoughts of self-harm')).toBeInTheDocument();
  expect(within(alerts).getByText('Day 98 · reached Earth 1 min 57 s later')).toBeInTheDocument();
  expect(within(alerts).getByText('Exact note and what was offered on board').closest('details')).not.toHaveAttribute('open');
  const sbar = screen.getByRole('group', { name: 'SBAR for day 98' });
  expect(within(sbar).getByText('Thoughts of self-harm: alert received today.')).toBeInTheDocument();
  expect(within(sbar).getByText('Preset guided CBT and a safety plan were offered on board.')).toBeInTheDocument();
  expect(within(sbar).getByText('Possible thoughts of self-harm, raised by a word check of the diary. Not confirmed.')).toBeInTheDocument();
  expect(within(sbar).getByText(/Confirm with Mei, the crew medical officer/)).toBeInTheDocument();
  expect(document.querySelector('main')!.textContent).not.toContain('better off without me');
});

it('a confirmed negotiable alert is one short row with a cue; older ones fold away', async () => {
  const u = userEvent.setup();
  open(119);
  await toSurgeon(u);
  const alerts = screen.getByRole('region', { name: 'Safety and agreed lines' });
  expect(within(alerts).getByText('Sleep past midnight, 5 nights running')).toBeInTheDocument();
  expect(within(alerts).getByText(/Day 114 · reached Earth/)).toBeInTheDocument();
  expect(within(alerts).getByRole('img', { name: 'Worth a look' })).toBeInTheDocument();
  expect(within(alerts).queryByText(/Automatic note agreed before launch/)).toBeNull();     // the long note is not printed
  expect(within(alerts).queryByText(/Negotiable|Fixed\./)).toBeNull();
  expect(screen.getByText('Earlier alerts (2)')).toBeInTheDocument();                       // day 98 risk and day 100 CO2
});

it('one page: the daily SBAR sits above the body trends, and any of the last 14 days can be picked', async () => {
  const u = userEvent.setup();
  open(112);
  await toSurgeon(u);
  expect(within(screen.getByRole('navigation', { name: 'Flight surgeon' })).getAllByRole('button')).toHaveLength(1);
  const sbar = screen.getByRole('group', { name: 'SBAR for day 112' });
  expect(within(sbar).getByText('2 measures outside their lines: sleep and reaction speed.')).toBeInTheDocument();
  expect(within(sbar).getByText(/Two or more measures have moved together/)).toBeInTheDocument();
  expect(within(sbar).getByText('Protect the sleep period for the next 7 nights.')).toBeInTheDocument();
  expect(screen.getAllByRole('img', { name: /last 28 days/ }).length).toBeGreaterThanOrEqual(9);
  expect(sbar.compareDocumentPosition(screen.getByRole('region', { name: 'Sleep, temperature and reaction speed' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const strip = screen.getByRole('group', { name: 'Last 14 days' });
  expect(within(strip).getAllByRole('button')).toHaveLength(14);
  await u.click(within(strip).getByRole('button', { name: 'Day 104: Imminent-risk alert' }));
  expect(within(screen.getByRole('group', { name: 'SBAR for day 104' })).getByText(/Thoughts of self-harm: alert received 6 days ago\./)).toBeInTheDocument();
  const text = document.querySelector('main')!.textContent!;
  expect(text).not.toMatch(/\b[Yy]our\b/);
  for (const s of buildScenario('B').entries.flatMap(e => e.segments)) expect(text).not.toContain(s.text);
});

it('reporting a risk from the Sharing page reaches the dashboard as a reported alert', async () => {
  const u = userEvent.setup();
  open(60, '#/profile/sharing');
  await u.click(screen.getByRole('button', { name: 'Report a risk now' }));
  await u.click(screen.getByRole('button', { name: 'Tell them now' }));
  expect(screen.getByText('Reported on day 60')).toBeInTheDocument();
  await toSurgeon(u);
  const alerts = screen.getByRole('region', { name: 'Safety and agreed lines' });
  expect(within(alerts).getByText('Reported on board.')).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: 'SBAR for day 60' })).getByText('Risk to self or others, reported on board.')).toBeInTheDocument();
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

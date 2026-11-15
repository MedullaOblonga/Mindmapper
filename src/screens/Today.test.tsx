import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../App';
import { appStore } from '../state/store';

const renderAt = (day: number) => { appStore.setState({ day }); return render(<HashRouter><App /></HashRouter>); };

it('shows the right state on each chapter day', () => {
  const r = renderAt(12);
  expect(screen.getByRole('heading', { name: 'Still learning your usual' })).toBeInTheDocument();
  r.unmount();
  const r2 = renderAt(98);
  expect(screen.getByRole('heading', { name: 'On your usual pattern' })).toBeInTheDocument();
  r2.unmount();
  renderAt(112);
  expect(screen.getByRole('heading', { name: 'Does this match?' })).toBeInTheDocument();
  expect(screen.getByText('1 of 3 this week')).toBeInTheDocument();
});

it('Not-right sheet wording depends on card kind', async () => {
  const u = userEvent.setup();
  renderAt(112);
  await u.click(screen.getByRole('button', { name: 'That’s not right' }));
  expect(screen.getByText('It is accurate, and this is my new usual')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Cancel' }));
  await u.click(screen.getByRole('button', { name: 'Skip for now' }));
  await u.click(screen.getByRole('button', { name: 'That’s not right' }));
  expect(screen.getByText('It is accurate, but it is not a concern right now')).toBeInTheDocument();
});

it('day 42: correcting the card changes the tool', async () => {
  const u = userEvent.setup();
  renderAt(42);
  await u.click(screen.getByRole('button', { name: 'That’s not right' }));
  await u.click(screen.getByLabelText('The data is wrong, or something is missing'));
  await u.click(screen.getByRole('button', { name: 'Tell the tool' }));
  expect(screen.queryByRole('article')).toBeNull();
  expect(screen.getAllByText('It now counts dinners you log from your wrist too.').length).toBeGreaterThan(0);
});

it('day 112: talk to someone writes to the share log', async () => {
  const u = userEvent.setup();
  renderAt(112);
  await u.click(screen.getByRole('button', { name: 'Talk to someone' }));
  const draft = screen.getByLabelText(/Your message/) as HTMLTextAreaElement;
  expect(draft.value).toContain('about a third of my diary');
  const diary = appStore.getState().events.length === 0 ? (await import('../data/scenario')).buildScenario('B').entries.flatMap(e => e.segments).map(s => s.text) : [];
  for (const t of diary) expect(draft.value).not.toContain(t);
  await u.click(screen.getByRole('button', { name: 'Send' }));
  expect(screen.getByText('Share log: 4 shared')).toBeInTheDocument();   // day-98 safety note (medical officer and flight surgeon), day-100 CO2 note, and this one
});

it('skipping all three clears the week', async () => {
  const u = userEvent.setup();
  renderAt(112);
  for (let i = 0; i < 3; i++) await u.click(screen.getByRole('button', { name: 'Skip for now' }));
  expect(screen.queryByRole('heading', { name: 'On your usual pattern' })).toBeNull();
  expect(screen.getByRole('heading', { name: 'Nothing left to look at this week' })).toBeInTheDocument();
  expect(screen.getAllByText(/You skipped 3 cards this week\./).length).toBeGreaterThan(0);
});

it('day 119 with no events shows the agreed-before-launch banner', () => {
  renderAt(119);
  const banner = screen.getByRole('region', { name: 'Agreed before launch' });
  expect(within(banner).getByText(/Automatic note agreed before launch: sleep started after midnight on 5 nights in a row\. No diary content is included\./)).toBeInTheDocument();
});

it('Escape closes a sheet and returns focus to its opener', async () => {
  const u = userEvent.setup();
  renderAt(112);
  const opener = screen.getByRole('button', { name: 'That’s not right' });
  await u.click(opener);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await u.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(opener).toHaveFocus();
});

it('offers one rotating check at a time, with the reaction test among the others', async () => {
  const u = userEvent.setup();
  const r = renderAt(106);
  const panel = screen.getByRole('region', { name: 'Today’s check' });
  expect(within(panel).getByText(/^Why today:/)).toBeInTheDocument();
  await u.click(within(panel).getByRole('button', { name: 'Other checks' }));
  const row = within(panel).getByText('Reaction speed test').closest('li')!;
  await u.click(within(row as HTMLElement).getByRole('button', { name: 'Take now' }));
  expect(screen.getByText('Reaction speed test · day 106 · morning')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Start the test' })).toBeInTheDocument();   // no dials first
  r.unmount();
  window.location.hash = '#/today';
  renderAt(112);
  const p2 = screen.getByRole('region', { name: 'Today’s check' });
  const title = within(p2).getByText(/check$|test$/, { selector: '.t-stmt-sm' }).textContent;
  expect(['Connection check', 'Mood check', 'Sleep check', 'Workload check', 'Reaction speed test']).toContain(title);
  expect(within(p2).getAllByRole('button', { name: /^Start the / })).toHaveLength(1);
});

it('a questionnaire from the rotation is answered and recorded', async () => {
  const u = userEvent.setup();
  window.location.hash = '#/check?kind=connection';
  render(<HashRouter><App /></HashRouter>);
  const save = screen.getByRole('button', { name: 'Save' });
  expect(save).toBeDisabled();
  for (const g of screen.getAllByRole('radiogroup')) await u.click(within(g).getAllByRole('radio')[0]);
  await u.click(save);
  expect(screen.getByRole('heading', { name: 'Recorded.' })).toBeInTheDocument();
  expect(appStore.getState().events.some(e => e.type === 'questionnaire' && e.kind === 'connection')).toBe(true);
});

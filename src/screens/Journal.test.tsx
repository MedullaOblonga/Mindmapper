import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../App';
import { appStore } from '../state/store';
import { buildView } from '../state/view';
import { weekCounts } from '../logic/shares';

const open = () => { window.location.hash = '#/journal'; return render(<HashRouter><App /></HashRouter>); };

it('save is disabled when blank, tags the entry, and corrections stick', async () => {
  const u = userEvent.setup();
  open();
  const save = screen.getByRole('button', { name: 'Save entry' });
  expect(save).toBeDisabled();
  await u.type(screen.getByLabelText(/private diary/i), '   ');
  expect(save).toBeDisabled();
  const before = weekCounts(buildView(112, appStore.getState().events, null).entries, 16).home;
  await u.clear(screen.getByLabelText(/private diary/i));
  await u.type(screen.getByLabelText(/private diary/i), 'Sam sent a lovely letter from home.');
  await u.click(save);
  const panel = screen.getByRole('region', { name: 'How the tool read it' });
  expect(within(panel).getByText(/Sam sent a lovely letter from home/)).toBeInTheDocument();
  expect(weekCounts(buildView(112, appStore.getState().events, null).entries, 16).home).toBe(before + 1);
  expect(within(panel).getByText('Guessed. Tap to correct.')).toBeInTheDocument();
  const hard = within(panel).getByRole('button', { name: 'Difficult' });
  await u.click(hard);
  expect(within(panel).getByRole('button', { name: 'Difficult' })).toHaveAttribute('aria-pressed', 'true');
  expect(within(panel).queryByText('Guessed. Tap to correct.')).toBeNull();
});

it('hides Speak when the browser has no speech recognition', () => {
  open();
  expect(screen.queryByRole('button', { name: 'Speak' })).toBeNull();
});

it('long text with no keywords saves as Uncategorised', async () => {
  const u = userEvent.setup();
  open();
  const ta = screen.getByLabelText(/private diary/i);
  await u.click(ta);
  await u.paste('Zxqv blorp. '.repeat(400));
  await u.click(screen.getByRole('button', { name: 'Save entry' }));
  const panel = screen.getByRole('region', { name: 'How the tool read it' });
  expect(within(panel).getByRole('button', { name: /Topic: Other/ })).toBeInTheDocument();
  expect(within(panel).getByText('How did this one feel?')).toBeInTheDocument();
});

it('the day card flips to the next part, and presses fill in how it felt', async () => {
  const u = userEvent.setup();
  open();
  const region = screen.getByRole('region', { name: 'Rebuild your day' });
  const card = within(region).getByRole('article');
  expect(card).toHaveAccessibleName(/^Suit prep, 08:00 to 13:00\. Part 3 of 10/);
  expect(within(card).getByRole('button', { name: 'Difficult' })).toHaveAttribute('aria-pressed', 'true');
  expect(within(card).getByText('From your wrist presses. Tap to correct.')).toBeInTheDocument();
  expect(within(region).queryByRole('button', { name: 'Write about this' })).toBeNull();
  await u.click(card);
  expect(within(region).getByRole('article')).toHaveAccessibleName(/^Lunch, 13:00 to 14:00\. Part 4 of 10/);
});

it('activity tabs above the entry box insert the activity and its time', async () => {
  const u = userEvent.setup();
  open();
  const acts = screen.getByRole('group', { name: 'Insert an activity' });
  await u.click(within(acts).getByRole('button', { name: 'Suit prep' }));
  expect((screen.getByLabelText(/private diary/i) as HTMLTextAreaElement).value).toBe('During suit prep (08:00 to 13:00): ');
});

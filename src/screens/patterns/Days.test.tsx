import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../../App';
import { appStore } from '../../state/store';

it('day 112 rebuilds the day from the plan and the wearable', async () => {
  const u = userEvent.setup();
  window.location.hash = '#/patterns/days';
  render(<HashRouter><App /></HashRouter>);
  const list = screen.getByRole('list', { name: 'Parts of the day' });
  const items = within(list).getAllByRole('listitem').filter(i => i.tagName === 'ARTICLE');
  expect(items.map(i => within(i).getByRole('heading').textContent)).toEqual(['Sleep', 'Free time', 'Suit prep', 'Lunch', 'Free time', 'Experiments', 'Free time', 'Gym', 'Call with Sam', 'Free time']);
  expect(within(items[0]).getByText('00:42 to 06:40. From your wearable')).toBeInTheDocument();
  expect(screen.getByText('You pressed low at 10:47 during Suit prep. Start there?')).toBeInTheDocument();
  expect(screen.getByText('Evenings felt hard on 5 of the last 7 days. Mornings mostly did not.')).toBeInTheDocument();
  await u.click(within(items[7]).getByRole('button', { name: 'Hard' }));
  expect(appStore.getState().events.some(e => e.type === 'block-felt')).toBe(true);
  await u.click(screen.getByRole('button', { name: 'Next part of the day' }));
  expect(screen.getByText(/^\d+ of 10$/)).toBeInTheDocument();
});

it('high and low tab shows counts against the usual', () => {
  window.location.hash = '#/patterns/moments';
  render(<HashRouter><App /></HashRouter>);
  expect(screen.getByText(/Your usual week: 14 high, 7 low\./)).toBeInTheDocument();
});

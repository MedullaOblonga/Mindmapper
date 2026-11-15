import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../../App';

it('profile opens on About you, and lines can be changed and removed', async () => {
  const u = userEvent.setup();
  window.location.hash = '#/plan/signs';
  render(<HashRouter><App /></HashRouter>);
  expect(window.location.hash).toBe('#/profile/signs');
  await u.click(screen.getByRole('button', { name: 'Profile' }));
  expect(screen.getByRole('heading', { name: 'About you' })).toBeInTheDocument();
  const comms = screen.getByRole('region', { name: 'How you like to communicate' });
  await u.click(within(comms).getByRole('button', { name: 'Change: Prefers to be asked, not told.' }));
  const field = within(comms).getByLabelText('Edit this line');
  await u.clear(field); await u.type(field, 'Ask me once, then let it go.');
  await u.click(within(comms).getByRole('button', { name: 'Save' }));
  expect(within(comms).getByText('Ask me once, then let it go.')).toBeInTheDocument();
  expect(within(comms).getByText('Changed by you')).toBeInTheDocument();
  await u.click(within(comms).getByRole('button', { name: 'Remove: Point first, detail after. Short sentences.' }));
  expect(within(comms).queryByText('Point first, detail after. Short sentences.')).toBeNull();
});

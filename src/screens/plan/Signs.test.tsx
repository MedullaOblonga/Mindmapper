import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../../App';
import { appStore } from '../../state/store';

it('day 112 signs', async () => {
  const u = userEvent.setup();
  window.location.hash = '#/profile/signs';
  render(<HashRouter><App /></HashRouter>);
  const list = screen.getByRole('region', { name: 'Your signs' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(6);
  expect(within(list).getByRole('button', { pressed: true })).toHaveTextContent('I stay up past midnight three nights running.');
  expect(screen.getByText('Showed up on days 109, 110 and 111.')).toBeInTheDocument();
  expect(screen.getByText('At 5 nights, your flight surgeon is told it happened, not what you wrote. At 3 now.')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Start step 1 tonight' }));
  expect(appStore.getState().events.some(e => e.type === 'reminder')).toBe(true);
});

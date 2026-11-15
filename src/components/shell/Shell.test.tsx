import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../../App';

it('renders the three navigation regions', () => {
  render(<HashRouter><App /></HashRouter>);
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Demo story' })).toBeInTheDocument();
  expect(screen.getByText(/Stays on this device/)).toBeInTheDocument();
  expect(screen.getByText(/^STARDATE 473\d\d\.\d$/)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Mission day 112 of 520/ })).toBeInTheDocument();
  expect(screen.getByTitle(/One-way light time/)).toHaveTextContent(/Delay to Earth 2 min \d\d s one way/);
});

it('the bedtime light shows at the bunk near bedtime with no entry, and goes on writing', async () => {
  const { useClockStore } = await import('../../state/clock');
  const { default: userEvent } = await import('@testing-library/user-event');
  const u = userEvent.setup();
  render(<HashRouter><App /></HashRouter>);
  expect(screen.queryByRole('status')).toBeNull();
  await u.click(screen.getByRole('button', { name: 'At the bunk' }));
  expect(useClockStore.getState().atBunk).toBe(true);
  expect(screen.getByRole('status')).toHaveTextContent('Near your usual bedtime (23:10)');
  await u.click(screen.getByRole('button', { name: 'Write now' }));
  expect(window.location.hash).toBe('#/journal');
});
it('the wrist has a high and a low button', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const { appStore } = await import('../../state/store');
  const u = userEvent.setup();
  render(<HashRouter><App /></HashRouter>);
  await u.click(screen.getByRole('button', { name: 'Low moment' }));
  const ev = appStore.getState().events.find(e => e.type === 'mark');
  expect(ev && ev.type === 'mark' && ev.mood).toBe('low');
  expect(screen.queryByLabelText('Wrist device')).toBeNull();
});

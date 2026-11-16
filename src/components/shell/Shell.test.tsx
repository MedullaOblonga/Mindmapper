import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../../App';

it('renders the three navigation regions', () => {
  render(<HashRouter><App /></HashRouter>);
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Demo story' })).toBeInTheDocument();
  expect(screen.getByText(/Your diary stays on this device/)).toBeInTheDocument();
  expect(screen.getByText(/^STARDATE 473\d\d\.\d$/)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Mission day 112 of 520/ })).toBeInTheDocument();
  expect(screen.getByTitle(/One-way light time/)).toHaveTextContent(/Delay to Earth 2 min \d\d s one way/);   // day 112: about 47 million km from Earth
});

it('a light at the top pulses until today is recorded', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const u = userEvent.setup();
  render(<HashRouter><App /></HashRouter>);
  expect(screen.getByRole('status')).toHaveTextContent('Today is not recorded yet');
  expect(screen.queryByRole('button', { name: 'At the bunk' })).toBeNull();
  await u.click(screen.getByRole('button', { name: /Today is not recorded yet/ }));
  expect(window.location.hash).toBe('#/journal');
  await u.type(screen.getByLabelText(/private diary/i), 'Long day of suit prep.');
  await u.click(screen.getByRole('button', { name: 'Save entry' }));
  expect(screen.queryByRole('status')).toBeNull();
});
it('the wrist has a high and a low button', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const { appStore } = await import('../../state/store');
  const u = userEvent.setup();
  render(<HashRouter><App /></HashRouter>);
  expect(screen.getByRole('group', { name: 'Simulated wrist device' })).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Low moment' }));
  const ev = appStore.getState().events.find(e => e.type === 'mark');
  expect(ev && ev.type === 'mark' && ev.mood).toBe('low');
  expect(screen.queryByLabelText('Wrist device')).toBeNull();
});

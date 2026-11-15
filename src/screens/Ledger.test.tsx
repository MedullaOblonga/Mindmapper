import { render, screen, within } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../App';
import { appStore } from '../state/store';

const open = (day: number) => { appStore.setState({ day }); window.location.hash = '#/today'; return render(<HashRouter><App /></HashRouter>); };

it('day 112 ledger', () => {
  open(112);
  expect(screen.getByRole('heading', { name: 'This week, against your usual' })).toBeInTheDocument();
  expect(screen.getByText('5h 58m a night. Below your usual 7h 10m.')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'Away from your usual' })).getByText('Dinners with crew')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'At or near your usual' })).getByText('Gym')).toBeInTheDocument();
  const text = screen.getByRole('region', { name: 'This week, against your usual' }).textContent!;
  expect(text).not.toMatch(/refuel|refill|drawing/i);
  expect(text).not.toMatch(/\b(sum|total)\b/i);
});

it('day 10 ledger has no usual yet', () => {
  open(10);
  expect(screen.getByText('Your usual appears after day 14.')).toBeInTheDocument();
});

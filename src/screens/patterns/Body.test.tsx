import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../../App';
import { appStore } from '../../state/store';

const open = (day: number) => { appStore.setState({ day }); window.location.hash = '#/patterns/body'; return render(<HashRouter><App /></HashRouter>); };

it('shows measured things only, each with a chart', () => {
  open(112);
  expect(screen.getByRole('button', { name: 'Body trends' })).toHaveAttribute('aria-current', 'page');
  for (const n of ['Sleep', 'Reaction speed', 'Resting heart rate', 'Body mass', 'CO2 around you, awake', 'CO2 around you, asleep'])
    expect(screen.getByRole('region', { name: n })).toBeInTheDocument();
  expect(screen.getAllByRole('img', { name: /last 28 days/ })).toHaveLength(10);
  const text = document.querySelector('main')!.textContent!;
  expect(text).not.toMatch(/\b(mood|stress|fatigue)\b/i);
  expect(text).not.toMatch(/cabin CO2/i);
});

it('day 112: sleep and reaction speed are worth a second look and can be sent, edited first', async () => {
  const u = userEvent.setup();
  open(112);
  const look = screen.getByRole('region', { name: 'Worth a second look' });
  expect(within(look).getByText(/Sleep: .* h\. Outside the NASA line on 3 of the last 5 nights\./)).toBeInTheDocument();
  expect(within(look).getByText(/Reaction speed: 3\.56 per s\. Outside the NASA line on 2 of the last 2 tests\./)).toBeInTheDocument();
  await u.click(within(look).getByRole('button', { name: 'Crew medical officer' }));
  expect((screen.getByLabelText(/Your message/) as HTMLTextAreaElement).value).toMatch(/^Body trends, day 112\. Sleep: latest/);
});

it('filters by system and switches to a table', async () => {
  const u = userEvent.setup();
  open(101);
  await u.click(screen.getByRole('button', { name: 'Air' }));
  expect(screen.getAllByRole('img', { name: /last 28 days/ })).toHaveLength(2);
  expect(screen.getByText('Outside the NASA limit on 2 of the last 2 nights')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Show as table' }));
  expect(screen.getByRole('region', { name: 'Last 7 days as a table' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Day 101' })).toBeInTheDocument();
});

it('names where every line comes from', () => {
  open(60);
  const src = screen.getByRole('region', { name: 'Where each line comes from' });
  expect(within(src).getByText(/8% or more below your usual on two tests in a row\./)).toBeInTheDocument();
  expect(within(src).getAllByText('Line from NASA data').length).toBe(3);
  expect(within(src).getAllByText('Clinical limit').length).toBe(3);
  expect(within(src).getByText(/28 healthy volunteers took 141 tests/)).toBeInTheDocument();
});

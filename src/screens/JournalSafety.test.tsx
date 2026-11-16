import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../App';
import { appStore } from '../state/store';

const open = (day: number, hash: string) => { appStore.setState({ day }); window.location.hash = hash; return render(<HashRouter><App /></HashRouter>); };

it('journal, day 98: the entry is marked and the notice shows what was sent and what helps', () => {
  open(98, '#/journal');
  const notice = screen.getByRole('region', { name: 'Safety line' });
  expect(within(notice).getByText('Something you wrote on day 98 matched the safety line for risk to yourself or to others.')).toBeInTheDocument();
  expect(within(notice).getByText(/a diary entry on day 98 matched the safety line.*No diary content is included\./)).toBeInTheDocument();
  expect(within(notice).getByText(/Mei, the crew medical officer, comes to talk now/)).toBeInTheDocument();
  expect(within(notice).getByText(/From your own list: greenhouse time, 15 minutes/)).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'How the tool read it' })).getByText('Matched the safety line')).toBeInTheDocument();
  expect(notice.textContent).not.toContain('better off without me');
});

it('the astronaut can add their own words, which reach the flight surgeon view', async () => {
  const u = userEvent.setup();
  open(98, '#/journal');
  await u.click(screen.getByRole('button', { name: 'Add your own words for the flight surgeon' }));
  const draft = screen.getByLabelText(/Your message/) as HTMLTextAreaElement;
  expect(draft.value).toBe('About the safety note sent on day 98: ');
  await u.type(draft, 'I was worn out. Mei and I have talked.');
  await u.click(screen.getByRole('button', { name: 'Send' }));
  await u.click(screen.getByRole('switch', { name: 'Flight surgeon view' }));
  const alerts = screen.getByRole('region', { name: 'Safety and agreed lines' });
  expect(within(alerts).getByText('Imminent risk to self or others')).toBeInTheDocument();
  expect(within(alerts).getByText(/Day 98 · reached Earth/)).toBeInTheDocument();
  expect(within(alerts).getByText('Diary word check. Not confirmed.')).toBeInTheDocument();
  expect(within(alerts).getByText(/Mei, the crew medical officer, comes to talk now/)).toBeInTheDocument();   // inside the fold
  expect(within(screen.getByRole('region', { name: 'Sent by the crew member' })).getByText(/I was worn out\. Mei and I have talked\./)).toBeInTheDocument();
  expect(document.querySelector('main')!.textContent).not.toContain('better off without me');
});

it('sharing, day 98: the fixed line reads crossed and the note is in the share log', () => {
  open(98, '#/profile/sharing');
  expect(screen.getByText('Crossed on day 98')).toBeInTheDocument();
  const log = screen.getByRole('region', { name: 'Share log' });
  expect(within(log).getAllByText(/a diary entry on day 98 matched the safety line/)).toHaveLength(2);   // medical officer and flight surgeon
});

it('today shows the notice for 7 days, then goes quiet again', () => {
  const r = open(98, '#/today');
  expect(screen.getByRole('region', { name: 'Safety line' })).toBeInTheDocument();
  r.unmount();
  open(105, '#/today');
  expect(screen.queryByRole('region', { name: 'Safety line' })).toBeNull();
});

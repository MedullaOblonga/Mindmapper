import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../../App';
import { appStore } from '../../state/store';
import { buildView } from '../../state/view';

it('sharing shows three levels and logs rule changes', async () => {
  const u = userEvent.setup();
  window.location.hash = '#/profile/sharing';
  render(<HashRouter><App /></HashRouter>);
  for (const n of ['Most weeks: nothing', 'When you choose: a message you approve']) expect(screen.getByRole('heading', { name: n })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Lines you set before launch' })).toBeInTheDocument();
  expect(screen.getByText('“Automatic note agreed before launch: sleep started after midnight on 5 nights in a row. No diary content is included.”')).toBeInTheDocument();
  await u.click(screen.getAllByRole('button', { name: 'Change this rule' })[0]);
  await u.click(screen.getByRole('button', { name: 'Raise the threshold' }));
  await u.click(screen.getByRole('button', { name: 'Save' }));
  const log = buildView(112, appStore.getState().events, null).shareLog;
  expect(log[0].text.startsWith('Rule changed on day')).toBe(true);
  expect(log[0].text).toContain('6 nights');
});

it('about lists the claims, AI use, and resets', async () => {
  const u = userEvent.setup();
  appStore.getState().add({ type: 'dismiss', what: 'tonight' });
  window.location.hash = '#/about';
  render(<HashRouter><App /></HashRouter>);
  for (const t of ['It does not diagnose anything or detect any condition.', 'It does not prevent anything. It helps you notice a change early and choose what to do.',
    'It has not been tested on astronauts or in an analog mission.', 'Its thresholds are placeholders. NASA lists validated thresholds as an open research gap.',
    'It is not NASA software, and the attention test is modelled on PVT-B, not the licensed test.', 'A handful of “what followed” records cannot show that a coping task works.'])
    expect(screen.getByText(t)).toBeInTheDocument();
  expect(screen.getByText(/Built with AI assistance \(Claude\)\./)).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Reset the demo' }));
  expect(appStore.getState().events).toEqual([]);
});

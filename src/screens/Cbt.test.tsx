import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../App';
import { appStore } from '../state/store';
import { buildView } from '../state/view';
import { buildScenario } from '../data/scenario';
import { THOUGHTS, planParts, planText } from '../data/cbt';
import { concernIn } from '../logic/safety';
import { surgeonLog } from '../logic/lines';

const open = (day: number, hash: string) => { appStore.setState({ day }); window.location.hash = hash; return render(<HashRouter><App /></HashRouter>); };
const rate = async (u: ReturnType<typeof userEvent.setup>, group: RegExp, n: number) => u.click(within(screen.getByRole('radiogroup', { name: group })).getAllByRole('radio')[n]);

it('the word check tells thoughts of self-harm from harm to others', () => {
  expect(concernIn('They would be better off without me.')).toBe('self');
  expect(concernIn('I could hurt someone.')).toBe('others');
  expect(concernIn('I might hurt myself, or hurt someone.')).toBe('self');
  expect(concernIn('Long day on the pump.')).toBeNull();
});

it('every preset line is fixed text, and none of it is alarming or about method', () => {
  const all = [...THOUGHTS.flatMap(t => [t.text, ...t.balance]), ...planParts(buildScenario('B').profile).flatMap(p => [p.title, p.hint, ...p.options])];
  expect(all.length).toBeGreaterThan(40);
  for (const t of all) expect(t, t).not.toMatch(/\b(kill|suicid|die|dead|method|overdose|cut)\w*/i);
  expect(THOUGHTS.every(t => t.balance.length === 3)).toBe(true);
});

it('the safety plan has the six Stanley and Brown parts plus a reason, filled from the pre-launch profile', () => {
  const parts = planParts(buildScenario('B').profile);
  expect(parts.map(p => p.id)).toEqual(['signs', 'alone', 'company', 'ask', 'pros', 'space', 'reason']);
  expect(parts[0].options).toContain('I stop going to the greenhouse.');
  expect(parts[1].options).toContain('Greenhouse time');
  expect(parts[2].options).toContain('Chess with Ravi');
  expect(parts[3].options.slice(0, 2)).toEqual(['Mei', 'Ana']);
  expect(planText({ thought: 'x', balance: [], parts: { ask: ['Mei'] } }, parts)).toBe('My safety plan.\nPeople I can ask for help: Mei.');
});

it('Today offers guided CBT on day 98, and the steps run start to finish without leaving the device', async () => {
  const u = userEvent.setup();
  open(98, '#/today');
  const notice = screen.getByRole('region', { name: 'Safety line' });
  expect(within(notice).getByText('About 10 minutes. Preset steps, written in advance. No AI.')).toBeInTheDocument();
  await u.click(within(notice).getByRole('button', { name: 'Start guided CBT' }));
  expect(screen.getByRole('heading', { name: 'A guided way through this' })).toBeInTheDocument();
  expect(screen.getByText('Every word here was written in advance. No AI writes or answers anything.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'I need Mei now' })).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Start' }));

  await rate(u, /How strong are the thoughts/, 6);
  await rate(u, /keep yourself safe/, 6);
  expect(screen.queryByRole('status')).toBeNull();
  await u.click(screen.getByRole('button', { name: 'Next' }));
  await u.click(screen.getByRole('button', { name: 'Skip' }));                                  // breathing can be skipped
  await u.click(screen.getByRole('radio', { name: 'They would be better off without me.' }));
  await u.click(screen.getByRole('button', { name: 'Next' }));
  await u.click(screen.getByRole('button', { name: 'The people who love me would not agree with this thought.' }));
  await u.click(screen.getByRole('button', { name: 'Next' }));
  await u.click(within(screen.getByRole('region', { name: 'People I can ask for help' })).getByRole('button', { name: 'Mei' }));
  await u.click(within(screen.getByRole('region', { name: 'One reason to keep going' })).getByRole('button', { name: 'Sam' }));
  await u.click(screen.getByRole('button', { name: 'Next' }));
  await rate(u, /How strong are the thoughts/, 4);
  await rate(u, /keep yourself safe/, 8);
  await u.click(screen.getByRole('button', { name: 'Finish' }));

  expect(screen.getByRole('heading', { name: 'Done. Your plan is saved.' })).toBeInTheDocument();
  expect(screen.getByText('The thoughts: 6 then, 4 now. Able to stay safe: 6 then, 8 now.')).toBeInTheDocument();
  const ev = appStore.getState().events.find(e => e.type === 'cbt');
  expect(ev).toMatchObject({ before: { thoughts: 6, safe: 6 }, after: { thoughts: 4, safe: 8 }, plan: { thought: 'They would be better off without me.', parts: { ask: ['Mei'], reason: ['Sam'] } } });
  const v = buildView(98, appStore.getState().events, null);
  expect(v.shareLog.filter(e => e.kind === 'message')).toEqual([]);                             // nothing was shared by doing the steps
  expect(JSON.stringify(surgeonLog(v.shareLog))).not.toContain('better off');

  await u.click(screen.getByRole('button', { name: 'Back to Today' }));
  expect(within(screen.getByRole('region', { name: 'Safety line' })).getByRole('button', { name: 'Open my plan' })).toBeInTheDocument();
});

it('a high first check-in points to a person before any more steps', async () => {
  const u = userEvent.setup();
  open(98, '#/cbt');
  await u.click(screen.getByRole('button', { name: 'Start' }));
  await rate(u, /How strong are the thoughts/, 9);
  await rate(u, /keep yourself safe/, 5);
  expect(screen.getByRole('status')).toHaveTextContent('That is a lot to carry alone. Go to Mei now');
  await u.click(screen.getByRole('button', { name: 'I need Mei now' }));
  const log = buildView(98, appStore.getState().events, null).shareLog;
  expect(log.some(e => e.to === 'Crew medical officer (Mei)' && e.text === 'I need you now.')).toBe(true);
  expect(surgeonLog(log).some(e => e.text === 'I need you now.')).toBe(false);
});

it('sharing the plan is the astronaut’s choice and goes to the crew medical officer only', async () => {
  const u = userEvent.setup();
  appStore.setState({ day: 98 });
  appStore.getState().add({ type: 'cbt', before: { thoughts: 6, safe: 6 }, after: { thoughts: 4, safe: 8 }, plan: { thought: 'This will never change.', balance: [], parts: { ask: ['Mei'] } } });
  open(98, '#/cbt');
  expect(screen.getByRole('heading', { name: 'Your plan' })).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Share my plan with Mei' }));
  const log = buildView(98, appStore.getState().events, null).shareLog;
  expect(log.find(e => e.kind === 'message')).toMatchObject({ to: 'Crew medical officer (Mei)', text: 'My safety plan.\nPeople I can ask for help: Mei.' });
  expect(surgeonLog(log).filter(e => e.kind === 'message')).toEqual([]);
});

it('real astronaut journals are never run through the self-harm word check', () => {
  for (const src of ['williams', 'anderson'] as const) {
    const last = buildView(250, [], null, src);
    expect(last.shareLog.filter(e => e.fixed), src).toEqual([]);
    // even if a published sentence happened to match, it would not be checked: only entries typed by the user are
    const typed = { id: 'u5', day: 5, origin: 'user' as const, segments: [{ id: 'u5-s1', day: 5, text: 'I wish I were dead.', category: 'Adjustment', group: 'self' as const, felt: null, feltBy: 'tool' as const, origin: 'user' as const }] };
    const withTyped = buildView(5, [{ id: 'e1', day: 5, type: 'entry', entry: typed }], null, src);
    expect(withTyped.shareLog.filter(e => e.fixed).length, src).toBe(2);
  }
});

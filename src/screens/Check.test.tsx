import { act, fireEvent, render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../App';
import { appStore } from '../state/store';

const FAKE = { toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'] as const };

function openToTest() {
  window.location.hash = '#/check?slot=pm';
  render(<HashRouter><App /></HashRouter>);
  const next = screen.getByRole('button', { name: 'Next' });
  expect(next).toBeDisabled();
  for (const g of ['Stress', 'Sleepiness', 'How heavy was today’s work?']) {
    const group = screen.getByRole('radiogroup', { name: g });
    fireEvent.click(group.querySelectorAll('button')[3]);
    if (g !== 'How heavy was today’s work?') expect(next).toBeDisabled();
  }
  expect(next).toBeEnabled();
  fireEvent.click(next);
  fireEvent.click(screen.getByRole('button', { name: 'Start the test' }));
  return screen.getByRole('button', { name: /Tap here or press Space/ });
}

beforeEach(() => vi.useFakeTimers({ toFake: [...FAKE.toFake] }));
afterEach(() => vi.useRealTimers());

it('a tap before the counter shows "Too early", held keys are ignored', () => {
  const box = openToTest();
  fireEvent.pointerDown(box);
  expect(box).toHaveTextContent('Too early');
  act(() => { vi.advanceTimersByTime(1100); });
  fireEvent.keyDown(document, { key: ' ', code: 'Space', repeat: true });
  expect(box).not.toHaveTextContent('Too early');
});

it('leaving the tab ends the test without recording', () => {
  openToTest();
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  expect(screen.getByText('Interrupted. Not recorded.')).toBeInTheDocument();
  expect(appStore.getState().events.some(e => e.type === 'check')).toBe(false);
});

it('a completed 30-second run is recorded as demo length', () => {
  const box = openToTest();
  act(() => { vi.advanceTimersByTime(4100); });
  expect(box.textContent).toMatch(/^\d+$/);
  act(() => { vi.advanceTimersByTime(250); });
  fireEvent.keyDown(document, { key: ' ', code: 'Space' });
  act(() => { vi.advanceTimersByTime(27000); });
  expect(screen.getByText('Demo length. A 30-second run is too short to judge; the flight version is 3 minutes.')).toBeInTheDocument();
  const ev = appStore.getState().events.find(e => e.type === 'check');
  expect(ev && ev.type === 'check' && ev.session.counts).toBe(false);
  expect(ev && ev.type === 'check' && ev.session.trials).toBeGreaterThanOrEqual(1);
});

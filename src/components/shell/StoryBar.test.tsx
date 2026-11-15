import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import App from '../../App';
import { appStore } from '../../state/store';
import { shareWords } from '../../logic/words';

it('chapter chip sets the day, route and caption', async () => {
  const u = userEvent.setup();
  window.location.hash = '#/journal';
  render(<HashRouter><App /></HashRouter>);
  await u.click(screen.getByRole('button', { name: 'Day 42 · It gets one wrong' }));
  expect(appStore.getState().day).toBe(42);
  expect(window.location.hash).toBe('#/today');
  expect(screen.getByText('The mission timeline missed three dinners, so the tool says something untrue. You correct it in two taps, and it changes.')).toBeInTheDocument();
});

it('share words pick the nearest fraction', () => {
  expect([10, 20, 25, 33, 50, 67].map(shareWords)).toEqual(['about a tenth', 'about a fifth', 'about a quarter', 'about a third', 'about half', 'about two thirds']);
  expect(shareWords(31)).toBe('about a third'); expect(shareWords(12)).toBe('about a tenth');
});

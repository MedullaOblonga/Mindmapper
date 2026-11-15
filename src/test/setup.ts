import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { appStore } from '../state/store';
import { resetUI } from '../state/ui';
import { resetClock } from '../state/clock';

beforeEach(() => {
  appStore.setState({ day: 112, events: [], branchOverride: null, storyHidden: false });
  resetUI();
  resetClock();
  window.location.hash = '#/today';
});
afterEach(() => { cleanup(); try { localStorage.clear(); } catch { /* ignore */ } });

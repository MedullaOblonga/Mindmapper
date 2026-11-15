import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { appStore } from '../state/store';
import { resetUI } from '../state/ui';

beforeEach(() => {
  appStore.setState({ day: 112, events: [], branchOverride: null, storyHidden: false });
  resetUI();
  window.location.hash = '#/today';
});
afterEach(() => { cleanup(); try { localStorage.clear(); } catch { /* ignore */ } });

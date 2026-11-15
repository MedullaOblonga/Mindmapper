import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../../App';

it('renders the three navigation regions', () => {
  render(<HashRouter><App /></HashRouter>);
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Demo story' })).toBeInTheDocument();
  expect(screen.getByText(/Stays on this device/)).toBeInTheDocument();
  expect(screen.getByText('MISSION DAY 112 OF 520', { exact: false })).toBeInTheDocument();
});

import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Mock @vercel/analytics
jest.mock('@vercel/analytics/react');

test('renders app without crashing', () => {
  render(<App />);
  // Basic test to ensure app renders
  expect(true).toBe(true);
});

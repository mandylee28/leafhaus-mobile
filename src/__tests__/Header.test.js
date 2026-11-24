// Component tests for the shared Header (src/Header.js): the fixed top
// bar with a back button and a centered title, used on every screen
// except Menu.
// The Header reads navigation with the useNavigation hook, so the test
// replaces that hook with a fake navigation object — no real navigator
// is needed. Run them with: npm test

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockGoBack = jest.fn();

// Fake navigation: goBack is a jest.fn, so the test can check it was called.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
}));

import Header from '../Header';

beforeEach(() => {
  mockGoBack.mockClear();
});

describe('Header', () => {
  // The title prop is shown in the middle of the bar.
  test('renders the given title', () => {
    render(<Header title="Customise Drink" />);
    expect(screen.getByText('Customise Drink')).toBeOnTheScreen();
  });

  // The back button is always there, on the left of the bar.
  test('renders the back button', () => {
    render(<Header title="My Orders" />);
    expect(screen.getByText('‹ Back')).toBeOnTheScreen();
  });

  // Tapping back goes back — the Header itself does not decide where to.
  test('pressing back calls navigation.goBack', () => {
    render(<Header title="Your Cart" />);
    fireEvent.press(screen.getByText('‹ Back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

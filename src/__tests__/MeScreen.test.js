// Component tests for the Me tab (src/screens/MeScreen.js): membership,
// account figures, the market sheet (Malaysia and Singapore only) and
// the Help Centre.
// The screen reads the market from context and the orders from
// ../orders, so both are faked here — the test checks what the screen
// shows and what it asks the market to do, not the real orders or
// device storage. Run them with: npm test

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MARKETS } from '../data';

const mockSetMarket = jest.fn();
const mockFetchOrders = jest.fn();

// The market for the current test: Malaysia unless a test switches it.
let mockMarket = MARKETS[0];

// Fake market: the screen reads the market and calls setMarket.
jest.mock('../market', () => ({
  useMarket: () => ({ market: mockMarket, setMarket: mockSetMarket }),
}));

// Fake order store: the wrapper reads mockFetchOrders when called, not
// when the mock is registered (imports are hoisted above it), so
// returning the fn directly here would freeze it as undefined.
jest.mock('../orders', () => ({
  fetchOrders: (...args) => mockFetchOrders(...args),
}));

import MeScreen from '../screens/MeScreen';

beforeEach(() => {
  mockSetMarket.mockClear();
  mockFetchOrders.mockClear();
  mockFetchOrders.mockResolvedValue([]);
  mockMarket = MARKETS[0];
});

describe('MeScreen', () => {
  // The profile is a guest, and the market button shows Malaysia.
  // "Leafhaus Friend" appears twice — the profile line and the card —
  // so both are checked together.
  test('shows the guest profile and the Malaysia market', async () => {
    render(<MeScreen />);
    expect(screen.getByText('Guest')).toBeOnTheScreen();
    expect(screen.getAllByText('Leafhaus Friend')).toHaveLength(2);
    await waitFor(() => expect(mockFetchOrders).toHaveBeenCalled());
    expect(screen.getByText('Malaysia')).toBeOnTheScreen();
  });

  // Tea Leaves add up from the saved orders (2 x 15 = 30), and the
  // account row shows the wallet, the leaves and the voucher count.
  test('adds up Tea Leaves from the saved orders', async () => {
    mockFetchOrders.mockResolvedValue([{ leaves: 15 }, { leaves: 15 }]);
    render(<MeScreen />);
    expect(await screen.findByText('30 Tea Leaves')).toBeOnTheScreen();
    expect(
      screen.getByText('2 orders so far · 15 leaves per order.')
    ).toBeOnTheScreen();
    expect(screen.getByText('30')).toBeOnTheScreen();
    expect(screen.getByText('0.00')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  // One order reads as a single order, not "1 orders".
  test('one order reads as a single order', async () => {
    mockFetchOrders.mockResolvedValue([{ leaves: 15 }]);
    render(<MeScreen />);
    expect(
      await screen.findByText('1 order so far · 15 leaves per order.')
    ).toBeOnTheScreen();
  });

  // An order without a leaves figure counts as zero leaves.
  test('an order without leaves counts as zero', async () => {
    mockFetchOrders.mockResolvedValue([{ leaves: 15 }, {}]);
    render(<MeScreen />);
    expect(await screen.findByText('15 Tea Leaves')).toBeOnTheScreen();
    expect(
      screen.getByText('2 orders so far · 15 leaves per order.')
    ).toBeOnTheScreen();
  });

  // With no orders yet, the card invites the first order.
  test('no orders shows the first-order hint', async () => {
    render(<MeScreen />);
    expect(
      await screen.findByText('Place your first order to earn Tea Leaves.')
    ).toBeOnTheScreen();
  });

  // When the orders cannot be loaded, the figures stay at zero.
  test('keeps zeros when the orders cannot be loaded', async () => {
    mockFetchOrders.mockRejectedValueOnce(new Error('db down'));
    render(<MeScreen />);
    await waitFor(() => expect(mockFetchOrders).toHaveBeenCalled());
    expect(screen.getByText('0 Tea Leaves')).toBeOnTheScreen();
    expect(
      screen.getByText('Place your first order to earn Tea Leaves.')
    ).toBeOnTheScreen();
  });

  // My Benefits opens to show the three vouchers and their discounts,
  // and closes again on a second tap.
  test('My Benefits expands the voucher list', () => {
    render(<MeScreen />);
    expect(screen.queryByText('WELCOME50')).toBeNull();
    fireEvent.press(screen.getByTestId('benefits-toggle'));
    expect(screen.getByText('WELCOME50')).toBeOnTheScreen();
    expect(screen.getByText('50% off')).toBeOnTheScreen();
    expect(screen.getByText('TEA20')).toBeOnTheScreen();
    expect(screen.getByText('20% off')).toBeOnTheScreen();
    expect(screen.getByText('LEAF10')).toBeOnTheScreen();
    expect(screen.getByText('10% off')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('benefits-toggle'));
    expect(screen.queryByText('WELCOME50')).toBeNull();
  });

  // Help Centre opens to show the help text, and closes on a second tap.
  test('Help Centre expands the help text', () => {
    render(<MeScreen />);
    expect(screen.queryByText(/pickup number/)).toBeNull();
    fireEvent.press(screen.getByTestId('help-row'));
    expect(
      screen.getByText(/pickup number and order time are on the Orders tab/)
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('help-row'));
    expect(screen.queryByText(/pickup number/)).toBeNull();
  });

  // The market button opens the sheet with Malaysia and Singapore only.
  test('the market button opens the market sheet', () => {
    render(<MeScreen />);
    fireEvent.press(screen.getByTestId('market-button'));
    expect(screen.getByText('Select Market')).toBeOnTheScreen();
    expect(screen.getByText('Singapore')).toBeOnTheScreen();
    expect(screen.getByText('Coming soon')).toBeOnTheScreen();
    expect(screen.getByText('SUBMIT')).toBeOnTheScreen();
  });

  // The Market row opens the same sheet.
  test('the Market row also opens the sheet', () => {
    render(<MeScreen />);
    fireEvent.press(screen.getByTestId('market-row'));
    expect(screen.getByText('Select Market')).toBeOnTheScreen();
  });

  // Picking Singapore and submitting switches the market and closes.
  test('picking Singapore and submitting switches the market', () => {
    render(<MeScreen />);
    fireEvent.press(screen.getByTestId('market-button'));
    fireEvent.press(screen.getByTestId('market-SG'));
    fireEvent.press(screen.getByTestId('market-submit'));
    expect(mockSetMarket).toHaveBeenCalledTimes(1);
    expect(mockSetMarket).toHaveBeenCalledWith('SG');
    expect(screen.queryByText('Select Market')).toBeNull();
  });

  // Closing the sheet without submitting keeps the market unchanged.
  test('closing the sheet without submitting keeps the market', () => {
    render(<MeScreen />);
    fireEvent.press(screen.getByTestId('market-button'));
    fireEvent.press(screen.getByTestId('market-SG'));
    fireEvent.press(screen.getByTestId('sheet-close'));
    expect(mockSetMarket).not.toHaveBeenCalled();
    expect(screen.queryByText('Select Market')).toBeNull();
  });

  // The back button closes the sheet without applying either.
  test('the back button closes the sheet without applying', () => {
    render(<MeScreen />);
    fireEvent.press(screen.getByTestId('market-button'));
    fireEvent.press(screen.getByTestId('market-SG'));
    fireEvent(screen.getByTestId('market-sheet'), 'onRequestClose');
    expect(mockSetMarket).not.toHaveBeenCalled();
    expect(screen.queryByText('Select Market')).toBeNull();
  });

  // When Singapore is the current market, it is shown on the profile.
  test('shows Singapore when it is the current market', () => {
    mockMarket = MARKETS[1];
    render(<MeScreen />);
    expect(screen.getByText('Singapore')).toBeOnTheScreen();
  });
});

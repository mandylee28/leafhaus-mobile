// Tests for the market state (src/market.js): the MarketProvider and
// the useMarket hook, rendered with a small probe component. The choice
// is saved in AsyncStorage (the in-memory mock in jest.setup.js), so
// the tests check what the provider shows and what it saves.
// Run them with: npm test

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketProvider, useMarket } from '../market';
import { MARKET_STORAGE_KEY } from '../data';

// The probe shows the current market id and exposes setMarket for
// Malaysia, Singapore and an unknown id, so the tests can drive the
// provider through the UI.
function Probe() {
  const { market, setMarket } = useMarket();
  return (
    <>
      <Text testID="market">{market.id}</Text>
      <TouchableOpacity testID="pick-my" onPress={() => setMarket('MY')}>
        <Text>Malaysia</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="pick-sg" onPress={() => setMarket('SG')}>
        <Text>Singapore</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="pick-xx" onPress={() => setMarket('XX')}>
        <Text>Unknown</Text>
      </TouchableOpacity>
    </>
  );
}

function renderProbe() {
  render(
    <MarketProvider>
      <Probe />
    </MarketProvider>
  );
}

// The market id is rendered as text, so the tests read it back directly.
function marketId() {
  return screen.getByTestId('market').props.children;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('MarketProvider', () => {
  test('starts with Malaysia when nothing is saved', () => {
    renderProbe();
    expect(marketId()).toBe('MY');
  });

  // A saved Singapore choice is loaded when the provider mounts.
  test('loads a saved Singapore choice', async () => {
    await AsyncStorage.setItem(MARKET_STORAGE_KEY, 'SG');
    renderProbe();
    await waitFor(() => expect(marketId()).toBe('SG'));
  });

  // A saved value that is not a market is ignored, not applied.
  test('ignores a saved unknown market id', async () => {
    await AsyncStorage.setItem(MARKET_STORAGE_KEY, 'XX');
    renderProbe();
    // Wait for the load effect to run, then the market is still Malaysia.
    await waitFor(async () => {
      expect(await AsyncStorage.getItem(MARKET_STORAGE_KEY)).toBe('XX');
    });
    expect(marketId()).toBe('MY');
  });

  // When the saved choice cannot be read at all, Malaysia stays.
  // (getItem is already a jest.fn from the AsyncStorage mock, so the
  // one-time rejection goes straight on it — spying on it and restoring
  // breaks the mock for the rest of the file.)
  test('keeps Malaysia when reading the saved choice fails', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('storage down'));
    renderProbe();
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
    expect(marketId()).toBe('MY');
  });

  // Switching the market updates the screen and saves the choice.
  test('setMarket switches to Singapore and saves it', async () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('pick-sg'));
    expect(marketId()).toBe('SG');
    await waitFor(async () => {
      expect(await AsyncStorage.getItem(MARKET_STORAGE_KEY)).toBe('SG');
    });
  });

  // An unknown id is refused: the market stays and nothing is saved.
  test('setMarket ignores an unknown id', async () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('pick-xx'));
    expect(marketId()).toBe('MY');
    expect(await AsyncStorage.getItem(MARKET_STORAGE_KEY)).toBeNull();
  });

  // The market still switches for this session when saving fails.
  test('setMarket still switches when saving fails', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('storage down'));
    renderProbe();
    fireEvent.press(screen.getByTestId('pick-sg'));
    expect(marketId()).toBe('SG');
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalled());
  });
});

describe('useMarket', () => {
  // The hook only works inside the provider; outside it, the mistake is
  // reported loudly instead of failing silently later.
  test('throws outside MarketProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'useMarket must be used inside MarketProvider'
    );
    spy.mockRestore();
  });
});

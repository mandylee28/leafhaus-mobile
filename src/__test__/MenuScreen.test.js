// Component tests for the menu screen (src/screens/MenuScreen.js):
// the 7-drink menu, search, and category chips.
// The screen reads the cart from context and the menu from Supabase when
// configured, so both are faked here: the cart is empty, and Supabase is
// replaced with "not configured" — exactly the local-mode fallback the
// app uses without a .env, so the built-in menu data is shown and no
// network is touched. Run them with: npm test

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DRINKS } from '../data';

const mockNavigate = jest.fn();
const mockSetStore = jest.fn();

// Fake navigation: the screen only navigates to Orders, Cart, Customise.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

// Fake cart: empty cart, no store picked yet.
jest.mock('../cart', () => ({
  useCart: () => ({ cart: [], store: null, setStore: mockSetStore }),
}));

// Fake Supabase as "not configured", like the app without a .env:
// the screen then uses the built-in menu and never calls the network.
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import MenuScreen from '../screens/MenuScreen';

beforeEach(() => {
  mockNavigate.mockClear();
  mockSetStore.mockClear();
});

describe('MenuScreen', () => {
  // The full menu is shown: all 7 drinks by name.
  test('renders all 7 drink names', () => {
    render(<MenuScreen />);
    DRINKS.forEach((drink) => {
      expect(screen.getByText(drink.name)).toBeOnTheScreen();
    });
  });

  // The top bar has the Leafhaus brand and the search box.
  test('renders the brand and the search box', () => {
    render(<MenuScreen />);
    expect(screen.getByText(/Leafhaus/)).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Search drinks…')).toBeOnTheScreen();
  });

  // The category chips are shown: All plus one per category.
  test('renders the category chips', () => {
    render(<MenuScreen />);
    ['All', 'Milk Tea', 'Pure Tea', 'Fruit Tea', 'Matcha'].forEach((c) => {
      expect(screen.getByText(c)).toBeOnTheScreen();
    });
  });

  // Without a .env the screen says so — it runs in local mode.
  test('shows the local-mode database status', () => {
    render(<MenuScreen />);
    expect(screen.getByText(/Local mode/)).toBeOnTheScreen();
  });

  // Typing in the search box filters the menu down to matching drinks.
  test('search filters the menu', () => {
    render(<MenuScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Search drinks…'), 'Mango');
    expect(screen.getByText('Mango Green Tea')).toBeOnTheScreen();
    expect(screen.queryByText('Jasmine Matcha Pure Tea')).toBeNull();
  });

  // A search with no match shows the empty message instead of the menu.
  test('a search with no match shows the empty message', () => {
    render(<MenuScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Search drinks…'), 'zzz');
    expect(screen.getByText('No drinks match your search.')).toBeOnTheScreen();
    expect(screen.queryByText('Mango Green Tea')).toBeNull();
  });

  // Tapping a drink card opens the Customise screen for that drink.
  test('tapping a drink opens Customise with that drink', () => {
    render(<MenuScreen />);
    fireEvent.press(screen.getByText('Mango Green Tea'));
    expect(mockNavigate).toHaveBeenCalledWith(
      'Customise',
      expect.objectContaining({ drink: expect.objectContaining({ id: 5 }) })
    );
  });
});

// Component tests for the menu screen (src/screens/MenuScreen.js):
// the 7-drink menu, search, and category chips.
// The screen reads the cart from context and the menu from Supabase when
// configured, so both are faked here: the cart is empty, and Supabase is
// replaced with "not configured" — exactly the local-mode fallback the
// app uses without a .env, so the built-in menu data is shown and no
// network is touched. Run them with: npm test

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { DRINKS } from '../data';

const mockNavigate = jest.fn();
const mockSetStore = jest.fn();

// The cart contents and the picked store for the current test.
let mockCart = [];
let mockStore = null;

// Fake navigation: the screen only navigates to Orders, Cart, Customise.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

// Fake cart: the screen reads cart/store and calls setStore.
jest.mock('../cart', () => ({
  useCart: () => ({ cart: mockCart, store: mockStore, setStore: mockSetStore }),
}));

// Fake Supabase as "not configured" by default, like the app without a
// .env. The mock module object is grabbed below so a test can flip it
// to "configured" with a fake client before render.
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import MenuScreen from '../screens/MenuScreen';

// The mocked Supabase module: tests mutate its two fields to switch the
// screen between local mode and a fake configured client.
const mockSupabase = jest.requireMock('../supabase');

beforeEach(() => {
  mockNavigate.mockClear();
  mockSetStore.mockClear();
  mockCart = [];
  mockStore = null;
  mockSupabase.isSupabaseConfigured = false;
  mockSupabase.supabase = null;
});

describe('MenuScreen', () => {
  // The full menu is shown: all 7 drinks by name.
  test('renders all 7 drink names', () => {
    render(<MenuScreen />);
    DRINKS.forEach((drink) => {
      expect(screen.getByText(drink.name)).toBeOnTheScreen();
    });
  });

  // Every drink card shows its photo.
  test('each drink shows its photo', () => {
    render(<MenuScreen />);
    DRINKS.forEach((drink) => {
      expect(screen.getByTestId(`drink-photo-${drink.id}`)).toBeOnTheScreen();
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

  // Tapping a category chip filters the menu to that category.
  test('tapping a category chip filters the menu', () => {
    render(<MenuScreen />);
    fireEvent.press(screen.getByText('Matcha'));
    expect(screen.getByText('Jasmine Matcha Pure Tea')).toBeOnTheScreen();
    expect(screen.queryByText('Mango Green Tea')).toBeNull();
    expect(screen.queryByText('Jasmine Green Milk Tea')).toBeNull();
  });

  // The search also matches the drink description, not just the name.
  test('search matches the drink description', () => {
    render(<MenuScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Search drinks…'), 'pearls');
    expect(screen.getByText('Brown Sugar Pearl Milk Tea')).toBeOnTheScreen();
    expect(screen.queryByText('Mango Green Tea')).toBeNull();
  });

  // Tapping a store chip asks the cart to switch the store.
  test('tapping a store chip switches the store', () => {
    render(<MenuScreen />);
    fireEvent.press(screen.getByText('Eco Botanic'));
    expect(mockSetStore).toHaveBeenCalledTimes(1);
    expect(mockSetStore).toHaveBeenCalledWith('Leafhaus MY Eco Botanic');
  });

  // The top bar buttons open My Orders and the Cart.
  test('My Orders and Cart buttons navigate', () => {
    render(<MenuScreen />);
    fireEvent.press(screen.getByText('My Orders'));
    expect(mockNavigate).toHaveBeenCalledWith('Orders');
    fireEvent.press(screen.getByText('Cart'));
    expect(mockNavigate).toHaveBeenCalledWith('Cart');
  });

  // With items in the cart, the Cart button shows the total count.
  test('the Cart button shows the item count', () => {
    mockCart = [
      { drinkId: 1, size: 'Regular', ice: 'Normal Ice', sweet: 'Less Sweet', qty: 2 },
      { drinkId: 5, size: 'Regular', ice: 'Normal Ice', sweet: 'Less Sweet', qty: 1 },
    ];
    render(<MenuScreen />);
    expect(screen.getByText('Cart (3)')).toBeOnTheScreen();
  });
});

// The menu with Supabase configured: the screen loads the stores, drinks
// and vouchers from the database instead of the built-in lists.
describe('MenuScreen with Supabase configured', () => {
  // A fake Supabase client: each table answers with fixed rows, and the
  // query chain (from → select → order) resolves like the real one.
  function makeChain(result) {
    const p = Promise.resolve(result);
    p.order = () => Promise.resolve(result);
    return p;
  }

  // Database rows: one store, three drinks (one with full details, one
  // with none, so the fallbacks are used, and one whose id matches a
  // built-in drink, so it reuses that drink's photo), one voucher.
  const dbRows = {
    stores: { error: null, data: [{ name: 'Leafhaus MY Test Store' }] },
    drinks: {
      error: null,
      data: [
        { id: 101, name: 'DB Test Tea', price: 12.5, category: 'Pure Tea', description: 'From the database', color: '#123456', bg: '#f0f0f0' },
        { id: 102, name: 'DB Plain Tea', price: 9.9, category: 'Pure Tea' },
        { id: 3, name: 'DB Pearl Tea', price: 13.9, category: 'Milk Tea', description: 'From the database too', color: '#654321', bg: '#f0e0d0' },
      ],
    },
    vouchers: { error: null, data: [{ code: 'DB50', discount_rate: 0.5 }] },
  };

  beforeEach(() => {
    mockSupabase.isSupabaseConfigured = true;
    mockSupabase.supabase = {
      from: jest.fn((table) => ({ select: () => makeChain(dbRows[table]) })),
    };
  });

  // The database lists replace the built-in ones: its drinks, store and
  // voucher are shown, and the built-in drinks are gone.
  test('loads the menu, stores and vouchers from the database', async () => {
    render(<MenuScreen />);
    await screen.findByText('Connected to the Supabase database.');
    await screen.findByText('DB Test Tea');
    expect(screen.getByText('DB Plain Tea')).toBeOnTheScreen();
    expect(screen.getByText('RM 12.50')).toBeOnTheScreen();
    expect(screen.getByText('Test Store')).toBeOnTheScreen();
    expect(screen.getByText('Vouchers: DB50')).toBeOnTheScreen();
    expect(screen.queryByText('Jasmine Matcha Pure Tea')).toBeNull();
    // A database drink with no built-in match has no photo; one whose id
    // matches a built-in drink reuses that drink's photo.
    expect(screen.queryByTestId('drink-photo-101')).toBeNull();
    expect(screen.queryByTestId('drink-photo-102')).toBeNull();
    expect(screen.getByTestId('drink-photo-3')).toBeOnTheScreen();
  });

  // When the database answers with errors or empty lists, the built-in
  // lists stay in place.
  test('keeps the built-in lists when the database answers with errors', async () => {
    const fakeClient = {
      from: jest.fn((table) => ({
        select: () => makeChain(
          table === 'drinks'
            ? { error: null, data: [] }
            : { error: { message: 'db down' }, data: null }
        ),
      })),
    };
    mockSupabase.supabase = fakeClient;
    render(<MenuScreen />);
    await screen.findByText('Connected to the Supabase database.');
    await waitFor(() => {
      expect(fakeClient.from).toHaveBeenCalledTimes(3);
    });
    expect(screen.getByText('Jasmine Matcha Pure Tea')).toBeOnTheScreen();
    expect(screen.getByText('Horizon Mall')).toBeOnTheScreen();
    expect(screen.getByText('Vouchers: WELCOME50 · TEA20 · LEAF10')).toBeOnTheScreen();
  });
});

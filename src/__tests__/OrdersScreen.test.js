// Component tests for the My Orders screen (src/screens/OrdersScreen.js):
// the list of past orders, the empty state, tapping an order, loading.
// The screen loads its orders through ../orders, so that module is
// replaced with a fake holding two realistic orders — the test checks
// what the screen shows and what happens when an order is tapped, not
// the real database. Run them with: npm test

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';

const mockNavigate = jest.fn();
const mockFetchOrders = jest.fn();

// Two past orders, newest first: a completed order (T0202) and an
// ordered one (T0201).
const pastOrders = [
  {
    id: 'ORD-2',
    orderNumber: '123456789013',
    pickupNumber: 'T0202',
    store: 'Leafhaus MY Eco Botanic',
    items: [
      { name: 'Mango Green Tea', size: 'Large', ice: 'Normal Ice', sweet: 'Less Sweet', qty: 1, unitPrice: 13.9 },
      { name: 'Lemon Honey Black Tea', size: 'Regular', ice: 'Normal Ice', sweet: 'Less Sweet', qty: 1, unitPrice: 10.9 },
    ],
    subtotal: 24.8,
    discount: 0,
    total: 24.8,
    voucher: null,
    payment: 'Card',
    leaves: 15,
    status: 3,
    time: '2026-09-05T10:30:00.000Z',
  },
  {
    id: 'ORD-1',
    orderNumber: '123456789012',
    pickupNumber: 'T0201',
    store: 'Leafhaus MY Horizon Mall',
    items: [
      { name: 'Jasmine Matcha Pure Tea', size: 'Regular', ice: 'Normal Ice', sweet: 'Less Sweet', qty: 1, unitPrice: 11.9 },
    ],
    subtotal: 11.9,
    discount: 5.95,
    total: 5.95,
    voucher: 'WELCOME50',
    payment: "Touch 'n Go",
    leaves: 15,
    status: 0,
    time: '2026-09-04T20:06:19.000Z',
  },
];

// Fake navigation: the screen only navigates to an Order's details.
// useFocusEffect is faked to run its callback on mount, like the real
// navigator does when the screen comes into focus.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useFocusEffect: (callback) => {
    const React = require('react');
    React.useEffect(callback, [callback]);
  },
}));

// Fake order store: fetchOrders returns the two fake orders.
// The wrapper reads mockFetchOrders when called, not when the mock is
// registered — the mock factory runs before the const below is
// initialised (imports are hoisted above it), so returning the fn
// directly here would freeze it as undefined.
jest.mock('../orders', () => ({
  fetchOrders: (...args) => mockFetchOrders(...args),
}));

// Fake Supabase as "not configured" (same as the other component tests).
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import OrdersScreen from '../screens/OrdersScreen';

beforeEach(() => {
  mockNavigate.mockClear();
  mockFetchOrders.mockClear();
  mockFetchOrders.mockResolvedValue(pastOrders);
});

describe('OrdersScreen', () => {
  // While the orders are loading, the spinner shows and no order yet.
  test('shows a loading indicator while the orders load', async () => {
    let resolveFetch;
    mockFetchOrders.mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );
    render(<OrdersScreen />);
    expect(screen.UNSAFE_queryByType(ActivityIndicator)).not.toBeNull();
    expect(screen.queryByText('T0201 — Ordered')).toBeNull();
    resolveFetch(pastOrders);
    await screen.findByText('T0201 — Ordered');
  });

  // Each order card shows its pickup number and status, the store and
  // time, and the item count, total and payment method.
  test('renders past orders with pickup number, status, store, items and total', async () => {
    render(<OrdersScreen />);
    await screen.findByText('T0201 — Ordered');
    expect(screen.getByText('T0202 — Completed')).toBeOnTheScreen();
    expect(screen.getByText("1 item(s) · RM 5.95 · Touch 'n Go")).toBeOnTheScreen();
    expect(screen.getByText('2 item(s) · RM 24.80 · Card')).toBeOnTheScreen();
    // The times are shown as DD/MM/YYYY HH:MM:SS (local timezone, so the
    // exact numbers depend on where the test runs — check the shape only).
    expect(screen.getByText(/Leafhaus MY Horizon Mall · \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/)).toBeOnTheScreen();
    expect(screen.getByText(/Leafhaus MY Eco Botanic · \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/)).toBeOnTheScreen();
  });

  // With no orders at all, the screen says so instead of showing cards.
  test('shows the empty message when there are no orders', async () => {
    mockFetchOrders.mockResolvedValueOnce([]);
    render(<OrdersScreen />);
    await screen.findByText('No orders yet.');
  });

  // Tapping an order card opens its details with that order's id.
  test('tapping an order opens its details', async () => {
    render(<OrdersScreen />);
    await screen.findByText('T0201 — Ordered');
    fireEvent.press(screen.getByText('T0202 — Completed'));
    expect(mockNavigate).toHaveBeenCalledWith('Order', { orderId: 'ORD-2' });
  });
});

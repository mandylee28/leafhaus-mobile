// Component tests for the Order Details screen (src/screens/OrderScreen.js):
// pickup number, Tea Leaves, status tracker (with dashed connectors),
// order summary, the "More Details" fold for order time and order number,
// the simulate-advance button, and the loading and not-found states.
// The screen loads its order through ../orders, so that module is
// replaced with a fake holding one realistic order — the test checks
// what the screen shows and what it asks the order store to do, not
// the real database. Run them with: npm test

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme';

const mockNavigate = jest.fn();
const mockFetchOrder = jest.fn();
const mockUpdateOrderStatus = jest.fn();

// A placed order: one Regular Jasmine Matcha Pure Tea with WELCOME50,
// RM 11.90 subtotal, RM 5.95 discount, RM 5.95 total, status Ordered.
const placedOrder = {
  id: 'ORD-1',
  orderNumber: '123456789012',
  pickupNumber: 'T0201',
  store: 'Leafhaus MY Horizon Mall',
  items: [
    {
      name: 'Jasmine Matcha Pure Tea',
      size: 'Regular',
      ice: 'Normal Ice',
      sweet: 'Less Sweet',
      qty: 1,
      unitPrice: 11.9,
    },
  ],
  subtotal: 11.9,
  discount: 5.95,
  total: 5.95,
  voucher: 'WELCOME50',
  payment: "Touch 'n Go",
  leaves: 15,
  status: 0,
  time: '2026-09-04T20:06:19.000Z',
};

const completedOrder = { ...placedOrder, status: 3 };

// Fake navigation: the screen reads its order id from the route params.
// useFocusEffect is faked to run its callback on mount, like the real
// navigator does when the screen comes into focus.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: { orderId: 'ORD-1' } }),
  useFocusEffect: (callback) => {
    const React = require('react');
    React.useEffect(callback, [callback]);
  },
}));

// Fake order store: fetchOrder returns the fake order, updateOrderStatus
// records the status change.
// The wrappers read the mock fns when called, not when the mock is
// registered — the mock factory runs before the consts below are
// initialised (imports are hoisted above them), so returning the fns
// directly here would freeze them as undefined.
jest.mock('../orders', () => ({
  fetchOrder: (...args) => mockFetchOrder(...args),
  updateOrderStatus: (...args) => mockUpdateOrderStatus(...args),
}));

// Fake Supabase as "not configured" (same as the other component tests).
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import OrderScreen from '../screens/OrderScreen';

beforeEach(() => {
  mockNavigate.mockClear();
  mockFetchOrder.mockClear();
  mockUpdateOrderStatus.mockClear();
  mockFetchOrder.mockResolvedValue(placedOrder);
  mockUpdateOrderStatus.mockResolvedValue(undefined);
});

describe('OrderScreen', () => {
  // While the order is loading, the spinner shows and no order content yet.
  test('shows a loading indicator while the order loads', async () => {
    let resolveFetch;
    mockFetchOrder.mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );
    render(<OrderScreen />);
    expect(screen.UNSAFE_queryByType(ActivityIndicator)).not.toBeNull();
    expect(screen.queryByText('T0201')).toBeNull();
    resolveFetch(placedOrder);
    await screen.findByText('T0201');
  });

  // The details screen shows the pickup number, Tea Leaves, the tracker,
  // the item, the discount and voucher, and the payment. Order time and
  // order number start folded away behind "More Details" (see below).
  test('renders the pickup number, Tea Leaves and order details', async () => {
    render(<OrderScreen />);
    await screen.findByText('T0201');
    expect(screen.getByText('ORDER ORDERED')).toBeOnTheScreen();
    expect(screen.getByText('15 Tea Leaves Earned!')).toBeOnTheScreen();
    expect(screen.getByText('Jasmine Matcha Pure Tea')).toBeOnTheScreen();
    expect(screen.getByText('Regular, Normal Ice, Less Sweet')).toBeOnTheScreen();
    expect(screen.getByText('RM 11.90 × 1')).toBeOnTheScreen();
    expect(screen.getByText('- RM 5.95')).toBeOnTheScreen();
    expect(screen.getByText('Voucher applied')).toBeOnTheScreen();
    expect(screen.getByText('WELCOME50')).toBeOnTheScreen();
    expect(screen.getByText("Touch 'n Go")).toBeOnTheScreen();
    expect(screen.getByText('More Details ⌄')).toBeOnTheScreen();
    expect(screen.queryByText('123456789012')).toBeNull();
    expect(screen.getAllByText('RM 5.95')).toHaveLength(2); // subtotal row and payment row
    ['Ordered', 'Preparing', 'Collection', 'Completed'].forEach((step) => {
      expect(screen.getByText(step)).toBeOnTheScreen();
    });
    expect(screen.getAllByText('✓')).toHaveLength(1); // only the first step is done
  });

  // Order Time and Order Number are folded away on first render.
  test('order time and order number are hidden on first render', async () => {
    render(<OrderScreen />);
    await screen.findByText('T0201');
    expect(screen.getByText('More Details ⌄')).toBeOnTheScreen();
    expect(screen.queryByText('Order Time')).toBeNull();
    expect(screen.queryByText('Order Number')).toBeNull();
    expect(screen.queryByText('123456789012')).toBeNull();
    // The time is shown as DD/MM/YYYY HH:MM:SS — check the shape only
    // (local timezone, so the exact numbers depend on where the test runs).
    expect(screen.queryByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/)).toBeNull();
  });

  // Tapping "More Details" reveals the time and number and turns the
  // button into "Fold"; tapping "Fold" hides them again.
  test('tapping More Details reveals the details and Fold hides them', async () => {
    render(<OrderScreen />);
    await screen.findByText('T0201');
    fireEvent.press(screen.getByText('More Details ⌄'));
    expect(screen.getByText('Order Time')).toBeOnTheScreen();
    expect(screen.getByText('Order Number')).toBeOnTheScreen();
    expect(screen.getByText('123456789012')).toBeOnTheScreen();
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/)).toBeOnTheScreen();
    expect(screen.getByText('Fold ⌃')).toBeOnTheScreen();
    expect(screen.queryByText('More Details ⌄')).toBeNull();
    fireEvent.press(screen.getByText('Fold ⌃'));
    expect(screen.queryByText('Order Time')).toBeNull();
    expect(screen.queryByText('Order Number')).toBeNull();
    expect(screen.queryByText('123456789012')).toBeNull();
    expect(screen.getByText('More Details ⌄')).toBeOnTheScreen();
  });

  // The status tracker has one dashed connector line between each pair of
  // adjacent steps — three connectors for four steps — whatever the order
  // status is.
  test('the tracker renders three dashed connectors between the steps', async () => {
    const { unmount } = render(<OrderScreen />);
    await screen.findByText('T0201');
    const connectors = screen.getAllByTestId('tracker-connector');
    expect(connectors).toHaveLength(3);
    connectors.forEach((connector) => {
      const style = StyleSheet.flatten(connector.props.style);
      expect(style.borderStyle).toBe('dashed');
      expect(style.borderColor).toBe(COLORS.goldSoft);
    });
    unmount();
    mockFetchOrder.mockResolvedValue(completedOrder);
    render(<OrderScreen />);
    await screen.findByText('T0201');
    expect(screen.getAllByTestId('tracker-connector')).toHaveLength(3);
  });

  // An unknown order id shows the not-found message instead of details.
  test('shows "Order not found." when the order does not exist', async () => {
    mockFetchOrder.mockResolvedValueOnce(null);
    render(<OrderScreen />);
    await screen.findByText('Order not found.');
    expect(screen.queryByText('T0201')).toBeNull();
  });

  // The simulate button moves the order one step forward and saves it.
  test('advancing moves the status one step forward', async () => {
    render(<OrderScreen />);
    await screen.findByText('T0201');
    fireEvent.press(screen.getByText('Simulate: advance order status'));
    await waitFor(() => {
      expect(screen.getByText('ORDER PREPARING')).toBeOnTheScreen();
    });
    expect(mockUpdateOrderStatus).toHaveBeenCalledTimes(1);
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ORD-1', status: 1 })
    );
    expect(screen.getAllByText('✓')).toHaveLength(2);
  });

  // A completed order shows ORDER COMPLETED and its button does nothing.
  test('a completed order shows ORDER COMPLETED and cannot advance', async () => {
    mockFetchOrder.mockResolvedValue(completedOrder);
    render(<OrderScreen />);
    await screen.findByText('T0201');
    expect(screen.getByText('ORDER COMPLETED')).toBeOnTheScreen();
    expect(screen.getByText('Order Completed')).toBeOnTheScreen();
    expect(screen.getAllByText('✓')).toHaveLength(4);
    fireEvent.press(screen.getByText('Order Completed'));
    expect(mockUpdateOrderStatus).not.toHaveBeenCalled();
  });

  // When the status update fails, the order keeps its old status and the
  // button is usable again.
  test('a failed status update keeps the old status', async () => {
    mockUpdateOrderStatus.mockRejectedValueOnce(new Error('offline'));
    render(<OrderScreen />);
    await screen.findByText('T0201');
    fireEvent.press(screen.getByText('Simulate: advance order status'));
    await waitFor(() => {
      expect(mockUpdateOrderStatus).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('ORDER ORDERED')).toBeOnTheScreen();
    expect(screen.getAllByText('✓')).toHaveLength(1);
    expect(screen.getByText('Simulate: advance order status')).toBeOnTheScreen();
  });

  // An order without a voucher shows no voucher row.
  test('an order without a voucher shows no voucher row', async () => {
    mockFetchOrder.mockResolvedValue({ ...placedOrder, voucher: null, discount: 0, total: 11.9 });
    render(<OrderScreen />);
    await screen.findByText('T0201');
    expect(screen.queryByText('Voucher applied')).toBeNull();
    expect(screen.getByText('- RM 0.00')).toBeOnTheScreen();
  });

  // The advance button is disabled for a completed order, so a real press
  // cannot reach the handler — call it directly to cover the guard that
  // stops a completed order from advancing. (The button is found among
  // the touchables by its disabled prop; the text's parent is the plain
  // host View, which has no onPress.)
  test('invoking advance on a completed order does nothing', async () => {
    mockFetchOrder.mockResolvedValue(completedOrder);
    const { UNSAFE_getAllByType } = render(<OrderScreen />);
    await screen.findByText('T0201');
    const button = UNSAFE_getAllByType(TouchableOpacity).find(
      (el) => el.props.disabled === true
    );
    expect(button).toBeTruthy();
    button.props.onPress();
    expect(mockUpdateOrderStatus).not.toHaveBeenCalled();
  });
});

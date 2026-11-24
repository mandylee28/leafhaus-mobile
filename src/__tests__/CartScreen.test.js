// Component tests for the Cart / Checkout screen (src/screens/CartScreen.js):
// empty cart, item lines and quantity buttons, the voucher box, the
// payment choice, and placing an order.
// The screen reads the cart from context and saves the order through
// ../orders, so both are replaced with fakes here — the test checks what
// the screen shows and what it asks the cart and the order store to do,
// not the real cart or database. Run them with: npm test

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, TouchableOpacity } from 'react-native';

const mockNavigate = jest.fn();
const mockSetQty = jest.fn();
const mockClearCart = jest.fn();
const mockSaveOrder = jest.fn();
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// One cart line: Jasmine Matcha Pure Tea, Regular, qty 1 (RM 11.90).
const oneItem = [
  { drinkId: 1, size: 'Regular', ice: 'Normal Ice', sweet: 'Less Sweet', qty: 1 },
];

// The cart contents and the picked store for the current test;
// each test sets these before render.
let mockCart = [];
let mockStore = 'Leafhaus MY Horizon Mall';

// Fake navigation: the screen only navigates to Menu and Order.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

// Fake cart: the screen reads cart/store and calls setQty/clearCart.
jest.mock('../cart', () => ({
  useCart: () => ({
    cart: mockCart,
    setQty: mockSetQty,
    clearCart: mockClearCart,
    store: mockStore,
  }),
}));

// Fake order store: placing an order returns a saved order id.
// The wrapper reads mockSaveOrder when called, not when the mock is
// registered — the mock factory runs before the const below is
// initialised (imports are hoisted above it), so returning the fn
// directly here would freeze it as undefined.
jest.mock('../orders', () => ({
  saveOrder: (...args) => mockSaveOrder(...args),
}));

// Fake Supabase as "not configured" (same as the other component tests).
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import CartScreen from '../screens/CartScreen';

beforeEach(() => {
  mockNavigate.mockClear();
  mockSetQty.mockClear();
  mockClearCart.mockClear();
  mockSaveOrder.mockClear();
  mockSaveOrder.mockResolvedValue({ id: 'ORD-1', pickupNumber: 'T0201' });
  alertSpy.mockClear();
  mockCart = [];
  mockStore = 'Leafhaus MY Horizon Mall';
});

describe('CartScreen', () => {
  // An empty cart shows the empty message and a way back to the menu.
  test('empty cart shows the empty message and a browse button', () => {
    render(<CartScreen />);
    expect(screen.getByText('Your cart is empty.')).toBeOnTheScreen();
    expect(screen.getByText('Browse the Menu')).toBeOnTheScreen();
    expect(screen.queryByText(/Place Order/)).toBeNull();
  });

  // The browse button goes back to the Menu screen.
  test('Browse the Menu navigates to the Menu', () => {
    render(<CartScreen />);
    fireEvent.press(screen.getByText('Browse the Menu'));
    expect(mockNavigate).toHaveBeenCalledWith('Menu');
  });

  // Item lines show the drink name, options, quantity and line total,
  // and the summary adds them up (2 x RM 11.90 + 1 x RM 11.90 = RM 35.70).
  test('renders item lines with name, options, quantity and line total', () => {
    mockCart = [
      { drinkId: 1, size: 'Regular', ice: 'Normal Ice', sweet: 'Less Sweet', qty: 2 },
      { drinkId: 5, size: 'Regular', ice: 'Normal Ice', sweet: 'Less Sweet', qty: 1 },
    ];
    render(<CartScreen />);
    expect(screen.getByText('Jasmine Matcha Pure Tea')).toBeOnTheScreen();
    expect(screen.getByText('Mango Green Tea')).toBeOnTheScreen();
    expect(screen.getAllByText('Regular, Normal Ice, Less Sweet')).toHaveLength(2);
    expect(screen.getByText('2')).toBeOnTheScreen();
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('RM 23.80')).toBeOnTheScreen();
    expect(screen.getByText('RM 11.90')).toBeOnTheScreen();
    expect(screen.getAllByText('RM 35.70')).toHaveLength(2); // subtotal and total
    expect(screen.getByText('Place Order · RM 35.70')).toBeOnTheScreen();
  });

  // The + button asks the cart to raise the quantity by one.
  test('pressing + asks the cart to raise the quantity', () => {
    mockCart = [...oneItem];
    render(<CartScreen />);
    fireEvent.press(screen.getByText('+'));
    expect(mockSetQty).toHaveBeenCalledTimes(1);
    expect(mockSetQty).toHaveBeenCalledWith(0, 2);
  });

  // The − button asks the cart to lower the quantity; 1 − 1 = 0, and the
  // real cart removes a line at 0 (see src/cart.js setQty).
  test('pressing − asks the cart to lower the quantity to 0', () => {
    mockCart = [...oneItem];
    render(<CartScreen />);
    fireEvent.press(screen.getByText('−'));
    expect(mockSetQty).toHaveBeenCalledTimes(1);
    expect(mockSetQty).toHaveBeenCalledWith(0, 0);
  });

  // WELCOME50 is 50% off: RM 11.90 → RM 5.95 discount, RM 5.95 total.
  test('applying WELCOME50 shows the 50% discount and the discounted total', () => {
    mockCart = [...oneItem];
    render(<CartScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Voucher code (e.g. WELCOME50)'), 'WELCOME50');
    fireEvent.press(screen.getByText('Apply'));
    expect(screen.getByText('Voucher applied: 50% off.')).toBeOnTheScreen();
    expect(screen.getByText('Total discount (WELCOME50)')).toBeOnTheScreen();
    expect(screen.getByText('- RM 5.95')).toBeOnTheScreen();
    expect(screen.getByText('RM 5.95')).toBeOnTheScreen();
    expect(screen.getByText('Place Order · RM 5.95')).toBeOnTheScreen();
  });

  // Voucher codes are trimmed and upper-cased, so lower-case works too.
  test('a lower-case voucher code works too', () => {
    mockCart = [...oneItem];
    render(<CartScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Voucher code (e.g. WELCOME50)'), 'welcome50');
    fireEvent.press(screen.getByText('Apply'));
    expect(screen.getByText('Voucher applied: 50% off.')).toBeOnTheScreen();
  });

  // An unknown code shows the error and leaves the totals unchanged.
  test('an invalid voucher shows an error and no discount', () => {
    mockCart = [...oneItem];
    render(<CartScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Voucher code (e.g. WELCOME50)'), 'NOPE');
    fireEvent.press(screen.getByText('Apply'));
    expect(screen.getByText('That voucher code is not valid. Try WELCOME50, TEA20 or LEAF10.')).toBeOnTheScreen();
    expect(screen.getByText('- RM 0.00')).toBeOnTheScreen();
    expect(screen.getAllByText('RM 11.90')).toHaveLength(3); // line, subtotal, total
  });

  // Placing the order saves it with the cart contents and totals,
  // clears the cart, and opens the Order screen for the saved order.
  test('placing the order saves it, clears the cart and opens the Order screen', async () => {
    mockCart = [...oneItem];
    render(<CartScreen />);
    fireEvent.press(screen.getByText('Place Order · RM 11.90'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Order', { orderId: 'ORD-1' });
    });
    expect(mockSaveOrder).toHaveBeenCalledTimes(1);
    expect(mockSaveOrder).toHaveBeenCalledWith(
      expect.objectContaining({
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
        discount: 0,
        total: 11.9,
        voucher: null,
        payment: "Touch 'n Go",
        leaves: 15,
        status: 0,
      })
    );
    expect(mockClearCart).toHaveBeenCalledTimes(1);
  });

  // The payment method picked on the screen is the one saved with the order.
  test('placing the order uses the selected payment method', async () => {
    mockCart = [...oneItem];
    render(<CartScreen />);
    fireEvent.press(screen.getByText('Card'));
    fireEvent.press(screen.getByText('Place Order · RM 11.90'));
    await waitFor(() => {
      expect(mockSaveOrder).toHaveBeenCalledWith(
        expect.objectContaining({ payment: 'Card' })
      );
    });
  });

  // When saving the order fails, the screen shows an alert, keeps the
  // cart, and does not open the Order screen.
  test('a failed order shows an alert and keeps the cart', async () => {
    mockCart = [...oneItem];
    mockSaveOrder.mockRejectedValueOnce(new Error('network down'));
    render(<CartScreen />);
    fireEvent.press(screen.getByText('Place Order · RM 11.90'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Could not place order',
        'Please check your connection and try again.'
      );
    });
    expect(mockClearCart).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByText('Place Order · RM 11.90')).toBeOnTheScreen();
  });

  // Placing the order with a voucher passes the voucher code to the order.
  test('placing the order with a voucher passes the voucher code', async () => {
    mockCart = [...oneItem];
    render(<CartScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Voucher code (e.g. WELCOME50)'), 'WELCOME50');
    fireEvent.press(screen.getByText('Apply'));
    fireEvent.press(screen.getByText('Place Order · RM 5.95'));
    await waitFor(() => {
      expect(mockSaveOrder).toHaveBeenCalledWith(
        expect.objectContaining({ voucher: 'WELCOME50', discount: 5.95, total: 5.95 })
      );
    });
  });

  // With no store picked, the order goes to the first store on the list.
  test('placing the order with no store picked uses the first store', async () => {
    mockCart = [...oneItem];
    mockStore = null;
    render(<CartScreen />);
    fireEvent.press(screen.getByText('Place Order · RM 11.90'));
    await waitFor(() => {
      expect(mockSaveOrder).toHaveBeenCalledWith(
        expect.objectContaining({ store: 'Leafhaus MY Horizon Mall' })
      );
    });
  });

  // Pressing Place Order twice while the first order is still placing
  // only saves once — the guard stops the second call.
  test('pressing Place Order twice while placing only saves once', async () => {
    mockCart = [...oneItem];
    let resolveSave;
    mockSaveOrder.mockImplementation(
      () => new Promise((resolve) => { resolveSave = resolve; })
    );
    const { UNSAFE_getAllByType } = render(<CartScreen />);
    fireEvent.press(screen.getByText('Place Order · RM 11.90'));
    // While placing, the button is disabled and shows a spinner, so a
    // real press cannot reach the handler — call it directly to reach
    // the guard.
    const placeButton = UNSAFE_getAllByType(TouchableOpacity).find(
      (el) => el.props.disabled === true
    );
    expect(placeButton).toBeTruthy();
    placeButton.props.onPress();
    expect(mockSaveOrder).toHaveBeenCalledTimes(1);
    resolveSave({ id: 'ORD-1', pickupNumber: 'T0201' });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Order', { orderId: 'ORD-1' });
    });
  });
});

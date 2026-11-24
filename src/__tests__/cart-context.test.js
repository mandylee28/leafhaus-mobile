// Tests for the cart state itself (src/cart.js): the CartProvider and
// the useCart hook, rendered with a small probe component. The price
// totals are not checked here — the provider stores lines only, and the
// totals live in src/pricing.js, which already has 100% coverage.
// Run them with: npm test

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { CartProvider, useCart } from '../cart';

const drinkA = {
  drinkId: 1,
  size: 'Regular',
  ice: 'Normal Ice',
  sweet: 'Less Sweet',
  qty: 1,
};

// The probe shows the cart and the picked store, and exposes every cart
// action as a button so the tests can drive the provider through the UI.
function Probe() {
  const { cart, store, addItem, setQty, clearCart, setStore } = useCart();
  return (
    <>
      <Text testID="cart">{JSON.stringify(cart)}</Text>
      <Text testID="store">{store ?? 'none'}</Text>
      <TouchableOpacity
        testID="add-a"
        onPress={() => addItem({ ...drinkA })}
      >
        <Text>Add A</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="add-a-2"
        onPress={() => addItem({ ...drinkA, qty: 2 })}
      >
        <Text>Add A x2</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="add-large"
        onPress={() => addItem({ ...drinkA, size: 'Large' })}
      >
        <Text>Add Large</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="set-qty-3" onPress={() => setQty(0, 3)}>
        <Text>Qty 3</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="set-qty-0" onPress={() => setQty(0, 0)}>
        <Text>Qty 0</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="clear" onPress={clearCart}>
        <Text>Clear</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="pick-store" onPress={() => setStore('Eco Botanic')}>
        <Text>Store</Text>
      </TouchableOpacity>
    </>
  );
}

function renderProbe() {
  render(
    <CartProvider>
      <Probe />
    </CartProvider>
  );
}

// The cart is rendered as JSON text, so the tests read it back as JSON.
function cartLines() {
  return JSON.parse(screen.getByTestId('cart').props.children);
}

describe('CartProvider', () => {
  test('starts with an empty cart and no store', () => {
    renderProbe();
    expect(cartLines()).toEqual([]);
    expect(screen.getByTestId('store').props.children).toBe('none');
  });

  test('addItem adds a new line', () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('add-a'));
    expect(cartLines()).toEqual([drinkA]);
  });

  // Same drink with the same options is one line with a bigger quantity,
  // not two lines.
  test('addItem merges the same drink and options', () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('add-a'));
    fireEvent.press(screen.getByTestId('add-a-2'));
    expect(cartLines()).toEqual([{ ...drinkA, qty: 3 }]);
  });

  // Same drink, different size, is a separate line.
  test('addItem keeps a different size on its own line', () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('add-a'));
    fireEvent.press(screen.getByTestId('add-large'));
    expect(cartLines()).toEqual([drinkA, { ...drinkA, size: 'Large' }]);
  });

  test('setQty changes the quantity of one line', () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('add-a'));
    fireEvent.press(screen.getByTestId('set-qty-3'));
    expect(cartLines()).toEqual([{ ...drinkA, qty: 3 }]);
  });

  // With two lines, changing one leaves the other untouched.
  test('setQty leaves the other lines alone', () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('add-a'));
    fireEvent.press(screen.getByTestId('add-large'));
    fireEvent.press(screen.getByTestId('set-qty-3'));
    expect(cartLines()).toEqual([
      { ...drinkA, qty: 3 },
      { ...drinkA, size: 'Large' },
    ]);
  });

  // Setting the quantity to 0 removes the line.
  test('setQty to 0 removes the line', () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('add-a'));
    fireEvent.press(screen.getByTestId('set-qty-0'));
    expect(cartLines()).toEqual([]);
  });

  test('clearCart empties the cart', () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('add-a'));
    fireEvent.press(screen.getByTestId('add-large'));
    fireEvent.press(screen.getByTestId('clear'));
    expect(cartLines()).toEqual([]);
  });

  test('setStore picks a store', () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('pick-store'));
    expect(screen.getByTestId('store').props.children).toBe('Eco Botanic');
  });
});

describe('useCart', () => {
  // The hook only works inside the provider; outside it, the mistake is
  // reported loudly instead of failing silently later.
  test('throws outside CartProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'useCart must be used inside CartProvider'
    );
    spy.mockRestore();
  });
});

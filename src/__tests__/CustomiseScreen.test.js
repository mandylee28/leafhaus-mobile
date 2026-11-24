// Component tests for the drink customisation screen
// (src/screens/CustomiseScreen.js): size, ice, sweetness, price display.
// The screen gets its drink from the route params and its cart actions
// from the cart context, so both are replaced with fakes here — the test
// checks what the screen shows and what it asks the cart to do, not the
// real cart or navigation. Run them with: npm test

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DRINKS } from '../data';

// The drink being customised: Jasmine Matcha Pure Tea, RM 11.90.
const matcha = DRINKS.find((d) => d.id === 1);

const mockNavigate = jest.fn();
const mockAddItem = jest.fn();

// The drink id for the current test; each test can change it before render.
// A test can also set mockDrink to a whole drink object (e.g. one with no
// photo) instead of picking a built-in drink by id.
let mockDrink = null;
let mockDrinkId = 1;

// Fake navigation: the screen only needs navigate(), and the route params
// carrying the drink. (The drink is loaded with require() inside the
// factory because jest.mock factories cannot see variables from the file.)
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({
    params: {
      drink:
        mockDrink ||
        require('../data').DRINKS.find((d) => d.id === mockDrinkId),
    },
  }),
}));

// Fake cart: the screen only needs addItem().
jest.mock('../cart', () => ({
  useCart: () => ({ addItem: mockAddItem }),
}));

import CustomiseScreen from '../screens/CustomiseScreen';

beforeEach(() => {
  mockNavigate.mockClear();
  mockAddItem.mockClear();
  mockDrink = null;
  mockDrinkId = 1;
});

describe('CustomiseScreen', () => {
  // The drink name and its Regular price are shown at the top.
  test('renders the drink name and its Regular price', () => {
    render(<CustomiseScreen />);
    expect(screen.getByText('Jasmine Matcha Pure Tea')).toBeOnTheScreen();
    expect(screen.getByText('RM 11.90')).toBeOnTheScreen();
  });

  // The drink photo is shown at the top.
  test('shows the drink photo', () => {
    render(<CustomiseScreen />);
    expect(screen.getByTestId('drink-photo')).toBeOnTheScreen();
  });

  // A drink with no photo shows no photo (only the coloured background).
  test('a drink without a photo shows no photo', () => {
    mockDrink = {
      id: 99,
      name: 'Plain Tea',
      price: 9.9,
      category: 'Pure Tea',
      desc: 'No photo',
      color: '#000000',
      bg: '#ffffff',
    };
    render(<CustomiseScreen />);
    expect(screen.getByText('Plain Tea')).toBeOnTheScreen();
    expect(screen.queryByTestId('drink-photo')).toBeNull();
  });

  // All three option groups are shown: size, ice, and sweetness.
  test('shows the size, ice and sweetness options', () => {
    render(<CustomiseScreen />);
    expect(screen.getByText('Regular')).toBeOnTheScreen();
    expect(screen.getByText('Large')).toBeOnTheScreen();
    expect(screen.getByText('Normal Ice')).toBeOnTheScreen();
    expect(screen.getByText('Less Ice')).toBeOnTheScreen();
    expect(screen.getByText('No Ice')).toBeOnTheScreen();
    expect(screen.getByText('Normal Sweet')).toBeOnTheScreen();
    expect(screen.getByText('Less Sweet')).toBeOnTheScreen();
    expect(screen.getByText('No Sugar')).toBeOnTheScreen();
  });

  // Large costs RM 2.00 more, and the screen says so.
  test('selecting Large updates the shown price by +RM 2.00', () => {
    render(<CustomiseScreen />);
    fireEvent.press(screen.getByText('Large'));
    expect(screen.getByText('RM 13.90')).toBeOnTheScreen();
    expect(screen.getByText('Large is +RM 2.00')).toBeOnTheScreen();
    expect(screen.queryByText('RM 11.90')).toBeNull();
  });

  // The add-to-cart button shows the total for the chosen options.
  test('the add-to-cart button is present with the total price', () => {
    render(<CustomiseScreen />);
    expect(screen.getByText('Add to Cart · RM 11.90')).toBeOnTheScreen();
  });

  // Adding to cart sends the chosen options to the cart and opens the Cart.
  // Jasmine Matcha defaults to Less Sweet (drink id 1) and Normal Ice.
  test('add to cart adds the drink with the chosen options and opens the Cart', () => {
    render(<CustomiseScreen />);
    fireEvent.press(screen.getByText('Add to Cart · RM 11.90'));
    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith({
      drinkId: matcha.id,
      size: 'Regular',
      ice: 'Normal Ice',
      sweet: 'Less Sweet',
      qty: 1,
    });
    expect(mockNavigate).toHaveBeenCalledWith('Cart');
  });

  // Quantity starts at 1 and the + button raises it — the button total
  // follows (1 Regular is RM 11.90, 2 Regulars are RM 23.80).
  test('raising the quantity updates the button total', () => {
    render(<CustomiseScreen />);
    fireEvent.press(screen.getByText('+'));
    expect(screen.getByText('Add to Cart · RM 23.80')).toBeOnTheScreen();
  });

  // The − button never drops the quantity below 1.
  test('pressing − at quantity 1 keeps the quantity at 1', () => {
    render(<CustomiseScreen />);
    fireEvent.press(screen.getByText('−'));
    expect(screen.getByText('Add to Cart · RM 11.90')).toBeOnTheScreen();
  });

  // + then − brings the quantity back down to 1.
  test('pressing + then − brings the quantity back to 1', () => {
    render(<CustomiseScreen />);
    fireEvent.press(screen.getByText('+'));
    expect(screen.getByText('Add to Cart · RM 23.80')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('−'));
    expect(screen.getByText('Add to Cart · RM 11.90')).toBeOnTheScreen();
  });

  // A drink other than id 1 defaults to Normal Sweet, not Less Sweet.
  test('a drink other than Jasmine Matcha defaults to Normal Sweet', () => {
    mockDrinkId = 5; // Mango Green Tea
    render(<CustomiseScreen />);
    expect(screen.getByText('Mango Green Tea')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Add to Cart · RM 11.90'));
    expect(mockAddItem).toHaveBeenCalledWith({
      drinkId: 5,
      size: 'Regular',
      ice: 'Normal Ice',
      sweet: 'Normal Sweet',
      qty: 1,
    });
  });
});

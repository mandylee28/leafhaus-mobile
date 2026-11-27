// Tests for the floating gift button: it renders with its seven
// confetti dots, and tapping it calls onPress. Run them with: npm test

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import FloatingGift from '../components/FloatingGift';

describe('FloatingGift', () => {
  // The gift button and its seven confetti dots are on screen.
  test('renders the gift button and seven confetti dots', () => {
    render(<FloatingGift onPress={() => {}} />);
    expect(screen.getByTestId('floating-gift')).toBeOnTheScreen();
    expect(screen.getAllByTestId('gift-confetti')).toHaveLength(7);
  });

  // Tapping the gift calls onPress (the app wires it to the Me tab).
  test('tapping it calls onPress', () => {
    const onPress = jest.fn();
    render(<FloatingGift onPress={onPress} />);
    fireEvent.press(screen.getByTestId('floating-gift'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

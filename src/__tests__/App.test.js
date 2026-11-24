// Tests for App.js: the app renders with its navigation stack and opens
// on the Menu screen. Run them with: npm test
//
// This renders the real App — the real navigation container, the real
// native-stack navigator and the real Menu screen — with only Supabase
// faked as "not configured", so the menu uses the built-in drinks and no
// network is touched. The other screens are not mounted: the stack only
// renders the focused screen (Menu), so Customise/Cart/Order/Orders
// never load here.

// Fake Supabase as "not configured", like the app without a .env.
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

// The real SafeAreaProvider swallows its children under Jest (its
// native view never mounts them in the test renderer), so the whole app
// below it would be invisible. The library's own docs recommend this
// mock: the provider and view just pass children through.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 0, height: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaView: ({ children }) => children,
    // Navigation's SafeAreaProviderCompat reads these contexts directly,
    // so they must exist (an undefined context crashes useContext).
    SafeAreaInsetsContext: React.createContext(inset),
    SafeAreaFrameContext: React.createContext(frame),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
  };
});

// The native-stack navigator renders its screens inside native
// react-native-screens views, which do not mount their children under
// Jest (there is no native side). Replace those views with plain Views
// that do render their children, and keep everything else from the real
// package. Only the initial route (Menu) is in the navigator state, so
// only Menu mounts — Customise and Order, which need route params, are
// never rendered here.
jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Actual = jest.requireActual('react-native-screens');
  const Passthrough = (props) => {
    const { children, ...rest } = props;
    return <View {...rest}>{children}</View>;
  };
  return {
    ...Actual,
    Screen: Passthrough,
    ScreenContainer: Passthrough,
    ScreenStack: Passthrough,
    ScreenStackHeaderConfig: Passthrough,
    ScreenStackHeaderLeftView: Passthrough,
    ScreenStackHeaderCenterView: Passthrough,
    ScreenStackHeaderRightView: Passthrough,
    ScreenStackHeaderBackButtonImage: Passthrough,
    ScreenStackHeaderSearchBarView: Passthrough,
    SearchBar: Passthrough,
  };
});

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../../App';

describe('App', () => {
  // The app opens on the Menu screen: the brand and the drinks are
  // shown, so the navigator mounted with Menu as its first screen.
  test('renders and opens on the Menu screen', async () => {
    render(<App />);
    // The brand is "🍃 Leafhaus", so match it with a regex like the
    // MenuScreen tests do.
    expect(await screen.findByText(/Leafhaus/)).toBeOnTheScreen();
    expect(
      await screen.findByText('Jasmine Matcha Pure Tea')
    ).toBeOnTheScreen();
  });

  // The top bar offers the way into the order history.
  test('the Menu top bar shows My Orders', async () => {
    render(<App />);
    expect(await screen.findByText('My Orders')).toBeOnTheScreen();
  });
});

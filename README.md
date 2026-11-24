# Leafhaus (Mobile App)

Leafhaus is a tea drink ordering **mobile app** built with Expo + React Native.
Browse the menu, customise a drink, add it to your cart, apply a voucher, and
place a pickup order. Track the order from Ordered to Completed, and revisit
past orders in My Orders.

This is the mobile version of the Leafhaus web app. It uses the same Supabase
(hosted PostgreSQL) database — stores, drinks, vouchers, orders and
order_items — so orders are shared across devices instead of being stuck in
one browser's localStorage.

## How to run

You need Node.js 18+ on your Mac, and the Expo Go app on your iPhone
(free from the App Store).

```bash
cd leafhaus-mobile
npm install
npx expo start
```

Then scan the QR code in the terminal with your iPhone camera (or the Expo Go
app) to open Leafhaus on your phone. Your phone and your Mac need to be on the
same Wi-Fi network. Press `i` in the terminal to open the iOS Simulator
instead, if you have Xcode installed.

## Database (Supabase)

Orders, menu, stores and vouchers live in a hosted PostgreSQL database on
Supabase. The tables are created by `supabase-schema.sql` in the
[leafhaus web repo](https://github.com/mandylee28/leafhaus) (run it once in
the Supabase Dashboard > SQL Editor).

1. Copy `.env.example` to `.env`.
2. Fill in your Project URL and anon key from Supabase Dashboard >
   Settings > API:
   - `EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY`
3. Restart the Expo dev server (`npx expo start`) after changing `.env` —
   Expo reads env files at startup.

`.env` is gitignored and is never committed — only the placeholders in
`.env.example` go into the repo. Without a real `.env` the app falls back to
local mode: the built-in menu is used and orders are saved in AsyncStorage on
the device only. The menu screen shows which mode the app is in.

## Features

- 7 tea drinks with search and category filters (All, Milk Tea, Pure Tea,
  Fruit Tea, Matcha)
- Store picker: Leafhaus MY Horizon Mall, Leafhaus MY Eco Botanic,
  Leafhaus MY Aeon Bukit Indah
- Drink customisation: size (Regular / Large +RM 2.00), ice level, sweetness
- Cart with quantity editing
- Checkout with vouchers and payment methods (Touch 'n Go, card, cash)
- Order placement generates a pickup number (e.g. T0201) and earns
  15 Tea Leaves per order
- Order Details view with the Ordered → Preparing → Collection → Completed
  tracker, including a button to simulate advancing the order status
- Discount / subtotal / payment summary, order time and order number
- My Orders history — from the Supabase database when configured (newest
  first, latest 20), otherwise from AsyncStorage on the device

## Testing

Automated tests run with Jest (the `jest-expo` preset, which matches
this Expo SDK). The unit tests check the pure logic only — prices,
vouchers, cart totals, order status steps, pickup numbers — and never
touch Supabase or the network. The component tests render the real
screens with `@testing-library/react-native` (v13) and check what the
user sees and what happens when they tap: navigation, route params,
the cart and Supabase are replaced with small fakes at the test
boundary, so no network or phone is needed.

```bash
npm test
```

The full suite takes about 30 seconds (most of it is the component
tests starting up React Native). What is covered (44 tests in
`src/__tests__/`):

- `pricing.test.js` — Regular vs Large prices (+RM 2.00), `money()`
  formatting, and the three voucher rates (WELCOME50 50%, TEA20 20%,
  LEAF10 10%), including lower-case codes and unknown codes.
- `cart.test.js` — cart totals via `calcTotals()`: single drinks, quantities,
  each voucher, no voucher, an invalid voucher, and an empty cart.
- `orders.test.js` — the four order status steps, 15 Tea Leaves per order,
  pickup-number format (T0201, T0202, ...), the 7-drink menu data, and that
  an order total is the discounted total.
- `Header.test.js` — the shared top bar renders the given title and its
  back button, and pressing back calls `navigation.goBack()`.
- `CustomiseScreen.test.js` — the drink name and Regular price are shown,
  all size/ice/sweetness options are present, picking Large shows
  RM 13.90 (+RM 2.00), the add-to-cart button shows the total, adding to
  cart calls `addItem` with the chosen options and opens the Cart, and
  raising the quantity updates the button total.
- `MenuScreen.test.js` — all 7 drink names, the brand and search box, the
  category chips, the local-mode database status (Supabase is faked as
  "not configured", so the built-in menu is used), search filtering, the
  empty-search message, and tapping a drink card opening Customise with
  that drink.

To add a new test, create a file ending in `.test.js` inside
`src/__tests__/` and run `npm test` — Jest picks it up automatically.
A good pattern to copy: import the pure function you want to check
(from `src/pricing.js` or `src/data.js`), call it with a fixed input, and
assert the exact result. For a screen, copy `MenuScreen.test.js`:
render the screen with `render()` from `@testing-library/react-native`,
replace navigation with `jest.mock('@react-navigation/native', ...)`,
replace the cart with `jest.mock('../cart', ...)` and Supabase with
`jest.mock('../supabase', ...)` (the same "not configured" stub the
orders tests use), then use `screen.getByText` / `fireEvent.press` to
check what is shown and what happens on a tap. If a test needs a
phone-only module such as AsyncStorage, `jest.setup.js` already replaces
it with an in-memory mock.

The price maths lives in `src/pricing.js` on purpose: the Cart screen
imports it, and the tests import the same functions, so a test failure
means the app itself would calculate the wrong price.

## Vouchers

| Code | Discount |
|------|----------|
| `WELCOME50` | 50% off |
| `TEA20` | 20% off |
| `LEAF10` | 10% off |

## Files

- `App.js` — navigation (Menu, Customise, Cart, Order, Orders)
- `index.js` — Expo entry point
- `src/theme.js` — cream / gold / navy colours
- `src/data.js` — built-in menu data (fallback when Supabase is not configured)
- `src/pricing.js` — pure price maths: unit price, voucher rates, cart totals
- `src/supabase.js` — Supabase client, created from the `.env` values
- `src/cart.js` — cart state shared by the screens
- `src/orders.js` — order storage: Supabase when configured, AsyncStorage fallback
- `src/Header.js` — shared top bar (back button + title) for the inner screens
- `src/__tests__/` — Jest tests: unit tests (`pricing.test.js`, `cart.test.js`, `orders.test.js`) and component tests (`Header.test.js`, `CustomiseScreen.test.js`, `MenuScreen.test.js`)
- `jest.config.js` — Jest preset (`jest-expo`)
- `jest.setup.js` — test setup: mocks AsyncStorage (a phone-only module)
- `src/screens/MenuScreen.js` — store picker, search, categories, menu
- `src/screens/CustomiseScreen.js` — size, ice, sweetness, quantity
- `src/screens/CartScreen.js` — cart, voucher, payment, place order
- `src/screens/OrderScreen.js` — pickup number, Tea Leaves, status tracker
- `src/screens/OrdersScreen.js` — order history
- `.env.example` — Supabase URL / anon key placeholders (copy to `.env`)
- `.env` — your real Supabase details (gitignored, never committed)

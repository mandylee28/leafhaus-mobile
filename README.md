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
tests starting up React Native). What is covered (82 tests in
`src/__tests__/`):

- `pricing.test.js` — Regular vs Large prices (+RM 2.00), `money()`
  formatting, and the three voucher rates (WELCOME50 50%, TEA20 20%,
  LEAF10 10%), including lower-case codes and unknown codes.
- `cart.test.js` — cart totals via `calcTotals()`: single drinks, quantities,
  each voucher, no voucher, an invalid voucher, an empty cart, and a
  line for a drink that no longer exists (skipped, not charged).
- `orders.test.js` — the four order status steps, 15 Tea Leaves per order,
  pickup-number format (T0201, T0202, ...), the 7-drink menu data, and that
  an order total is the discounted total.
- `Header.test.js` — the shared top bar renders the given title and its
  back button, and pressing back calls `navigation.goBack()`.
- `CustomiseScreen.test.js` — the drink name and Regular price are shown,
  all size/ice/sweetness options are present, picking Large shows
  RM 13.90 (+RM 2.00), the add-to-cart button shows the total, adding to
  cart calls `addItem` with the chosen options and opens the Cart, and
  raising the quantity updates the button total. Also: the − button never
  drops the quantity below 1, and a drink other than Jasmine Matcha
  defaults to Normal Sweet.
- `MenuScreen.test.js` — all 7 drink names, the brand and search box, the
  category chips, the local-mode database status (Supabase is faked as
  "not configured", so the built-in menu is used), search filtering
  (by name and by description), the empty-search message, tapping a
  drink card opening Customise with that drink, tapping a category chip
  filtering the menu, tapping a store chip switching the store, the
  My Orders and Cart buttons, and the Cart button showing the item
  count. With Supabase faked as configured, the screen loads the
  stores, drinks and vouchers from the fake database — and keeps the
  built-in lists when the database answers with errors or empty lists.
- `CartScreen.test.js` — the empty cart and its browse button, item lines
  with name, options, quantity and line total, the + / − buttons asking
  the cart to change the quantity (down to 0, which removes the line),
  applying WELCOME50 (RM 11.90 → RM 5.95) including a lower-case code,
  an invalid voucher showing an error and no discount, and placing the
  order: it saves the order with the cart contents and totals, clears
  the cart, and opens the Order screen, using the selected payment
  method. Also: a failed save shows an alert and keeps the cart,
  placing with a voucher passes the voucher code, placing with no store
  picked uses the first store, and pressing Place Order twice while the
  first order is still placing only saves once.
- `OrderScreen.test.js` — the loading indicator, the pickup number,
  Tea Leaves, the four status-tracker steps, the item, discount,
  voucher, payment and order time, the "Order not found." state, the
  simulate-advance button moving the status one step forward and saving
  it, and a completed order showing ORDER COMPLETED with a dead button.
  Also: a failed status update keeps the old status, an order without
  a voucher shows no voucher row, and invoking advance on a completed
  order does nothing.
- `OrdersScreen.test.js` — the loading indicator, two past orders with
  different pickup numbers and statuses, the empty "No orders yet."
  state, tapping an order opening its details with that order's id,
  and a failed load falling back to the empty message.

Coverage (`npx jest --coverage`, files touched by tests only):
statements 77.36%, lines 78.92%, branches 71.75%, functions 82.43%.
100% statements/lines/functions everywhere except `orders.js`:
Header, data, pricing, theme, CartScreen, CustomiseScreen,
OrderScreen and OrdersScreen are 100% on every measure, and
MenuScreen is 100% except two branches (96%) — the `large` flag of
its cup drawing is never set, so those two branches cannot be
reached without changing the app. The real `orders.js` storage code
is barely covered (2%) because the screen tests replace `../orders`
with a fake — its Supabase and AsyncStorage paths are only checked
by the pickup-number helper test. Cart/Order/Orders screens are
tested through their screens, so `cart.js`, `supabase.js` and `App.js`
have no tests of their own yet.

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
it with an in-memory mock. If a screen loads data through `../orders`,
mock it the same way — but return wrapper functions
(`saveOrder: (...args) => mockSaveOrder(...args)`) instead of the mock
fn itself: the mock factory runs before the `const mockSaveOrder =
jest.fn()` line (imports are hoisted above it), so returning the fn
directly freezes it as `undefined` and the screen silently fails
inside its own `try/catch`.

Two more patterns used in the tests: to flip Supabase between "not
configured" and a fake configured client, the test grabs the mocked
module with `jest.requireMock('../supabase')` and mutates its two
fields before render — returning the mutable object from the
`jest.mock` factory itself does not work, because the factory runs
before the object is created and the screen then reads `undefined`.
And a disabled button cannot be pressed through the UI (the testing
library respects `disabled`), so to reach a guard behind a disabled
button the tests find the button among the touchables
(`UNSAFE_getAllByType(TouchableOpacity)`, picked by its `disabled`
prop) and call its `onPress` prop directly.

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
- `src/__tests__/` — Jest tests: unit tests (`pricing.test.js`, `cart.test.js`, `orders.test.js`) and component tests (`Header.test.js`, `CustomiseScreen.test.js`, `MenuScreen.test.js`, `CartScreen.test.js`, `OrderScreen.test.js`, `OrdersScreen.test.js`)
- `jest.config.js` — Jest preset (`jest-expo`)
- `jest.setup.js` — test setup: mocks AsyncStorage (a phone-only module)
- `src/screens/MenuScreen.js` — store picker, search, categories, menu
- `src/screens/CustomiseScreen.js` — size, ice, sweetness, quantity
- `src/screens/CartScreen.js` — cart, voucher, payment, place order
- `src/screens/OrderScreen.js` — pickup number, Tea Leaves, status tracker
- `src/screens/OrdersScreen.js` — order history
- `.env.example` — Supabase URL / anon key placeholders (copy to `.env`)
- `.env` — your real Supabase details (gitignored, never committed)

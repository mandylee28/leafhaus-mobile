// Leafhaus — price maths, kept as pure functions (no React, no network).
// The Cart screen uses these, and the unit tests in src/__tests__/
// check them. Keeping the maths here means a test can import it
// directly, without rendering a screen.

import { VOUCHERS } from './data';

// A Large drink costs RM 2.00 more than a Regular one.
export const LARGE_EXTRA = 2;

// The price of one drink in a given size.
export function unitPrice(drink, size) {
  return drink.price + (size === 'Large' ? LARGE_EXTRA : 0);
}

// The discount rate for a voucher code, or null when the code is not valid.
// The code is trimmed and upper-cased first, so "welcome50" and
// "  WELCOME50  " both work — that is the same behaviour as the
// Cart screen's voucher box.
export function voucherRate(code) {
  if (!code) return null;
  const key = String(code).trim().toUpperCase();
  return VOUCHERS[key] ?? null;
}

// Totals for a cart.
// items: cart lines { drinkId, size, qty } — the same shape the cart stores.
// drinks: the DRINKS list, so each line can look up its drink price.
// voucherCode: a voucher code string, or null for no voucher.
// Returns { subtotal, discount, total, rate } — all in RM.
export function calcTotals(items, drinks, voucherCode) {
  const subtotal = items.reduce((sum, item) => {
    const drink = drinks.find((d) => d.id === item.drinkId);
    if (!drink) return sum; // skip lines whose drink no longer exists
    return sum + unitPrice(drink, item.size) * item.qty;
  }, 0);
  const rate = voucherRate(voucherCode);
  const discount = rate ? subtotal * rate : 0;
  return { subtotal, discount, total: subtotal - discount, rate };
}

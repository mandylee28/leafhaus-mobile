// Unit tests for cart totals, using calcTotals from src/pricing.js.
// calcTotals takes the same cart lines the app stores
// ({ drinkId, size, qty }) plus the DRINKS list, so these tests check
// the exact maths the Cart screen shows. Run them with: npm test
//
// Note: money is stored as decimal numbers (11.9, 13.9, ...), and decimal
// maths in JavaScript is not always exact (27.8 * 0.2 is 5.5600000000000005,
// not 5.56), so totals are compared with toBeCloseTo instead of toBe.

import { calcTotals } from '../pricing';
import { DRINKS } from '../data';

// One Regular Jasmine Matcha Pure Tea — RM 11.90 on the menu.
const oneRegularMatcha = [{ drinkId: 1, size: 'Regular', qty: 1 }];
// Two Large Jasmine Matcha Pure Teas — RM 13.90 each.
const twoLargeMatcha = [{ drinkId: 1, size: 'Large', qty: 2 }];

describe('calcTotals', () => {
  // One drink, no voucher: the total is just the menu price.
  test('one Regular drink totals RM 11.90 with no discount', () => {
    const { subtotal, discount, total, rate } = calcTotals(oneRegularMatcha, DRINKS, null);
    expect(subtotal).toBe(11.9);
    expect(discount).toBe(0);
    expect(total).toBe(11.9);
    expect(rate).toBeNull();
  });

  // Quantity multiplies the unit price: 2 x RM 13.90 = RM 27.80.
  test('two Large drinks cost twice the Large unit price', () => {
    const { subtotal, total } = calcTotals(twoLargeMatcha, DRINKS, null);
    expect(subtotal).toBeCloseTo(27.8, 2);
    expect(total).toBeCloseTo(27.8, 2);
  });

  // WELCOME50 takes half off: RM 11.90 - RM 5.95 = RM 5.95 to pay.
  test('WELCOME50 halves the total', () => {
    const { subtotal, discount, total } = calcTotals(oneRegularMatcha, DRINKS, 'WELCOME50');
    expect(subtotal).toBe(11.9);
    expect(discount).toBeCloseTo(5.95, 2);
    expect(total).toBeCloseTo(5.95, 2);
  });

  // TEA20 takes 20% off: 20% of RM 27.80 is RM 5.56.
  test('TEA20 takes 20% off', () => {
    const { discount, total } = calcTotals(twoLargeMatcha, DRINKS, 'TEA20');
    expect(discount).toBeCloseTo(5.56, 2);
    expect(total).toBeCloseTo(22.24, 2);
  });

  // LEAF10 on a mixed cart: RM 11.90 + RM 10.90 = RM 22.80, less 10%.
  test('LEAF10 takes 10% off a mixed cart', () => {
    const cart = [
      { drinkId: 1, size: 'Regular', qty: 1 }, // Jasmine Matcha Pure Tea
      { drinkId: 7, size: 'Regular', qty: 1 }, // Lemon Honey Black Tea
    ];
    const { subtotal, discount, total } = calcTotals(cart, DRINKS, 'LEAF10');
    expect(subtotal).toBeCloseTo(22.8, 2);
    expect(discount).toBeCloseTo(2.28, 2);
    expect(total).toBeCloseTo(20.52, 2);
  });

  // Without a voucher the customer pays the full subtotal.
  test('no voucher means no discount', () => {
    const { discount, total } = calcTotals(twoLargeMatcha, DRINKS, null);
    expect(discount).toBe(0);
    expect(total).toBeCloseTo(27.8, 2);
  });

  // An invalid voucher code behaves like no voucher at all.
  test('an invalid voucher code gives no discount', () => {
    const { discount, total } = calcTotals(oneRegularMatcha, DRINKS, 'NOTREAL');
    expect(discount).toBe(0);
    expect(total).toBe(11.9);
  });

  // An empty cart costs nothing, whatever voucher is typed in.
  test('an empty cart totals zero', () => {
    const { subtotal, discount, total } = calcTotals([], DRINKS, 'WELCOME50');
    expect(subtotal).toBe(0);
    expect(discount).toBe(0);
    expect(total).toBe(0);
  });
});

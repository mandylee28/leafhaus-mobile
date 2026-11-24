// Unit tests for the price maths in src/pricing.js and the money
// formatting in src/data.js.
// These are pure functions: no screen, no network, no database.
// Run them with: npm test

import { LARGE_EXTRA, unitPrice, voucherRate } from '../pricing';
import { DRINKS, money } from '../data';

// The Jasmine Matcha Pure Tea is the first drink on the menu (RM 11.90).
const matcha = DRINKS.find((d) => d.id === 1);
const lemonTea = DRINKS.find((d) => d.id === 7); // RM 10.90, the cheapest

describe('unitPrice', () => {
  // A Regular drink costs exactly its menu price.
  test('Regular costs the menu price', () => {
    expect(unitPrice(matcha, 'Regular')).toBe(11.9);
  });

  // A Large drink costs RM 2.00 more than a Regular one.
  test('Large adds RM 2.00', () => {
    expect(unitPrice(matcha, 'Large')).toBe(13.9);
  });

  // The +RM 2.00 rule applies to every drink, not just the first one.
  test('Large adds RM 2.00 to the cheapest drink too', () => {
    expect(unitPrice(lemonTea, 'Large')).toBe(12.9);
  });

  // The surcharge itself is a named constant, so a test can pin it down.
  test('LARGE_EXTRA is RM 2.00', () => {
    expect(LARGE_EXTRA).toBe(2);
  });
});

describe('money', () => {
  // Prices always show two decimals, with the RM prefix.
  test('formats 11.9 as RM 11.90', () => {
    expect(money(11.9)).toBe('RM 11.90');
  });

  // Whole amounts and zero also get two decimals.
  test('formats whole amounts and zero with two decimals', () => {
    expect(money(5)).toBe('RM 5.00');
    expect(money(0)).toBe('RM 0.00');
  });
});

describe('voucherRate', () => {
  // Each voucher code maps to its discount rate.
  test('WELCOME50 is 50% off', () => {
    expect(voucherRate('WELCOME50')).toBe(0.5);
  });

  test('TEA20 is 20% off and LEAF10 is 10% off', () => {
    expect(voucherRate('TEA20')).toBe(0.2);
    expect(voucherRate('LEAF10')).toBe(0.1);
  });

  // A code that does not exist is not a discount — it returns null.
  test('an unknown code returns null', () => {
    expect(voucherRate('NOPE')).toBeNull();
    expect(voucherRate('WELCOME')).toBeNull();
  });

  // The voucher box upper-cases the input, so lower-case codes work too.
  test('codes are case-insensitive', () => {
    expect(voucherRate('welcome50')).toBe(0.5);
    expect(voucherRate('Tea20')).toBe(0.2);
  });

  // Spaces around the code are ignored, and an empty code is not a voucher.
  test('spaces are trimmed and empty codes return null', () => {
    expect(voucherRate('  LEAF10  ')).toBe(0.1);
    expect(voucherRate('')).toBeNull();
    expect(voucherRate(null)).toBeNull();
  });
});

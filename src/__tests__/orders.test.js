// Unit tests for order data: the status steps, Tea Leaves, pickup
// numbers, and the menu data itself.
// These tests only check data and pure helpers — nothing here talks to
// Supabase or the network. Run them with: npm test

// The orders module imports the Supabase client, whose package is ESM-only
// and cannot be loaded by Jest's CommonJS loader on some Node versions
// (on those machines the whole suite fails at the import line).
// These tests only check pure helpers, so replace the client with a stub.
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import { DRINKS, LEAVES_PER_ORDER, STATUS_STEPS, formatTime } from '../data';
import { formatPickupNumber } from '../orders';
import { calcTotals } from '../pricing';

describe('order status steps', () => {
  // The tracker has exactly four steps, in this order.
  test('the four steps are Ordered, Preparing, Collection, Completed', () => {
    expect(STATUS_STEPS).toEqual(['Ordered', 'Preparing', 'Collection', 'Completed']);
  });

  // Status is stored as an index: 0 is Ordered, 3 is Completed.
  test('status 0 is Ordered and status 3 is Completed', () => {
    expect(STATUS_STEPS[0]).toBe('Ordered');
    expect(STATUS_STEPS[3]).toBe('Completed');
  });
});

describe('Tea Leaves', () => {
  // Every order earns the same number of Tea Leaves.
  test('each order earns 15 Tea Leaves', () => {
    expect(LEAVES_PER_ORDER).toBe(15);
  });
});

describe('pickup numbers', () => {
  // The first order is T0201, the next one T0202.
  test('the first pickup number is T0201', () => {
    expect(formatPickupNumber(0)).toBe('T0201');
    expect(formatPickupNumber(1)).toBe('T0202');
  });

  // The format is always a T followed by a four-digit number.
  test('pickup numbers are T plus four digits', () => {
    expect(formatPickupNumber(99)).toBe('T0300');
    expect(formatPickupNumber(9)).toMatch(/^T\d{4}$/);
  });
});

describe('menu data', () => {
  // The menu has seven drinks, each with its own id.
  test('there are 7 drinks with unique ids', () => {
    expect(DRINKS).toHaveLength(7);
    const ids = DRINKS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // The default drink on the menu is Jasmine Matcha Pure Tea, RM 11.90.
  test('Jasmine Matcha Pure Tea costs RM 11.90', () => {
    const drink = DRINKS.find((d) => d.name === 'Jasmine Matcha Pure Tea');
    expect(drink).toBeDefined();
    expect(drink.price).toBe(11.9);
  });
});

describe('order totals', () => {
  // What the customer pays is the discounted total, not the subtotal.
  // One Regular Jasmine Matcha with WELCOME50: RM 11.90 -> RM 5.95.
  test('an order total is the discounted total', () => {
    const cart = [{ drinkId: 1, size: 'Regular', qty: 1 }];
    const { total } = calcTotals(cart, DRINKS, 'WELCOME50');
    const order = { total, leaves: LEAVES_PER_ORDER, status: 0 };
    expect(order.total).toBeCloseTo(5.95, 2);
    expect(order.leaves).toBe(15);
    expect(order.status).toBe(0); // 0 = Ordered
  });

  // Order times are shown as DD/MM/YYYY HH:MM:SS. The exact hour depends
  // on the device timezone, so only the shape is checked here.
  test('formatTime returns a DD/MM/YYYY HH:MM:SS string', () => {
    expect(formatTime('2026-11-24T10:00:00.000Z')).toMatch(
      /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/
    );
  });
});

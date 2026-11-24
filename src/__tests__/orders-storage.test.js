// Storage tests for src/orders.js: the Supabase path and the AsyncStorage
// fallback path, including the error paths. Run them with: npm test
//
// orders.js reads the Supabase client at call time, so the tests flip the
// mocked '../supabase' module between "configured" (a fake query-builder
// client) and "not configured" (null client) per test, the same way
// MenuScreen.test.js does. The fake client is a chainable builder: every
// method returns the builder itself, and awaiting the builder resolves
// with a canned result — which is how the real Supabase JS client behaves
// (it is thenable). No network is touched.

// The mocked module object is grabbed below with jest.requireMock so a
// test can mutate its two fields. Returning the mutable object from the
// factory itself does not work — the factory runs before the object is
// created (see README).
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '../data';
import {
  fetchOrders,
  fetchOrder,
  updateOrderStatus,
  saveOrder,
  formatPickupNumber,
} from '../orders';

const mockSupabase = jest.requireMock('../supabase');

// A fake Supabase query builder: every call in the chain returns the
// builder, and awaiting it resolves with the canned result.
function builderFor(result) {
  const builder = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => builder),
    then: (resolve) => resolve(result),
  };
  return builder;
}

let mockFrom;

function useFakeSupabase() {
  mockFrom = jest.fn();
  mockSupabase.isSupabaseConfigured = true;
  mockSupabase.supabase = { from: mockFrom };
}

function useLocalMode() {
  mockSupabase.isSupabaseConfigured = false;
  mockSupabase.supabase = null;
}

// One order as the database returns it: snake_case columns, numbers as
// strings, items nested under order_items.
const dbRow = {
  id: 'db-1',
  order_number: 'ORD-20261124-001',
  pickup_number: 'T0201',
  store: 'Leafhaus MY Horizon Mall',
  subtotal: '11.90',
  discount: '5.95',
  total: '5.95',
  voucher_code: 'WELCOME50',
  payment: "Touch 'n Go",
  leaves: 15,
  status: 0,
  created_at: '2026-11-24T10:00:00.000Z',
  order_items: [
    {
      name: 'Jasmine Matcha Pure Tea',
      size: 'Regular',
      ice: 'Normal Ice',
      sweet: 'Less Sweet',
      qty: 1,
      unit_price: '11.90',
    },
  ],
};

// The same order as the app uses it: camelCase, numbers as numbers.
const appOrder = {
  id: 'db-1',
  orderNumber: 'ORD-20261124-001',
  pickupNumber: 'T0201',
  store: 'Leafhaus MY Horizon Mall',
  items: [
    {
      name: 'Jasmine Matcha Pure Tea',
      size: 'Regular',
      ice: 'Normal Ice',
      sweet: 'Less Sweet',
      qty: 1,
      unitPrice: 11.9,
    },
  ],
  subtotal: 11.9,
  discount: 5.95,
  total: 5.95,
  voucher: 'WELCOME50',
  payment: "Touch 'n Go",
  leaves: 15,
  status: 0,
  time: '2026-11-24T10:00:00.000Z',
};

const draft = {
  orderNumber: 'ORD-20261124-002',
  store: 'Leafhaus MY Horizon Mall',
  items: [
    {
      name: 'Jasmine Matcha Pure Tea',
      size: 'Regular',
      ice: 'Normal Ice',
      sweet: 'Less Sweet',
      qty: 1,
      unitPrice: 11.9,
    },
  ],
  subtotal: 11.9,
  discount: 5.95,
  total: 5.95,
  voucher: 'WELCOME50',
  payment: "Touch 'n Go",
  leaves: 15,
  status: 0,
  time: '2026-11-24T10:00:00.000Z',
};

beforeEach(async () => {
  useLocalMode();
  await AsyncStorage.clear();
});

describe('fetchOrders — Supabase path', () => {
  // Database rows come back as snake_case with string numbers; the app
  // uses camelCase with real numbers.
  test('maps database rows to app orders', async () => {
    useFakeSupabase();
    mockFrom.mockImplementationOnce(() =>
      builderFor({ data: [dbRow], error: null })
    );
    await expect(fetchOrders()).resolves.toEqual([appOrder]);
    expect(mockFrom).toHaveBeenCalledWith('orders');
  });

  // A database row with no items at all still maps (to an empty list),
  // instead of crashing on undefined.
  test('a row without order_items maps to an empty items list', async () => {
    useFakeSupabase();
    const { order_items, ...rowWithoutItems } = dbRow;
    mockFrom.mockImplementationOnce(() =>
      builderFor({ data: [rowWithoutItems], error: null })
    );
    const [order] = await fetchOrders();
    expect(order.items).toEqual([]);
    expect(order.id).toBe('db-1');
  });

  // The list query selects items too, newest first, at most 20 rows.
  test('selects items, newest first, limit 20', async () => {
    useFakeSupabase();
    const builder = builderFor({ data: [], error: null });
    mockFrom.mockImplementationOnce(() => builder);
    await fetchOrders();
    expect(builder.select).toHaveBeenCalledWith('*, order_items(*)');
    expect(builder.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
    expect(builder.limit).toHaveBeenCalledWith(20);
  });

  // No rows in the database means an empty list, not an error.
  test('returns [] when data is null', async () => {
    useFakeSupabase();
    mockFrom.mockImplementationOnce(() =>
      builderFor({ data: null, error: null })
    );
    await expect(fetchOrders()).resolves.toEqual([]);
  });

  // A database error is thrown, not swallowed.
  test('throws when the database errors', async () => {
    useFakeSupabase();
    mockFrom.mockImplementationOnce(() =>
      builderFor({ data: null, error: new Error('db down') })
    );
    await expect(fetchOrders()).rejects.toThrow('db down');
  });
});

describe('fetchOrder — Supabase path', () => {
  test('returns the mapped order when found', async () => {
    useFakeSupabase();
    const builder = builderFor({ data: dbRow, error: null });
    mockFrom.mockImplementationOnce(() => builder);
    await expect(fetchOrder('db-1')).resolves.toEqual(appOrder);
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-1');
    expect(builder.single).toHaveBeenCalled();
  });

  // A database error means "not found" here, not a crash.
  test('returns null when the database errors', async () => {
    useFakeSupabase();
    mockFrom.mockImplementationOnce(() =>
      builderFor({ data: null, error: new Error('db down') })
    );
    await expect(fetchOrder('db-1')).resolves.toBeNull();
  });

  test('returns null when data is null', async () => {
    useFakeSupabase();
    mockFrom.mockImplementationOnce(() =>
      builderFor({ data: null, error: null })
    );
    await expect(fetchOrder('db-1')).resolves.toBeNull();
  });
});

describe('updateOrderStatus — Supabase path', () => {
  test('updates the status row and returns nothing', async () => {
    useFakeSupabase();
    const builder = builderFor({ error: null });
    mockFrom.mockImplementationOnce(() => builder);
    await expect(
      updateOrderStatus({ ...appOrder, status: 2 })
    ).resolves.toBeUndefined();
    expect(builder.update).toHaveBeenCalledWith({ status: 2 });
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-1');
  });

  // A failed update is thrown so the screen can keep the old status.
  test('throws when the update errors', async () => {
    useFakeSupabase();
    mockFrom.mockImplementationOnce(() =>
      builderFor({ error: new Error('db down') })
    );
    await expect(updateOrderStatus(appOrder)).rejects.toThrow('db down');
  });
});

describe('saveOrder — Supabase path', () => {
  // The count query runs first (for the pickup number), then the order
  // insert, then the items insert. With 2 orders already in the
  // database the new pickup number is T0203.
  test('saves the order and its items, returns the saved order', async () => {
    useFakeSupabase();
    const orderBuilder = builderFor({ data: { id: 'db-9' }, error: null });
    const itemsBuilder = builderFor({ error: null });
    mockFrom
      .mockImplementationOnce(() => builderFor({ count: 2 }))
      .mockImplementationOnce(() => orderBuilder)
      .mockImplementationOnce(() => itemsBuilder);

    const saved = await saveOrder(draft);

    expect(saved).toEqual({ ...draft, id: 'db-9', pickupNumber: 'T0203' });
    expect(orderBuilder.insert).toHaveBeenCalledWith({
      order_number: 'ORD-20261124-002',
      pickup_number: 'T0203',
      store: 'Leafhaus MY Horizon Mall',
      subtotal: 11.9,
      discount: 5.95,
      total: 5.95,
      voucher_code: 'WELCOME50',
      payment: "Touch 'n Go",
      leaves: 15,
      status: 0,
    });
    expect(orderBuilder.select).toHaveBeenCalledWith('id');
    expect(orderBuilder.single).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenNthCalledWith(3, 'order_items');
    expect(itemsBuilder.insert).toHaveBeenCalledWith([
      {
        order_id: 'db-9',
        name: 'Jasmine Matcha Pure Tea',
        size: 'Regular',
        ice: 'Normal Ice',
        sweet: 'Less Sweet',
        qty: 1,
        unit_price: 11.9,
      },
    ]);
  });

  // The count query asks for a head-only count, not the rows.
  test('counts orders with a head-only query', async () => {
    useFakeSupabase();
    const countBuilder = builderFor({ count: 0 });
    const orderBuilder = builderFor({ data: { id: 'db-9' }, error: null });
    mockFrom
      .mockImplementationOnce(() => countBuilder)
      .mockImplementationOnce(() => orderBuilder)
      .mockImplementationOnce(() => builderFor({ error: null }));
    const saved = await saveOrder(draft);
    expect(countBuilder.select).toHaveBeenCalledWith('id', {
      count: 'exact',
      head: true,
    });
    // No orders yet, so the first pickup number is T0201.
    expect(saved.pickupNumber).toBe('T0201');
  });

  // A null count means the table is empty, not an error.
  test('a null count means the first order', async () => {
    useFakeSupabase();
    const orderBuilder = builderFor({ data: { id: 'db-9' }, error: null });
    mockFrom
      .mockImplementationOnce(() => builderFor({ count: null }))
      .mockImplementationOnce(() => orderBuilder)
      .mockImplementationOnce(() => builderFor({ error: null }));
    const saved = await saveOrder(draft);
    expect(saved.pickupNumber).toBe('T0201');
  });

  test('throws when the order insert errors', async () => {
    useFakeSupabase();
    mockFrom
      .mockImplementationOnce(() => builderFor({ count: 0 }))
      .mockImplementationOnce(() =>
        builderFor({ data: null, error: new Error('db down') })
      );
    await expect(saveOrder(draft)).rejects.toThrow('db down');
  });

  // The insert answered with no error but also no id — that is still a
  // failure, because the items need the new order's id.
  test('throws when the insert returns no id', async () => {
    useFakeSupabase();
    mockFrom
      .mockImplementationOnce(() => builderFor({ count: 0 }))
      .mockImplementationOnce(() =>
        builderFor({ data: null, error: null })
      );
    await expect(saveOrder(draft)).rejects.toThrow('Could not save order');
  });

  test('throws when the items insert errors', async () => {
    useFakeSupabase();
    const orderBuilder = builderFor({ data: { id: 'db-9' }, error: null });
    mockFrom
      .mockImplementationOnce(() => builderFor({ count: 0 }))
      .mockImplementationOnce(() => orderBuilder)
      .mockImplementationOnce(() =>
        builderFor({ error: new Error('items failed') })
      );
    await expect(saveOrder(draft)).rejects.toThrow('items failed');
  });
});

describe('saveOrder — pickup-number retry (Supabase path)', () => {
  // Two orders placed at the same moment both count the same number of
  // rows, so both try the same pickup number. The database rejects the
  // second one with Postgres code 23505 (unique violation on
  // pickup_number), and saveOrder retries with the next number.
  const conflictError = () =>
    Object.assign(
      new Error(
        'duplicate key value violates unique constraint "orders_pickup_number_key"'
      ),
      { code: '23505' }
    );

  test('a 23505 on the first attempt retries with the next pickup number', async () => {
    useFakeSupabase();
    const firstBuilder = builderFor({ data: null, error: conflictError() });
    const retryBuilder = builderFor({ data: { id: 'db-9' }, error: null });
    const itemsBuilder = builderFor({ error: null });
    mockFrom
      .mockImplementationOnce(() => builderFor({ count: 2 }))
      .mockImplementationOnce(() => firstBuilder)
      .mockImplementationOnce(() => retryBuilder)
      .mockImplementationOnce(() => itemsBuilder);

    const saved = await saveOrder(draft);

    // The first attempt tried T0203 and hit the conflict; the retry used
    // T0204 and saved, and the items went with the saved order.
    expect(saved).toEqual({ ...draft, id: 'db-9', pickupNumber: 'T0204' });
    expect(firstBuilder.insert).toHaveBeenCalledTimes(1);
    expect(firstBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ pickup_number: 'T0203' })
    );
    expect(retryBuilder.insert).toHaveBeenCalledTimes(1);
    expect(retryBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ pickup_number: 'T0204' })
    );
    expect(mockFrom).toHaveBeenNthCalledWith(4, 'order_items');
  });

  test('three 23505s in a row throws the last error', async () => {
    useFakeSupabase();
    const orderBuilder = builderFor({ data: null, error: conflictError() });
    mockFrom
      .mockImplementationOnce(() => builderFor({ count: 2 }))
      .mockImplementationOnce(() => orderBuilder)
      .mockImplementationOnce(() => orderBuilder)
      .mockImplementationOnce(() => orderBuilder);

    await expect(saveOrder(draft)).rejects.toThrow('duplicate key value');
    // T0203, T0204, T0205 — then it gives up, and no items were inserted.
    expect(orderBuilder.insert).toHaveBeenCalledTimes(3);
    expect(orderBuilder.insert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ pickup_number: 'T0203' })
    );
    expect(orderBuilder.insert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ pickup_number: 'T0204' })
    );
    expect(orderBuilder.insert).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ pickup_number: 'T0205' })
    );
    expect(mockFrom).not.toHaveBeenCalledWith('order_items');
  });

  // Anything that is not a pickup-number clash is a real failure — retrying
  // the same insert would only fail the same way.
  test('a non-23505 error throws immediately without retrying', async () => {
    useFakeSupabase();
    const orderBuilder = builderFor({
      data: null,
      error: new Error('db down'),
    });
    mockFrom
      .mockImplementationOnce(() => builderFor({ count: 0 }))
      .mockImplementationOnce(() => orderBuilder);

    await expect(saveOrder(draft)).rejects.toThrow('db down');
    expect(orderBuilder.insert).toHaveBeenCalledTimes(1);
    expect(orderBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ pickup_number: 'T0201' })
    );
    expect(mockFrom).not.toHaveBeenCalledWith('order_items');
  });
});

describe('saveOrder / fetchOrders / fetchOrder — local fallback', () => {
  // Offline, the order is stored on the device with a generated id and
  // the next pickup number from how many orders are already stored.
  test('saves locally with a generated id and T0201', async () => {
    const saved = await saveOrder(draft);
    expect(saved.id).toMatch(/^ORD-\d+$/);
    expect(saved.pickupNumber).toBe('T0201');
    expect(saved).toMatchObject({ ...draft });
    // It is really stored: reading it back finds the same order.
    await expect(fetchOrders()).resolves.toEqual([saved]);
  });

  test('the second local order gets T0202', async () => {
    await saveOrder(draft);
    const second = await saveOrder({ ...draft, orderNumber: 'ORD-20261124-003' });
    expect(second.pickupNumber).toBe('T0202');
  });

  // Newest first, by the order time — even when the stored list is in
  // the opposite order.
  test('fetchOrders sorts newest first', async () => {
    const older = { ...draft, id: 'ORD-1', pickupNumber: 'T0201', time: '2026-11-24T10:00:00.000Z' };
    const newer = { ...draft, id: 'ORD-2', pickupNumber: 'T0202', time: '2026-11-24T12:00:00.000Z' };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([older, newer]));
    const orders = await fetchOrders();
    expect(orders.map((o) => o.id)).toEqual(['ORD-2', 'ORD-1']);
  });

  test('fetchOrder finds by id locally', async () => {
    const saved = await saveOrder(draft);
    await expect(fetchOrder(saved.id)).resolves.toEqual(saved);
  });

  test('fetchOrder returns null for an unknown id locally', async () => {
    await saveOrder(draft);
    await expect(fetchOrder('no-such-id')).resolves.toBeNull();
  });

  test('updateOrderStatus updates and persists locally', async () => {
    const saved = await saveOrder(draft);
    await updateOrderStatus({ ...saved, status: 3 });
    const orders = await fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe(3);
  });

  // Updating an order that is not stored does nothing — no crash, and
  // the stored list is left alone.
  test('updateOrderStatus does nothing for an unknown id locally', async () => {
    const saved = await saveOrder(draft);
    await updateOrderStatus({ ...saved, id: 'no-such-id', status: 3 });
    const orders = await fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe(0);
  });

  // A corrupted stored value is treated as "no orders", not a crash.
  test('corrupted stored data reads back as an empty list', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'not-json{');
    await expect(fetchOrders()).resolves.toEqual([]);
  });

  // Storage itself failing is also treated as "no orders".
  test('a storage read failure reads back as an empty list', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('storage down'));
    await expect(fetchOrders()).resolves.toEqual([]);
  });
});

describe('formatPickupNumber', () => {
  test('the first orders are T0201, T0202, T0203', () => {
    expect(formatPickupNumber(0)).toBe('T0201');
    expect(formatPickupNumber(1)).toBe('T0202');
    expect(formatPickupNumber(2)).toBe('T0203');
  });
});

// Leafhaus — order storage.
// Supabase when configured, AsyncStorage on the device as the offline fallback.
// Table/column names match supabase-schema.sql:
//   orders (id, order_number, pickup_number, store, subtotal, discount, total,
//           voucher_code, payment, leaves, status, created_at)
//   order_items (id, order_id, name, size, ice, sweet, qty, unit_price)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { STORAGE_KEY } from './data';

async function loadLocalOrders() {
  try {
    return JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || '[]');
  } catch (e) {
    return [];
  }
}

async function saveLocalOrders(orders) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function mapDbOrder(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    pickupNumber: row.pickup_number,
    store: row.store,
    items: (row.order_items || []).map((item) => ({
      name: item.name,
      size: item.size,
      ice: item.ice,
      sweet: item.sweet,
      qty: item.qty,
      unitPrice: Number(item.unit_price),
    })),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
    voucher: row.voucher_code,
    payment: row.payment,
    leaves: row.leaves,
    status: row.status,
    time: row.created_at,
  };
}

export async function fetchOrders() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []).map(mapDbOrder);
  }
  const orders = await loadLocalOrders();
  return [...orders].sort((a, b) => new Date(b.time) - new Date(a.time));
}

export async function fetchOrder(id) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return mapDbOrder(data);
  }
  const orders = await loadLocalOrders();
  return orders.find((o) => o.id === id) || null;
}

export async function updateOrderStatus(order) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('orders')
      .update({ status: order.status })
      .eq('id', order.id);
    if (error) throw error;
    return;
  }
  const orders = await loadLocalOrders();
  const i = orders.findIndex((o) => o.id === order.id);
  if (i >= 0) {
    orders[i] = order;
    await saveLocalOrders(orders);
  }
}

// Pure helper: turn an order count into a pickup number.
// The first order of the day is T0201, the next T0202, and so on.
export function formatPickupNumber(count) {
  return 'T' + String(201 + count).padStart(4, '0');
}

async function nextPickupNumber() {
  let count = 0;
  if (isSupabaseConfigured && supabase) {
    const { count: n } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true });
    count = n || 0;
  } else {
    count = (await loadLocalOrders()).length;
  }
  return formatPickupNumber(count);
}

// Saves the order draft and returns the saved order (with its database id).
// Draft: { orderNumber, store, items, subtotal, discount, total, voucher,
//           payment, leaves, status, time }
export async function saveOrder(draft) {
  const pickupNumber = await nextPickupNumber();
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: draft.orderNumber,
        pickup_number: pickupNumber,
        store: draft.store,
        subtotal: draft.subtotal,
        discount: draft.discount,
        total: draft.total,
        voucher_code: draft.voucher,
        payment: draft.payment,
        leaves: draft.leaves,
        status: draft.status,
      })
      .select('id')
      .single();
    if (error || !data) {
      throw error || new Error('Could not save order');
    }
    const items = draft.items.map((item) => ({
      order_id: data.id,
      name: item.name,
      size: item.size,
      ice: item.ice,
      sweet: item.sweet,
      qty: item.qty,
      unit_price: item.unitPrice,
    }));
    const itemsRes = await supabase.from('order_items').insert(items);
    if (itemsRes.error) throw itemsRes.error;
    return { ...draft, id: data.id, pickupNumber };
  }
  const order = {
    ...draft,
    id: 'ORD-' + Date.now(),
    pickupNumber,
  };
  const orders = await loadLocalOrders();
  orders.unshift(order);
  await saveLocalOrders(orders);
  return order;
}

// Leafhaus — Order Details screen: pickup number, Tea Leaves, status tracker
// (dashed connectors between the steps), discount/subtotal/payment summary,
// and order time and order number behind a "More Details" fold.

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { COLORS } from '../theme';
import Header from '../Header';
import { STATUS_STEPS, formatTime, money } from '../data';
import { fetchOrder, updateOrderStatus } from '../orders';

export default function OrderScreen() {
  const route = useRoute();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const load = useCallback(async () => {
    const found = await fetchOrder(orderId);
    setOrder(found);
    setLoading(false);
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function advance() {
    if (!order || order.status >= 3 || advancing) return;
    setAdvancing(true);
    const next = { ...order, status: order.status + 1 };
    try {
      await updateOrderStatus(next);
      setOrder(next);
    } catch (e) {
      // Keep the old status if the update fails.
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.wrap}>
        <Header title="Order Details" />
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.navy} />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.wrap}>
        <Header title="Order Details" />
        <View style={styles.center}>
          <Text style={styles.muted}>Order not found.</Text>
        </View>
      </View>
    );
  }

  const done = order.status >= 3;

  return (
    <View style={styles.wrap}>
      <Header title="Order Details" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{done ? 'ORDER COMPLETED' : `ORDER ${STATUS_STEPS[order.status].toUpperCase()}`}</Text>
        <Text style={styles.heroLabel}>Pickup Number</Text>
        <Text style={styles.pickup}>{order.pickupNumber}</Text>
        <Text style={styles.leaves}>{order.leaves} Tea Leaves Earned!</Text>
      </View>

      <View style={styles.tracker}>
        {[0, 1, 2].map((i) => (
          <View
            key={`connector-${i}`}
            testID="tracker-connector"
            style={[
              styles.connector,
              { left: `${(2 * i + 1) * 12.5}%`, width: '25%' },
            ]}
          />
        ))}
        <View style={styles.trackerRow}>
          {STATUS_STEPS.map((step, i) => {
            const isDone = i <= order.status;
            return (
              <View key={step} style={styles.step}>
                <View style={[styles.dot, isDone && styles.dotDone]}>
                  <Text style={[styles.dotText, isDone && styles.dotTextDone]}>
                    {isDone ? '✓' : i + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>{step}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.line}>
        <Text style={styles.label}>Store</Text>
        <Text>{order.store}</Text>
      </View>

      {order.items.map((item, i) => (
        <View key={i} style={styles.itemRow}>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              {item.size}, {item.ice}, {item.sweet}
            </Text>
          </View>
          <Text>
            {money(item.unitPrice)} × {item.qty}
          </Text>
        </View>
      ))}

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text>Total discount</Text>
          <Text style={styles.discount}>- {money(order.discount)}</Text>
        </View>
        {order.voucher ? (
          <View style={styles.summaryRow}>
            <Text>Voucher applied</Text>
            <Text>{order.voucher}</Text>
          </View>
        ) : null}
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalLabel}>{money(order.total)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>{order.payment}</Text>
          <Text>{money(order.total)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.detailsToggle}
        onPress={() => setDetailsOpen((open) => !open)}
      >
        <Text style={styles.detailsToggleText}>
          {detailsOpen ? 'Fold ⌃' : 'More Details ⌄'}
        </Text>
      </TouchableOpacity>

      {detailsOpen ? (
        <>
          <View style={styles.line}>
            <Text style={styles.label}>Order Time</Text>
            <Text>{formatTime(order.time)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>Order Number</Text>
            <Text>{order.orderNumber}</Text>
          </View>
        </>
      ) : null}

      <TouchableOpacity
        style={[styles.primary, done && styles.primaryDisabled]}
        onPress={advance}
        disabled={done || advancing}
      >
        {advancing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>
            {done ? 'Order Completed' : 'Simulate: advance order status'}
          </Text>
        )}
      </TouchableOpacity>
      <Text style={styles.hint}>Orders are saved in My Orders.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.cream2 },
  container: { flex: 1, backgroundColor: COLORS.cream2 },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cream2 },
  muted: { color: COLORS.muted },
  hero: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    alignItems: 'center',
    padding: 18,
    marginBottom: 14,
  },
  heroTitle: { letterSpacing: 1, color: COLORS.navy, fontWeight: '700' },
  heroLabel: { color: COLORS.muted, marginTop: 10 },
  pickup: { fontSize: 40, fontWeight: '800', color: COLORS.gold, letterSpacing: 2, marginVertical: 6 },
  leaves: { color: COLORS.gold, fontWeight: '600' },
  tracker: { marginVertical: 14 },
  trackerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  // Dashed line between two adjacent step dots: absolutely positioned so
  // it runs from one dot's centre to the next (dot centres sit at 1/8,
  // 3/8, 5/8 and 7/8 of the tracker width), at dot height (the 28px dot's
  // centre is 14px down; the 2px border sits at 13–15px). The dots are
  // opaque and paint over the line ends, so the line looks joined to them.
  connector: {
    position: 'absolute',
    top: 13,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.goldSoft,
  },
  step: { flex: 1, alignItems: 'center' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  dotText: { fontSize: 13, color: COLORS.gold },
  dotTextDone: { color: '#fff' },
  stepLabel: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', marginTop: 4 },
  stepLabelDone: { color: COLORS.navy, fontWeight: '700' },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { color: COLORS.muted },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    borderStyle: 'dashed',
  },
  itemName: { fontWeight: '600' },
  itemMeta: { fontSize: 13, color: COLORS.muted },
  summary: { marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    borderStyle: 'dashed',
    marginTop: 6,
    paddingTop: 8,
  },
  totalLabel: { fontWeight: '700', color: COLORS.navy, fontSize: 17 },
  discount: { color: COLORS.red },
  detailsToggle: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  detailsToggleText: { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  primary: {
    backgroundColor: COLORS.navy,
    borderRadius: 999,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hint: { color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: 10 },
});

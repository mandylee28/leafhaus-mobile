// Leafhaus — Cart / Checkout screen: quantity editing, voucher, payment,
// place order (Supabase, or AsyncStorage when not configured).

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme';
import Header from '../Header';
import { DRINKS, LEAVES_PER_ORDER, STORES, money } from '../data';
import { useCart } from '../cart';
import { saveOrder } from '../orders';

function unitPrice(drink, size) {
  return drink.price + (size === 'Large' ? 2 : 0);
}

export default function CartScreen() {
  const navigation = useNavigation();
  const { cart, setQty, clearCart, store } = useCart();
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null); // { code, rate }
  const [voucherMsg, setVoucherMsg] = useState('');
  const [payment, setPayment] = useState("Touch 'n Go");
  const [placing, setPlacing] = useState(false);

  const subtotal = cart.reduce((sum, item) => {
    const drink = DRINKS.find((d) => d.id === item.drinkId);
    return sum + unitPrice(drink, item.size) * item.qty;
  }, 0);
  const discount = voucher ? subtotal * voucher.rate : 0;
  const total = subtotal - discount;

  function applyVoucher() {
    const code = voucherCode.trim().toUpperCase();
    const rates = { WELCOME50: 0.5, TEA20: 0.2, LEAF10: 0.1 };
    if (rates[code]) {
      setVoucher({ code, rate: rates[code] });
      setVoucherMsg(`Voucher applied: ${Math.round(rates[code] * 100)}% off.`);
    } else {
      setVoucher(null);
      setVoucherMsg('That voucher code is not valid. Try WELCOME50, TEA20 or LEAF10.');
    }
  }

  async function placeOrder() {
    if (cart.length === 0 || placing) return;
    setPlacing(true);
    try {
      const order = await saveOrder({
        orderNumber: String(Date.now()).slice(-12),
        store: store || STORES[0],
        items: cart.map((item) => {
          const drink = DRINKS.find((d) => d.id === item.drinkId);
          return {
            name: drink.name,
            size: item.size,
            ice: item.ice,
            sweet: item.sweet,
            qty: item.qty,
            unitPrice: unitPrice(drink, item.size),
          };
        }),
        subtotal,
        discount,
        total,
        voucher: voucher ? voucher.code : null,
        payment,
        leaves: LEAVES_PER_ORDER,
        status: 0,
        time: new Date().toISOString(),
      });
      clearCart();
      setVoucher(null);
      setVoucherCode('');
      navigation.navigate('Order', { orderId: order.id });
    } catch (e) {
      Alert.alert('Could not place order', 'Please check your connection and try again.');
    } finally {
      setPlacing(false);
    }
  }

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Your Cart" />
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>Your cart is empty.</Text>
          <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.primaryText}>Browse the Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Your Cart" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {cart.map((item, i) => {
        const drink = DRINKS.find((d) => d.id === item.drinkId);
        const line = unitPrice(drink, item.size) * item.qty;
        return (
          <View key={i} style={styles.item}>
            <View style={[styles.thumb, { backgroundColor: drink.bg }]}>
              <View style={[styles.thumbCup, { backgroundColor: drink.color }]} />
            </View>
            <View style={styles.info}>
              <Text style={styles.itemName}>{drink.name}</Text>
              <Text style={styles.itemMeta}>
                {item.size}, {item.ice}, {item.sweet}
              </Text>
              <View style={styles.qty}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(i, item.qty - 1)}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.qty}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(i, item.qty + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.lineTotal}>{money(line)}</Text>
          </View>
        );
      })}

      <View style={styles.voucherRow}>
        <TextInput
          style={styles.voucherInput}
          placeholder="Voucher code (e.g. WELCOME50)"
          value={voucherCode}
          onChangeText={setVoucherCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.applyButton} onPress={applyVoucher}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
      {voucherMsg ? (
        <Text style={[styles.hint, voucher && styles.hintOk]}>{voucherMsg}</Text>
      ) : null}

      <Text style={styles.label}>Payment method</Text>
      <View style={styles.options}>
        {["Touch 'n Go", 'Card', 'Cash'].map((method) => (
          <TouchableOpacity
            key={method}
            style={[styles.opt, payment === method && styles.optSelected]}
            onPress={() => setPayment(method)}
          >
            <Text style={[styles.optText, payment === method && styles.optTextSelected]}>
              {method}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text>Subtotal</Text>
          <Text>{money(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Total discount{voucher ? ` (${voucher.code})` : ''}</Text>
          <Text style={styles.discount}>- {money(discount)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalLabel}>{money(total)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primary, placing && styles.primaryDisabled]}
        onPress={placeOrder}
        disabled={placing}
      >
        {placing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Place Order · {money(total)}</Text>
        )}
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream2 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  emptyWrap: {
    flex: 1,
    backgroundColor: COLORS.cream2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  empty: { color: COLORS.muted, fontSize: 16, marginBottom: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    borderStyle: 'dashed',
    paddingVertical: 12,
  },
  thumb: {
    width: 52,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbCup: { width: 24, height: 36, borderRadius: 4 },
  info: { flex: 1 },
  itemName: { fontWeight: '700', color: COLORS.navy },
  itemMeta: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.goldSoft,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, color: COLORS.navy },
  qtyNum: { fontWeight: '700', color: COLORS.navy },
  lineTotal: { fontWeight: '700', color: COLORS.gold },
  voucherRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  voucherInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
  applyButton: {
    borderWidth: 1,
    borderColor: COLORS.navy,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  applyButtonText: { color: COLORS.navy, fontWeight: '700' },
  hint: { color: COLORS.muted, fontSize: 13, marginTop: 6 },
  hintOk: { color: COLORS.green },
  label: { fontWeight: '700', color: COLORS.navy, marginTop: 18, marginBottom: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  optSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  optText: { color: COLORS.ink },
  optTextSelected: { color: '#fff' },
  summary: { marginTop: 18, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 12 },
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
  primary: {
    backgroundColor: COLORS.navy,
    borderRadius: 999,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

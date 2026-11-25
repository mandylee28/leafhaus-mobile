// Leafhaus — Cart / Checkout screen: quantity editing, voucher, payment,
// place order (Supabase, or AsyncStorage when not configured).

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { calcTotals, unitPrice, voucherRate } from '../pricing';

export default function CartScreen() {
  const navigation = useNavigation();
  const { cart, setQty, clearCart, store } = useCart();
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null); // { code, rate }
  const [voucherMsg, setVoucherMsg] = useState('');
  const [payment, setPayment] = useState("Touch 'n Go");
  const [placing, setPlacing] = useState(false);

  // The maths lives in src/pricing.js so it can be unit-tested directly.
  const { subtotal, discount, total } = calcTotals(
    cart,
    DRINKS,
    voucher ? voucher.code : null
  );

  function applyVoucher() {
    const rate = voucherRate(voucherCode);
    if (rate) {
      const code = voucherCode.trim().toUpperCase();
      setVoucher({ code, rate });
      setVoucherMsg(`Voucher applied: ${Math.round(rate * 100)}% off.`);
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {cart.map((item, i) => {
        const drink = DRINKS.find((d) => d.id === item.drinkId);
        const line = unitPrice(drink, item.size) * item.qty;
        return (
          <View key={i} style={styles.item}>
            <View style={[styles.thumb, { backgroundColor: drink.bg }]}>
              {drink.image ? (
                <Image
                  source={drink.image}
                  style={styles.thumbImage}
                  resizeMode="contain"
                  testID={`cart-photo-${drink.id}`}
                  accessibilityLabel={drink.name}
                />
              ) : null}
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
          testID="voucher-input"
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
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  emptyWrap: {
    flex: 1,
    backgroundColor: COLORS.cream,
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
    paddingVertical: 16,
  },
  thumb: {
    width: 52,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: { width: '100%', height: '100%', borderRadius: 8 },
  info: { flex: 1 },
  itemName: { fontWeight: '700', color: COLORS.navy },
  itemMeta: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.goldSoft,
    backgroundColor: COLORS.cream2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, color: COLORS.navy },
  qtyNum: { fontWeight: '700', color: COLORS.navy },
  lineTotal: { fontWeight: '700', color: COLORS.gold },
  voucherRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  voucherInput: {
    flex: 1,
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  applyButton: {
    borderWidth: 1,
    borderColor: COLORS.navy,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  applyButtonText: { color: COLORS.navy, fontWeight: '700' },
  hint: { color: COLORS.muted, fontSize: 13, marginTop: 6 },
  hintOk: { color: COLORS.green },
  label: { fontWeight: '600', color: COLORS.navy, marginTop: 24, marginBottom: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.cream2,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  optSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  optText: { color: COLORS.ink },
  optTextSelected: { color: '#fff' },
  summary: { marginTop: 24, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    marginTop: 6,
    paddingTop: 8,
  },
  totalLabel: { fontWeight: '700', color: COLORS.navy, fontSize: 17 },
  discount: { color: COLORS.red },
  primary: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

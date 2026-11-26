// Leafhaus — Me tab: membership, account, market and help.
//
// The account figures come from the app's own data: Tea Leaves are the
// 15 leaves earned per order (summed from the saved orders), the voucher
// list is the real voucher table, and the wallet starts at zero — there
// is no top-up yet. The market sheet offers Malaysia and Singapore only;
// Singapore has no stores yet, so picking it shows as coming soon.

import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { MARKETS, VOUCHERS } from '../data';
import { useMarket } from '../market';
import { fetchOrders } from '../orders';

export default function MeScreen() {
  const { market, setMarket } = useMarket();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [picked, setPicked] = useState(market.id);
  const [benefitsOpen, setBenefitsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leaves, setLeaves] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const orders = await fetchOrders();
        setLeaves(orders.reduce((n, o) => n + (o.leaves || 0), 0));
        setOrdersCount(orders.length);
      } catch (e) {
        // Keep the zeros when the orders cannot be loaded.
      }
    })();
  }, []);

  function openSheet() {
    setPicked(market.id);
    setSheetOpen(true);
  }

  function submitMarket() {
    setMarket(picked);
    setSheetOpen(false);
  }

  const voucherList = Object.entries(VOUCHERS).map(([code, rate]) => ({
    code,
    percent: Math.round(rate * 100),
  }));

  // The top SafeAreaView keeps the profile row below the status bar /
  // Dynamic Island on a real phone — without it the avatar and "Guest"
  // sit at y=0 and are covered (seen on iPhone 26 Nov 2026). Menu and
  // Header do the same for their top bars.
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.topSafe}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>L</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>Guest</Text>
            <Text style={styles.sub}>Leafhaus Friend</Text>
          </View>
          <TouchableOpacity
            style={styles.marketButton}
            onPress={openSheet}
            testID="market-button"
          >
            <Text style={styles.marketFlag}>{market.flag}</Text>
            <Text style={styles.marketName}>{market.name}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leafhaus Friend</Text>
          <Text style={styles.cardLeaves}>{leaves} Tea Leaves</Text>
          <Text style={styles.cardSub}>
            {ordersCount === 0
              ? 'Place your first order to earn Tea Leaves.'
              : `${ordersCount} order${ordersCount === 1 ? '' : 's'} so far · 15 leaves per order.`}
          </Text>
          <TouchableOpacity
            onPress={() => setBenefitsOpen((v) => !v)}
            testID="benefits-toggle"
          >
            <Text style={styles.cardLink}>My Benefits ›</Text>
          </TouchableOpacity>
          {benefitsOpen ? (
            <View style={styles.voucherList}>
              {voucherList.map((v) => (
                <View key={v.code} style={styles.voucherRow}>
                  <Text style={styles.voucherCode}>{v.code}</Text>
                  <Text style={styles.voucherOff}>{v.percent}% off</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>MY ACCOUNT</Text>
        <View style={styles.accountRow}>
          <View style={styles.accountCell}>
            <Text style={styles.accountValue}>0.00</Text>
            <Text style={styles.accountLabel}>WALLET (RM)</Text>
          </View>
          <View style={styles.accountCell}>
            <Text style={styles.accountValue}>{leaves}</Text>
            <Text style={styles.accountLabel}>TEA LEAVES</Text>
          </View>
          <View style={styles.accountCell}>
            <Text style={styles.accountValue}>{voucherList.length}</Text>
            <Text style={styles.accountLabel}>VOUCHERS</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.row} onPress={openSheet} testID="market-row">
          <Text style={styles.rowLabel}>Market</Text>
          <Text style={styles.rowValue}>
            {market.flag} {market.name} ›
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setHelpOpen((v) => !v)}
          testID="help-row"
        >
          <Text style={styles.rowLabel}>Help Centre</Text>
          <Text style={styles.rowValue}>›</Text>
        </TouchableOpacity>
        {helpOpen ? (
          <Text style={styles.helpText}>
            Your pickup number and order time are on the Orders tab. Vouchers
            are applied in the cart before you place an order.
          </Text>
        ) : null}
      </ScrollView>
      </SafeAreaView>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
        testID="market-sheet"
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Market</Text>
              <TouchableOpacity
                onPress={() => setSheetOpen(false)}
                testID="sheet-close"
              >
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {MARKETS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.marketRow}
                onPress={() => setPicked(m.id)}
                testID={`market-${m.id}`}
              >
                <Text style={styles.marketFlag}>{m.flag}</Text>
                <Text style={styles.marketRowName}>{m.name}</Text>
                {m.comingSoon ? (
                  <Text style={styles.comingSoon}>Coming soon</Text>
                ) : null}
                <View
                  style={[styles.radio, picked === m.id && styles.radioSelected]}
                >
                  {picked === m.id ? (
                    <Text style={styles.radioCheck}>✓</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.submit}
              onPress={submitMarket}
              testID="market-submit"
            >
              <Text style={styles.submitText}>SUBMIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  topSafe: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  profileText: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  sub: { color: COLORS.muted, marginTop: 2 },
  marketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.cream2,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  marketFlag: { fontSize: 18 },
  marketName: { color: COLORS.navy, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  cardTitle: { color: COLORS.goldSoft, fontSize: 20, fontWeight: '700' },
  cardLeaves: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 8 },
  cardSub: { color: COLORS.goldSoft, marginTop: 4 },
  cardLink: { color: '#fff', fontWeight: '600', marginTop: 12 },
  voucherList: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.navySoft, paddingTop: 8 },
  voucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  voucherCode: { color: '#fff', fontWeight: '700' },
  voucherOff: { color: COLORS.goldSoft },
  sectionTitle: {
    color: COLORS.navy,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingVertical: 16,
  },
  accountCell: { flex: 1, alignItems: 'center' },
  accountValue: { fontSize: 22, fontWeight: '700', color: COLORS.navy },
  accountLabel: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  rowLabel: { color: COLORS.navy, fontWeight: '600', fontSize: 16 },
  rowValue: { color: COLORS.muted, fontSize: 16 },
  helpText: { color: COLORS.muted, marginTop: 8, paddingHorizontal: 4 },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.cream2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  sheetClose: { fontSize: 18, color: COLORS.muted, padding: 4 },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: 14,
  },
  marketRowName: { flex: 1, fontSize: 16, color: COLORS.navy },
  comingSoon: {
    backgroundColor: COLORS.goldSoft,
    color: COLORS.navy,
    fontSize: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  radioCheck: { color: '#fff', fontWeight: '700' },
  submit: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

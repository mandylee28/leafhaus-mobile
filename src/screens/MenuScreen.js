// Leafhaus — Menu screen: store picker, search, category chips, drink menu.

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { CATEGORIES, DRINKS, STORES, VOUCHERS, money } from '../data';
import { isSupabaseConfigured, supabase } from '../supabase';
import { useCart } from '../cart';

function Cup({ drink, large }) {
  return (
    <View style={[styles.cup, { backgroundColor: drink.bg }]}>
      <View style={[styles.cupLid, large && styles.cupLidLarge]} />
      <View style={[styles.cupBody, { backgroundColor: drink.color }, large && styles.cupBodyLarge]}>
        <View style={styles.cupShine} />
      </View>
    </View>
  );
}

export default function MenuScreen() {
  const navigation = useNavigation();
  const { cart, store, setStore } = useCart();
  const [stores, setStores] = useState(STORES);
  const [drinks, setDrinks] = useState(DRINKS);
  const [vouchers, setVouchers] = useState(VOUCHERS);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [dbStatus, setDbStatus] = useState('Checking database connection…');

  const activeStore = store || STORES[0];

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setDbStatus(
        'Local mode — orders are saved on this device only. Add your Supabase details in .env to use the database.'
      );
      return;
    }
    setDbStatus('Connected to the Supabase database.');
    (async () => {
      try {
        const storesRes = await supabase.from('stores').select('name').order('id');
        if (!storesRes.error && storesRes.data && storesRes.data.length > 0) {
          setStores(storesRes.data.map((s) => s.name));
        }
        const drinksRes = await supabase.from('drinks').select('*').order('id');
        if (!drinksRes.error && drinksRes.data && drinksRes.data.length > 0) {
          setDrinks(
            drinksRes.data.map((d) => ({
              id: d.id,
              name: d.name,
              price: Number(d.price),
              category: d.category,
              desc: d.description || '',
              color: d.color || '#a97c2f',
              bg: d.bg || '#f5ead2',
            }))
          );
        }
        const vouchersRes = await supabase.from('vouchers').select('code, discount_rate');
        if (!vouchersRes.error && vouchersRes.data && vouchersRes.data.length > 0) {
          const map = {};
          vouchersRes.data.forEach((v) => {
            map[v.code] = Number(v.discount_rate);
          });
          setVouchers(map);
        }
      } catch (e) {
        // Keep the built-in lists when the database cannot be reached.
      }
    })();
  }, []);

  const cartCount = cart.reduce((n, item) => n + item.qty, 0);
  const q = query.trim().toLowerCase();
  const visible = drinks.filter((d) => {
    const inCategory = category === 'All' || d.category === category;
    const inQuery =
      !q || d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q);
    return inCategory && inQuery;
  });

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.topSafe}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>🍃 Leafhaus</Text>
          <View style={styles.topButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.topButton}>My Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Text style={styles.cartButtonText}>
                Cart{cartCount > 0 ? ` (${cartCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storeRow}>
        {stores.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.storeChip, s === activeStore && styles.storeChipSelected]}
            onPress={() => setStore(s)}
          >
            <Text style={[styles.storeChipText, s === activeStore && styles.storeChipTextSelected]}>
              {s.replace('Leafhaus MY ', '')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput
        style={styles.search}
        placeholder="Search drinks…"
        value={query}
        onChangeText={setQuery}
        clearButtonMode="while-editing"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, c === category && styles.chipSelected]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, c === category && styles.chipTextSelected]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {visible.length === 0 ? (
        <Text style={styles.empty}>No drinks match your search.</Text>
      ) : (
        <View style={styles.grid}>
          {visible.map((item) => (
            <TouchableOpacity
              key={String(item.id)}
              style={styles.card}
              onPress={() => navigation.navigate('Customise', { drink: item })}
            >
              <Cup drink={item} />
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
              <Text style={styles.cardPrice}>{money(item.price)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.promo}>
        <Text style={styles.promoTitle}>Welcome offer</Text>
        <Text style={styles.promoText}>
          Use voucher WELCOME50 for 50% off your first order.
        </Text>
      </View>
      <Text style={styles.dbStatus}>{dbStatus}</Text>
      <Text style={styles.voucherHint}>
        Vouchers: {Object.keys(vouchers).join(' · ')}
      </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  topSafe: { backgroundColor: COLORS.cream },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 4, paddingBottom: 32 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  brand: { fontSize: 24, fontWeight: '800', color: COLORS.navy },
  topButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topButton: { color: COLORS.navy, fontWeight: '600' },
  cartButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cartButtonText: { color: '#fff', fontWeight: '700' },
  storeRow: { flexGrow: 0, marginBottom: 10 },
  storeChip: {
    borderWidth: 1,
    borderColor: COLORS.goldSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  storeChipSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  storeChipText: { color: COLORS.navy, fontWeight: '600' },
  storeChipTextSelected: { color: '#fff' },
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  chipRow: { flexGrow: 0, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.goldSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  chipSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { color: COLORS.navy },
  chipTextSelected: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.navy, marginTop: 8 },
  cardDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: COLORS.gold, marginTop: 6 },
  cup: {
    height: 110,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupLid: { width: 44, height: 8, borderRadius: 4, backgroundColor: COLORS.navy, marginBottom: 2 },
  cupLidLarge: { width: 54, height: 10 },
  cupBody: { width: 36, height: 56, borderRadius: 6, overflow: 'hidden' },
  cupBodyLarge: { width: 46, height: 72 },
  cupShine: {
    width: 36,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  empty: { textAlign: 'center', color: COLORS.muted, padding: 24 },
  promo: {
    backgroundColor: COLORS.navy,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  promoTitle: { color: '#fff', fontWeight: '700' },
  promoText: { color: '#fff', opacity: 0.9, marginTop: 4 },
  dbStatus: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 10 },
  voucherHint: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 4 },
});

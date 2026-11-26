// Leafhaus — Menu screen: store picker, search, category chips, drink menu.
//
// Stores follow the market (Malaysia or Singapore) from the market
// provider. Only Malaysia has stores so far — Singapore shows a
// coming-soon card instead of the menu.

import React, { useEffect, useState } from 'react';
import {
  Image,
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
import { useMarket } from '../market';

export default function MenuScreen() {
  const navigation = useNavigation();
  const { store, setStore } = useCart();
  const { market, setMarket } = useMarket();
  const [stores, setStores] = useState(STORES);
  const [drinks, setDrinks] = useState(DRINKS);
  const [vouchers, setVouchers] = useState(VOUCHERS);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [dbStatus, setDbStatus] = useState('Checking database connection…');

  // Only Malaysia has stores so far; Singapore shows a coming-soon card.
  const marketStores = market.id === 'MY' ? stores : [];
  const activeStore = marketStores.includes(store)
    ? store
    : marketStores[0];

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
            drinksRes.data.map((d) => {
              // The database holds no photos: reuse the built-in photo for
              // the same drink id, so database drinks show a photo too.
              const local = DRINKS.find((b) => b.id === d.id);
              return {
                id: d.id,
                name: d.name,
                price: Number(d.price),
                category: d.category,
                desc: d.description || '',
                color: d.color || '#a97c2f',
                // One neutral photo background for every drink, so
                // database drinks match the built-in ones.
                bg: '#f3ecdc',
                image: local ? local.image : undefined,
              };
            })
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
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {market.comingSoon ? (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonTitle}>
            {market.flag} {market.name} — Coming soon
          </Text>
          <Text style={styles.comingSoonText}>
            Leafhaus stores are on their way to Singapore. Browse the
            Malaysia menu for now.
          </Text>
          <TouchableOpacity
            style={styles.comingSoonButton}
            onPress={() => setMarket('MY')}
          >
            <Text style={styles.comingSoonButtonText}>
              Browse Malaysia stores
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storeRow} keyboardShouldPersistTaps="handled">
        {marketStores.map((s) => (
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} keyboardShouldPersistTaps="handled">
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
              <View style={[styles.drinkPhoto, { backgroundColor: item.bg }]}>
                {item.image ? (
                  <Image
                    source={item.image}
                    style={styles.drinkImage}
                    resizeMode="contain"
                    testID={`drink-photo-${item.id}`}
                    accessibilityLabel={item.name}
                  />
                ) : null}
              </View>
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
        </>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  topSafe: { backgroundColor: COLORS.cream },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 4, paddingBottom: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  brand: { fontSize: 22, fontWeight: '700', color: COLORS.navy, letterSpacing: 0.5 },
  comingSoon: {
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
  },
  comingSoonTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy },
  comingSoonText: { color: COLORS.muted, marginTop: 8 },
  comingSoonButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  comingSoonButtonText: { color: '#fff', fontWeight: '700' },
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
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    padding: 12,
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
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.navy, marginTop: 8 },
  cardDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: COLORS.gold, marginTop: 6 },
  drinkPhoto: {
    height: 110,
    borderRadius: 8,
    backgroundColor: COLORS.cream2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  drinkImage: { width: '100%', height: '100%' },
  empty: { textAlign: 'center', color: COLORS.muted, padding: 24 },
  promo: {
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  promoTitle: { color: COLORS.navy, fontWeight: '700' },
  promoText: { color: COLORS.muted, marginTop: 4 },
  dbStatus: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 10 },
  voucherHint: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 4 },
});

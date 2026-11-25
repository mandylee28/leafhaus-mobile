// Leafhaus — Drink customisation screen: size, ice, sweetness, quantity.

import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../theme';
import Header from '../Header';
import { money } from '../data';
import { useCart } from '../cart';

function OptionGroup({ label, options, value, onPick }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.opt, value === opt && styles.optSelected]}
            onPress={() => onPick(opt)}
          >
            <Text style={[styles.optText, value === opt && styles.optTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function CustomiseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { drink } = route.params;
  const { addItem } = useCart();

  const [size, setSize] = useState('Regular');
  const [ice, setIce] = useState('Normal Ice');
  const [sweet, setSweet] = useState(drink.id === 1 ? 'Less Sweet' : 'Normal Sweet');
  const [qty, setQty] = useState(1);

  const unitPrice = drink.price + (size === 'Large' ? 2 : 0);

  function addToCart() {
    addItem({ drinkId: drink.id, size, ice, sweet, qty });
    navigation.navigate('Cart');
  }

  return (
    <View style={styles.container}>
      <Header title="Customise Drink" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={[styles.photo, { backgroundColor: drink.bg }]}>
        {drink.image ? (
          <Image
            source={drink.image}
            style={styles.photoImage}
            resizeMode="contain"
            testID="drink-photo"
            accessibilityLabel={drink.name}
          />
        ) : null}
      </View>
      <Text style={styles.name}>{drink.name}</Text>
      <Text style={styles.price}>{money(unitPrice)}</Text>
      <Text style={styles.desc}>{drink.desc}</Text>

      <OptionGroup
        label="Size"
        options={['Regular', 'Large']}
        value={size}
        onPick={setSize}
      />
      {size === 'Large' && <Text style={styles.note}>Large is +RM 2.00</Text>}
      <OptionGroup
        label="Ice"
        options={['Normal Ice', 'Less Ice', 'No Ice']}
        value={ice}
        onPick={setIce}
      />
      <OptionGroup
        label="Sweetness"
        options={['Normal Sweet', 'Less Sweet', 'No Sugar']}
        value={sweet}
        onPick={setSweet}
      />

      <View style={styles.qtyRow}>
        <Text style={styles.label}>Quantity</Text>
        <View style={styles.qty}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{qty}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={addToCart}>
        <Text style={styles.addButtonText}>
          Add to Cart · {money(unitPrice * qty)}
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  photo: {
    height: 150,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  photoImage: { width: '100%', height: '100%' },
  name: { fontSize: 24, fontWeight: '700', color: COLORS.navy, letterSpacing: 0.5 },
  price: { fontSize: 18, fontWeight: '700', color: COLORS.gold, marginTop: 4 },
  desc: { color: COLORS.muted, marginTop: 4 },
  group: { marginTop: 24 },
  label: { fontWeight: '600', color: COLORS.navy, marginBottom: 8 },
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
  note: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.goldSoft,
    backgroundColor: COLORS.cream2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 20, color: COLORS.navy },
  qtyNum: { fontSize: 18, fontWeight: '700', color: COLORS.navy },
  addButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

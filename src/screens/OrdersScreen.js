// Leafhaus — My Orders screen: newest first, tap an order to open its details.

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme';
import Header from '../Header';
import { STATUS_STEPS, formatTime, money } from '../data';
import { fetchOrders } from '../orders';

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setOrders(await fetchOrders());
        } catch (e) {
          setOrders([]);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.wrap}>
        <Header title="My Orders" />
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.navy} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Header title="My Orders" />
      <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={orders}
      keyExtractor={(o) => o.id}
      ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Order', { orderId: item.id })}
        >
          <Text style={styles.title}>
            {item.pickupNumber} — {STATUS_STEPS[item.status]}
          </Text>
          <Text style={styles.sub}>
            {item.store} · {formatTime(item.time)}
          </Text>
          <Text style={styles.sub}>
            {item.items.length} item(s) · {money(item.total)} · {item.payment}
          </Text>
        </TouchableOpacity>
      )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.cream },
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: { padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cream },
  empty: { textAlign: 'center', color: COLORS.muted, padding: 24 },
  card: {
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: { fontWeight: '700', color: COLORS.navy, fontSize: 16 },
  sub: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
});

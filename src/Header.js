// Leafhaus — shared custom header: fixed top bar with a back button and a
// centered title. Used on every screen except Menu (which has its own
// fixed top bar). The native navigation header is hidden globally.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from './theme';

export default function Header({ title }) {
  const navigation = useNavigation();
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.bar}>
        <TouchableOpacity style={styles.side} testID="header-back" onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.side} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: COLORS.cream2 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  side: { width: 64 },
  back: { color: COLORS.navy, fontWeight: '700', fontSize: 16 },
  title: {
    flex: 1,
    color: COLORS.navy,
    fontWeight: '700',
    fontSize: 17,
    textAlign: 'center',
  },
});
